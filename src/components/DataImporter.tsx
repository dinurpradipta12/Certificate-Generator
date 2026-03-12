import { useState, useRef, type DragEvent } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2, Download } from 'lucide-react';
import Papa from 'papaparse';
import type { AppConfig, StudentData } from '../types';
import { cn } from '../utils/cn';

interface Props {
  config: AppConfig;
  students: StudentData[];
  setStudents: (students: StudentData[]) => void;
}

export default function DataImporter({ config, students, setStudents }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateGrade = (avg: number) => {
    if (avg >= 90) return 'A+';
    if (avg >= 85) return 'A';
    if (avg >= 80) return 'B+';
    if (avg >= 70) return 'B';
    if (avg >= 60) return 'C';
    return 'D';
  };

  const calculateDescription = (avg: number) => {
    if (avg >= 90) return 'Superstar';
    if (avg >= 85) return 'Very Good';
    if (avg >= 80) return 'Good';
    if (avg >= 70) return 'Average';
    if (avg >= 60) return 'Below Average';
    return 'Very Poor';
  };

  const parseNumber = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Handle comma as decimal separator (e.g., "22,5" -> "22.5")
    const sanitized = val.toString().replace(',', '.');
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const processCSV = (file: File) => {
    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
      transform: (value) => typeof value === 'string' ? value.trim() : value,
      complete: (results) => {
        const { data, meta } = results;
        
        if (!data || data.length === 0) {
          setError('The file is empty.');
          return;
        }

        const headers = meta.fields || [];
        const nameHeader = headers.find(h => h.toLowerCase().includes('nama') || h.toLowerCase().includes('name'));
        const programHeader = headers.find(h => h.toLowerCase().includes('program'));
        const certIdHeader = headers.find(h => h.toLowerCase().includes('no credentials') || h.toLowerCase().includes('id') || h.toLowerCase().includes('certificate') || h.toLowerCase().includes('kredensial'));
        const periodeHeader = headers.find(h => h.toLowerCase().includes('periode') || h.toLowerCase().includes('period'));
        
        // Pre-calculated headers
        const finalAvgHeader = headers.find(h => h.toLowerCase().includes('rata-rata nilai') || h.toLowerCase().includes('average') || h.toLowerCase().includes('final average'));
        const gradeHeader = headers.find(h => h.toLowerCase().includes('grade') || h.toLowerCase().includes('nilai huruf'));
        const descHeader = headers.find(h => h.toLowerCase().includes('keterangan') || h.toLowerCase().includes('description'));

        if (!nameHeader) {
          setError('Could not find a "Nama" or "Name" column in the CSV.');
          return;
        }

        const newStudents: StudentData[] = data.map((row: any, index) => {
          const scores: Record<string, number> = {};
          const categoryAverages: Record<string, number> = {};
          
          // Try to find category averages directly from columns first
          config.assessmentCategories.forEach(cat => {
            // Look for "Rata-rata [Category Name]" or just "[Category Name]"
            const catHeader = headers.find(h => 
              h.toLowerCase().includes(cat.name.toLowerCase()) || 
              h.toLowerCase().includes(`rata-rata ${cat.name.toLowerCase()}`)
            );

            if (catHeader) {
              categoryAverages[cat.id] = parseNumber(row[catHeader]);
            } else {
              // Fallback to calculating from sub-fields if columns exist
              let catTotal = 0;
              let fieldCount = 0;
              cat.fields.forEach(field => {
                const val = parseNumber(row[field.name] || row[field.id]);
                scores[field.id] = val;
                catTotal += val;
                fieldCount++;
              });
              const catAvg = fieldCount > 0 ? catTotal / fieldCount : 0;
              categoryAverages[cat.id] = parseFloat(catAvg.toFixed(2));
            }
          });

          let finalAverage = 0;
          if (finalAvgHeader) {
            finalAverage = parseNumber(row[finalAvgHeader]);
          } else {
            let totalCatAvg = 0;
            let catCount = 0;
            Object.values(categoryAverages).forEach(avg => {
              totalCatAvg += avg;
              catCount++;
            });
            finalAverage = catCount > 0 ? totalCatAvg / catCount : 0;
          }

          const grade = gradeHeader ? row[gradeHeader] : calculateGrade(finalAverage);
          const description = descHeader ? row[descHeader] : calculateDescription(finalAverage);
          
          return {
            id: `student-${Date.now()}-${index}`,
            name: row[nameHeader] || 'Unknown Student',
            program: programHeader ? row[programHeader] : (config.defaultProgramName || 'Bootcamp Program'),
            certId: certIdHeader ? row[certIdHeader] : `CERT-${Date.now()}-${index}`,
            periode: periodeHeader ? row[periodeHeader] : '2024',
            scores,
            categoryAverages,
            finalAverage: parseFloat(finalAverage.toFixed(2)),
            grade: grade || calculateGrade(finalAverage),
            description: description || calculateDescription(finalAverage),
          };
        });

        setStudents(newStudents);
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
      }
    });
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      processCSV(file);
    } else {
      setError('Please upload a valid CSV file.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-8 border border-border-default shadow-elevation-low">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-medium tracking-tight text-foreground">Import Student Data</h3>
            <p className="text-sm text-foreground-muted">Upload a CSV file with student names and scores.</p>
          </div>
          <button
            onClick={() => {
              const headers = [
                'Nama', 
                'Periode', 
                'No Credentials', 
                'Rata-rata Post test', 
                'Rata-rata Assignment', 
                'Rata-rata Group Challenge', 
                'Keaktifan', 
                'Rata-rata Nilai', 
                'Grade', 
                'Keterangan'
              ];
              const csv = [
                headers.join(','), 
                ['Isma Azizi Baqiyatussalim', '1 Nov - 30 Nov 2025', 'RS-14/SMS-MB/1886', '70', '84', '0', '85', '60', 'C', 'Below Average'].join(','),
                ['Hasna Abidah Zain', '1 Nov - 30 Nov 2025', 'RS-14/SMS-MB/1887', '22,5', '41', '0', '80', '36', 'D', 'Very Poor'].join(',')
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'bootcamp_recap_sample.csv';
              link.click();
            }}
            className="text-xs font-medium text-accent hover:text-accent-bright flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Download size={14} />
            Download Recap Sample CSV
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer",
            isDragging ? "border-accent bg-accent/10" : "border-border-default hover:border-accent/50 hover:bg-white/5"
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && processCSV(e.target.files[0])}
            accept=".csv"
            className="hidden"
          />
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent shadow-[inset_0_0_20px_rgba(94,106,210,0.1)]">
            <Upload size={32} />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Click to upload or drag and drop</p>
            <p className="text-sm text-foreground-muted/50 mt-1">Only CSV files are supported</p>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
      </div>

      {students.length > 0 && (
        <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-border-default shadow-elevation-low overflow-hidden">
          <div className="p-6 border-b border-border-default flex items-center justify-between">
            <h4 className="font-medium text-foreground">Imported Students ({students.length})</h4>
            <button
              onClick={() => setStudents([])}
              className="text-xs font-medium text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-foreground-muted font-medium">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Periode</th>
                  <th className="px-6 py-4">Cert ID</th>
                  {config.assessmentCategories.map(c => (
                    <th key={c.id} className="px-6 py-4">{c.name} (Avg)</th>
                  ))}
                  <th className="px-6 py-4">Final Avg</th>
                  <th className="px-6 py-4">Grade</th>
                  <th className="px-6 py-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{student.name}</td>
                    <td className="px-6 py-4 text-foreground-muted">{student.periode}</td>
                    <td className="px-6 py-4 text-foreground-muted">{student.certId}</td>
                    {config.assessmentCategories.map(c => (
                      <td key={c.id} className="px-6 py-4 text-foreground-muted">{student.categoryAverages[c.id] || 0}</td>
                    ))}
                    <td className="px-6 py-4 font-bold text-accent">{student.finalAverage}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-xs font-medium",
                        student.grade.startsWith('A') ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        student.grade.startsWith('B') ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        student.grade.startsWith('C') ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border border-red-500/20"
                      )}>
                        {student.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs italic text-foreground-muted/50">{student.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
