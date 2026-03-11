import { useState } from 'react';
import { Download, FileText, CheckCircle2, Loader2, Eye, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import type { AppConfig, StudentData, CertificateField } from '../types';
import { cn } from '../utils/cn';

interface Props {
  config: AppConfig;
  students: StudentData[];
}

export default function ExportManager({ config, students }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewStudent, setPreviewStudent] = useState<StudentData | null>(null);

  const generatePDF = async (student: StudentData): Promise<Blob> => {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1920, 1080], // HD resolution
    });

    const renderPage = async (page: 1 | 2) => {
      const template = page === 1 ? config.templateImages.page1 : config.templateImages.page2;
      if (!template) return;

      if (page === 2) pdf.addPage([1920, 1080], 'landscape');

      // Add background image
      pdf.addImage(template, 'PNG', 0, 0, 1920, 1080);

      // Add fields
      const fields = config.certificateFields.filter(f => f.page === page);
      fields.forEach(field => {
        let text = '';
        if (field.type.startsWith('category_avg:')) {
          const catId = field.type.split(':')[1];
          text = (student.categoryAverages[catId] || 0).toString();
        } else {
          switch (field.type) {
            case 'name': text = student.name; break;
            case 'program': text = student.program; break;
            case 'certId': text = student.certId; break;
            case 'periode': text = student.periode; break;
            case 'average': text = student.finalAverage.toString(); break;
            case 'grade': text = student.grade; break;
            case 'description': text = student.description; break;
            case 'date': text = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); break;
            case 'custom': text = field.label; break;
          }
        }

        // Handle custom fonts
        const isCustomFont = config.customFonts.some(f => f.name === field.fontFamily);
        if (isCustomFont) {
          const font = config.customFonts.find(f => f.name === field.fontFamily)!;
          const fontData = font.data.split(',')[1];
          pdf.addFileToVFS(`${font.name}.ttf`, fontData);
          pdf.addFont(`${font.name}.ttf`, font.name, 'normal');
          pdf.setFont(font.name, 'normal');
        } else {
          pdf.setFont(field.fontFamily, field.bold ? 'bold' : 'normal');
        }

        pdf.setFontSize(field.fontSize * 2); // Scale font for HD
        pdf.setTextColor(field.color);
        
        const x = (field.x / 100) * 1920;
        const y = (field.y / 100) * 1080;
        
        pdf.text(text, x, y, { align: field.align || 'center' });
      });
    };

    await renderPage(1);
    if (config.templateImages.page2) {
      await renderPage(2);
    }

    return pdf.output('blob');
  };

  const handleExportAll = async () => {
    if (students.length === 0) return;
    setIsGenerating(true);
    setProgress(0);

    try {
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const blob = await generatePDF(student);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Certificate_${student.name.replace(/\s+/g, '_')}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        
        setProgress(Math.round(((i + 1) / students.length) * 100));
        // Small delay to prevent browser from blocking multiple downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async (student: StudentData) => {
    const blob = await generatePDF(student);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold">Export Certificates</h3>
            <p className="text-sm text-gray-500">Generate and download certificates for all students.</p>
          </div>
          <button
            onClick={handleExportAll}
            disabled={isGenerating || students.length === 0 || !config.templateImages.page1}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer",
              isGenerating || students.length === 0 || !config.templateImages.page1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Generating {progress}%
              </>
            ) : (
              <>
                <Download size={18} />
                Export All ({students.length})
              </>
            )}
          </button>
        </div>

        {!config.templateImages.page1 && (
          <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex items-center gap-3 text-yellow-700 text-sm mb-6">
            <AlertCircle size={18} />
            Please upload at least Page 1 of the certificate template in the Design tab.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-bold border border-gray-100">
                  {student.grade}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">Avg: {student.finalAverage}</p>
                </div>
              </div>
              <button
                onClick={() => handlePreview(student)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                title="Preview PDF"
              >
                <Eye size={18} />
              </button>
            </div>
          ))}

          {students.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
              <FileText className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-gray-400 text-sm">No student data imported yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="text-xl font-bold mb-2">Bulk Processing</h4>
          <p className="text-indigo-100 text-sm max-w-md">
            The system will generate individual PDF files for each student. 
            Make sure to allow multiple downloads in your browser settings.
          </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
          <Download size={160} />
        </div>
      </div>
    </div>
  );
}
