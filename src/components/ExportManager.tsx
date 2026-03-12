import { useState } from 'react';
import { Download, FileText, CheckCircle2, Loader2, Eye, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { AppConfig, StudentData, CertificateField } from '../types';
import { cn } from '../utils/cn';

interface Props {
  config: AppConfig;
  students: StudentData[];
}

export default function ExportManager({ config, students }: Props) {
  const [exportState, setExportState] = useState<{
    isExporting: boolean;
    statusText: string;
    progress: number;
  }>({ isExporting: false, statusText: '', progress: 0 });
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingType, setProcessingType] = useState<'preview' | 'download' | null>(null);

  const getImageDimensions = (dataUrl: string): Promise<{ width: number, height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = dataUrl;
    });
  };

  const generatePDF = async (student: StudentData): Promise<Blob> => {
    if (!config.templateImages.page1) throw new Error("Template missing");

    const dimensions = await getImageDimensions(config.templateImages.page1);
    let { width, height } = dimensions;
    
    // Cap at 1600 to make the application lighter and faster
    const MAX_DIMENSION = 1600;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width > height) {
        height = (height / width) * MAX_DIMENSION;
        width = MAX_DIMENSION;
      } else {
        width = (width / height) * MAX_DIMENSION;
        height = MAX_DIMENSION;
      }
    }

    const orientation = width > height ? 'landscape' : 'portrait';

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'px',
      format: [width, height],
      compress: true, // Enable compression to reduce file size
    });

    const renderPage = async (page: 1 | 2) => {
      const template = page === 1 ? config.templateImages.page1 : config.templateImages.page2;
      if (!template) return;

      if (page === 2) pdf.addPage([width, height], orientation);

      // Ensure custom fonts are loaded in the browser's document.fonts
      if ('fonts' in document) {
        for (const font of config.customFonts) {
          let isLoaded = false;
          document.fonts.forEach((f) => {
            if (f.family === font.name || f.family === `"${font.name}"`) isLoaded = true;
          });
          if (!isLoaded) {
            try {
              const fontFace = new FontFace(font.name, `url(${font.data})`);
              const loadedFace = await fontFace.load();
              document.fonts.add(loadedFace);
            } catch (e) {
              console.error(`Failed to load font ${font.name} into browser`, e);
            }
          }
        }
        await document.fonts.ready;
      }

      // Create a canvas to draw the template and text
      const canvas = document.createElement('canvas');
      // Use a higher resolution for the canvas to ensure text is crisp
      const scale = 2; 
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill white background first (in case of transparent PNG)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = template;
      });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw fields
      const fields = config.certificateFields.filter(f => f.page === page);
      fields.forEach(field => {
        let text = '';
        if (field.type.startsWith('category_avg:')) {
          const catId = field.type.split(':')[1];
          text = (student.categoryAverages?.[catId] || 0).toString();
        } else {
          switch (field.type) {
            case 'name': text = student.name || ''; break;
            case 'program': text = student.program || config.defaultProgramName || ''; break;
            case 'certId': text = student.certId || ''; break;
            case 'periode': text = student.periode || ''; break;
            case 'average': text = student.finalAverage?.toString() || '0'; break;
            case 'grade': text = student.grade || ''; break;
            case 'description': text = student.description || ''; break;
            case 'date': text = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); break;
            case 'custom': text = field.label || ''; break;
          }
        }

        // Scale font size based on the export height (assuming 540px was the baseline for 1x font size)
        const scaleFactor = height / 540;
        // Apply canvas scale
        const fontSizePx = field.fontSize * scaleFactor * scale;
        
        ctx.font = `${field.bold ? 'bold ' : ''}${fontSizePx}px "${field.fontFamily}", sans-serif`;
        ctx.fillStyle = field.color;
        ctx.textAlign = field.align as CanvasTextAlign;
        ctx.textBaseline = 'middle';
        
        const x = (field.x / 100) * canvas.width;
        const y = (field.y / 100) * canvas.height;
        
        ctx.fillText(String(text || ''), x, y);
      });

      // Convert canvas to image and add to PDF
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height, undefined, 'FAST');
    };

    await renderPage(1);
    if (config.templateImages.page2) {
      await renderPage(2);
    }

    return pdf.output('blob');
  };

  const handleExportAll = async () => {
    if (students.length === 0) return;
    setExportState({ isExporting: true, statusText: 'Preparing files...', progress: 0 });

    try {
      const zip = new JSZip();
      
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        setExportState({ 
          isExporting: true, 
          statusText: `Generating PDF for ${student.name} (${i + 1}/${students.length})`, 
          progress: Math.round(((i) / students.length) * 50) // First 50% is PDF generation
        });
        
        const blob = await generatePDF(student);
        const fileName = `Certificate_${student.name.replace(/\s+/g, '_')}.pdf`;
        
        zip.file(fileName, blob);
        
        // Small delay to allow UI to update and prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      setExportState({ isExporting: true, statusText: 'Compressing into ZIP file...', progress: 50 });
      
      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setExportState({ 
          isExporting: true, 
          statusText: `Compressing into ZIP file...`, 
          progress: 50 + Math.round(metadata.percent / 2) // Next 50% is zipping
        });
      });
      
      setExportState({ isExporting: true, statusText: 'Downloading...', progress: 100 });
      saveAs(zipBlob, 'Certificates.zip');
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setTimeout(() => {
        setExportState({ isExporting: false, statusText: '', progress: 0 });
      }, 1000);
    }
  };

  const handlePreview = async (student: StudentData) => {
    setProcessingId(student.id);
    setProcessingType('preview');
    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10));
      const blob = await generatePDF(student);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setProcessingId(null);
      setProcessingType(null);
    }
  };

  const handleDownloadSingle = async (student: StudentData) => {
    setProcessingId(student.id);
    setProcessingType('download');
    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10));
      const blob = await generatePDF(student);
      const fileName = `Certificate_${student.name.replace(/\s+/g, '_')}.pdf`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setProcessingId(null);
      setProcessingType(null);
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Progress Overlay */}
      {exportState.isExporting && (
        <div className="fixed inset-0 z-[100] bg-background-base/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-default rounded-2xl p-8 max-w-md w-full shadow-elevation-high flex flex-col items-center text-center">
            <Loader2 className="animate-spin text-accent mb-4" size={48} />
            <h3 className="text-xl font-medium text-foreground mb-2">Generating Certificates</h3>
            <p className="text-sm text-foreground-muted mb-6">{exportState.statusText}</p>
            
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-border-default">
              <div 
                className="bg-accent h-full transition-all duration-300 ease-out" 
                style={{ width: `${exportState.progress}%` }}
              />
            </div>
            <p className="text-xs font-medium text-foreground mt-2">{exportState.progress}%</p>
          </div>
        </div>
      )}

      <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-8 border border-border-default shadow-elevation-low">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-medium tracking-tight text-foreground">Export Certificates</h3>
            <p className="text-sm text-foreground-muted">Generate and download certificates for all students.</p>
          </div>
          <button
            onClick={handleExportAll}
            disabled={exportState.isExporting || students.length === 0 || !config.templateImages.page1}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
              exportState.isExporting || students.length === 0 || !config.templateImages.page1
                ? "bg-white/5 text-foreground-muted/50 cursor-not-allowed border border-border-default"
                : "bg-accent text-white hover:bg-accent-bright shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_0_1px_rgba(104,114,217,0.6),0_8px_20px_rgba(94,106,210,0.4),inset_0_1px_0_0_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
            )}
          >
            {exportState.isExporting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Generating...
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
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-400 text-sm mb-6">
            <AlertCircle size={18} />
            Please upload at least Page 1 of the certificate template in the Design tab.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="p-4 bg-white/5 rounded-2xl border border-border-default flex items-center justify-between group hover:bg-white/10 hover:shadow-elevation-medium transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-accent font-bold border border-border-default shadow-[inset_0_0_20px_rgba(94,106,210,0.1)]">
                  {student.grade}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{student.name}</p>
                  <p className="text-xs text-foreground-muted">Avg: {student.finalAverage}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePreview(student)}
                  disabled={!config.templateImages.page1 || processingId === student.id}
                  className="p-2 text-foreground-muted/50 hover:text-accent hover:bg-accent/10 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Preview PDF"
                >
                  {processingId === student.id && processingType === 'preview' ? <Loader2 size={18} className="animate-spin text-accent" /> : <Eye size={18} />}
                </button>
                <button
                  onClick={() => handleDownloadSingle(student)}
                  disabled={!config.templateImages.page1 || processingId === student.id}
                  className="p-2 text-foreground-muted/50 hover:text-accent hover:bg-accent/10 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download PDF"
                >
                  {processingId === student.id && processingType === 'download' ? <Loader2 size={18} className="animate-spin text-accent" /> : <Download size={18} />}
                </button>
              </div>
            </div>
          ))}

          {students.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-border-default rounded-2xl bg-white/5">
              <FileText className="mx-auto text-foreground-muted/30 mb-2" size={32} />
              <p className="text-foreground-muted text-sm">No student data imported yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-accent rounded-2xl p-8 text-white relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
        <div className="relative z-10">
          <h4 className="text-xl font-medium tracking-tight mb-2">Bulk Processing</h4>
          <p className="text-white/80 text-sm max-w-md">
            The system will generate individual PDF files for each student and bundle them into a single ZIP file for easy downloading.
          </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
          <Download size={160} />
        </div>
      </div>
    </div>
  );
}
