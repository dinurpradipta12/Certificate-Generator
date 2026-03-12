import { useState, useRef, useEffect, type MouseEvent, type ChangeEvent } from 'react';
import { Upload, Trash2, Move, Type, Palette, Bold, ChevronLeft, ChevronRight, Plus, Type as FontIcon, AlignLeft, AlignCenter, AlignRight, Pipette, Copy, Save, Download, FolderOpen } from 'lucide-react';
import type { AppConfig, CertificateField, CustomFont, StudentData } from '../types';
import { cn } from '../utils/cn';

interface Props {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  students: StudentData[];
}

interface SavedTemplate {
  id: string;
  name: string;
  config: AppConfig;
  createdAt: number;
}

export default function CertificateDesigner({ config, setConfig, students }: Props) {
  const [activeTab, setActiveTab] = useState<'page1' | 'page2' | 'templates'>('page1');
  const activePage = activeTab === 'page2' ? 2 : 1;
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState<number>(540);
  const [previewHeight, setPreviewHeight] = useState<number>(540);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('certificate_templates');
    if (saved) {
      try {
        setSavedTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved templates', e);
      }
    }
  }, []);

  const saveCurrentAsTemplate = () => {
    const name = prompt('Enter a name for this template:');
    if (!name) return;

    const newTemplate: SavedTemplate = {
      id: `template-${Date.now()}`,
      name,
      config,
      createdAt: Date.now()
    };

    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem('certificate_templates', JSON.stringify(updated));
    alert('Template saved successfully!');
  };

  const loadTemplate = (template: SavedTemplate) => {
    if (confirm('Are you sure you want to load this template? Your current design will be overwritten.')) {
      setConfig(template.config);
      setActiveTab('page1');
    }
  };

  const deleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const updated = savedTemplates.filter(t => t.id !== id);
      setSavedTemplates(updated);
      localStorage.setItem('certificate_templates', JSON.stringify(updated));
    }
  };

  useEffect(() => {
    if (activeTab === 'templates') return;
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setEditorHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [config.templateImages.page1, config.templateImages.page2, activeTab]);

  useEffect(() => {
    if (activeTab === 'templates') return;
    if (!previewContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setPreviewHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(previewContainerRef.current);
    return () => observer.disconnect();
  }, [config.templateImages.page1, config.templateImages.page2, activeTab]);

  useEffect(() => {
    if (activeTab === 'templates') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedFieldId) return;
      
      // Prevent default scrolling when using arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      const field = config.certificateFields.find(f => f.id === selectedFieldId);
      if (!field) return;

      // Move by 1% per click
      const step = 1;

      let newX = field.x;
      let newY = field.y;

      switch (e.key) {
        case 'ArrowUp':
          newY = Math.max(0, field.y - step);
          break;
        case 'ArrowDown':
          newY = Math.min(100, field.y + step);
          break;
        case 'ArrowLeft':
          newX = Math.max(0, field.x - step);
          break;
        case 'ArrowRight':
          newX = Math.min(100, field.x + step);
          break;
        default:
          return;
      }

      updateField(selectedFieldId, { x: newX, y: newY });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId, config.certificateFields, activeTab]);

  const handleImageUpload = (page: 1 | 2, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setConfig({
          ...config,
          templateImages: {
            ...config.templateImages,
            [page === 1 ? 'page1' : 'page2']: base64,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFontUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const fontName = file.name.split('.')[0];
        const newFont: CustomFont = {
          id: `font-${Date.now()}`,
          name: fontName,
          data: base64,
        };
        
        // Add font to document for preview
        const fontFace = new FontFace(fontName, `url(${base64})`);
        fontFace.load().then((loadedFace) => {
          document.fonts.add(loadedFace);
          setConfig({
            ...config,
            customFonts: [...config.customFonts, newFont],
          });
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addField = () => {
    const newField: CertificateField = {
      id: `field-${Date.now()}`,
      label: 'New Field',
      type: 'custom',
      x: 50,
      y: 50,
      fontSize: 24,
      color: '#000000',
      bold: false,
      fontFamily: 'helvetica',
      align: 'center',
      page: activePage,
    };
    setConfig({
      ...config,
      certificateFields: [...config.certificateFields, newField],
    });
    setSelectedFieldId(newField.id);
  };

  const updateField = (id: string, updates: Partial<CertificateField>) => {
    setConfig({
      ...config,
      certificateFields: config.certificateFields.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    });
  };

  const removeField = (id: string) => {
    setConfig({
      ...config,
      certificateFields: config.certificateFields.filter((f) => f.id !== id),
    });
    setSelectedFieldId(null);
  };

  const duplicateField = (id: string) => {
    const fieldToDuplicate = config.certificateFields.find(f => f.id === id);
    if (!fieldToDuplicate) return;

    const newField: CertificateField = {
      ...fieldToDuplicate,
      id: `field-${Date.now()}`,
      x: Math.min(100, fieldToDuplicate.x + 2), // Offset slightly so it doesn't perfectly overlap
      y: Math.min(100, fieldToDuplicate.y + 2),
    };

    setConfig({
      ...config,
      certificateFields: [...config.certificateFields, newField],
    });
    setSelectedFieldId(newField.id);
  };

  const handleMouseDown = (id: string, e: MouseEvent) => {
    e.preventDefault();
    setSelectedFieldId(id);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const field = config.certificateFields.find(f => f.id === id);
    if (!field || !containerRef.current) return;

    const initialX = field.x;
    const initialY = field.y;
    const rect = containerRef.current.getBoundingClientRect();

    const onMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;
      
      updateField(id, {
        x: Math.max(0, Math.min(100, initialX + deltaX)),
        y: Math.max(0, Math.min(100, initialY + deltaY)),
      });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const getPreviewText = (field: CertificateField) => {
    if (field.type === 'custom') return field.label;
    if (field.type === 'date') return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const student = students.length > 0 ? students[0] : null;
    
    if (!student) {
      switch (field.type) {
        case 'name': return 'John Doe';
        case 'program': return config.defaultProgramName || 'Bootcamp Program';
        case 'certId': return 'CERT-123456';
        case 'periode': return 'Jan - Mar 2024';
        case 'average': return '95';
        case 'grade': return 'A+';
        case 'description': return 'Superstar';
        default: 
          if (field.type.startsWith('category_avg:')) return '90';
          return field.label;
      }
    }

    switch (field.type) {
      case 'name': return student.name;
      case 'program': return student.program || config.defaultProgramName || '';
      case 'certId': return student.certId;
      case 'periode': return student.periode;
      case 'average': return student.finalAverage?.toString() || '0';
      case 'grade': return student.grade || '-';
      case 'description': return student.description || '-';
      default:
        if (field.type.startsWith('category_avg:')) {
          const catId = field.type.split(':')[1];
          return student.categoryAverages?.[catId]?.toString() || '0';
        }
        return field.label;
    }
  };

  const selectedField = config.certificateFields.find(f => f.id === selectedFieldId);
  const currentTemplate = activePage === 1 ? config.templateImages.page1 : config.templateImages.page2;

  if (activeTab === 'templates') {
    return (
      <div className="flex flex-col gap-6 flex-1 overflow-y-auto pb-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('page1')}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer bg-white/5 text-foreground-muted hover:bg-white/10"
            >
              Page 1 (Front)
            </button>
            <button
              onClick={() => setActiveTab('page2')}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer bg-white/5 text-foreground-muted hover:bg-white/10"
            >
              Page 2 (Back)
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer bg-accent text-white shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
            >
              Saved Templates
            </button>
          </div>
          <button
            onClick={saveCurrentAsTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/20 transition-colors cursor-pointer"
          >
            <Save size={18} />
            Save Current Design
          </button>
        </div>

        <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-border-default shadow-elevation-low p-8">
          <h3 className="text-xl font-medium tracking-tight text-foreground mb-2">Saved Templates</h3>
          <p className="text-sm text-foreground-muted mb-8">Manage your locally saved certificate designs.</p>

          {savedTemplates.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border-default rounded-2xl bg-white/5">
              <FolderOpen className="mx-auto text-foreground-muted/30 mb-4" size={48} />
              <p className="text-foreground-muted font-medium">No saved templates found</p>
              <p className="text-sm text-foreground-muted/50 mt-1">Save your current design to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedTemplates.map(template => (
                <div key={template.id} className="bg-white/5 border border-border-default rounded-2xl p-4 flex flex-col gap-4 hover:bg-white/10 transition-colors">
                  <div className="aspect-[4/3] bg-surface-elevated rounded-xl overflow-hidden border border-border-default/50 relative flex items-center justify-center">
                    {template.config.templateImages.page1 ? (
                      <img src={template.config.templateImages.page1} alt={template.name} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-foreground-muted/50 text-sm">No Image</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{template.name}</h4>
                    <p className="text-xs text-foreground-muted mt-1">
                      {new Date(template.createdAt).toLocaleDateString()} • {template.config.certificateFields.length} fields
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    <button
                      onClick={() => loadTemplate(template)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                    >
                      <Download size={16} />
                      Load
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Delete template"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 flex-1 overflow-y-auto pb-10">
      {/* Top: Editor & Preview */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 shrink-0 min-h-[500px]">
        {/* Left: Editor */}
        <div className="flex-1 flex flex-col gap-4 bg-surface/80 backdrop-blur-xl rounded-2xl border border-border-default shadow-elevation-low p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('page1')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
                  activeTab === 'page1' ? "bg-accent text-white shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]" : "bg-white/5 text-foreground-muted hover:bg-white/10"
                )}
              >
                Page 1 (Front)
              </button>
              <button
                onClick={() => setActiveTab('page2')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
                  activeTab === 'page2' ? "bg-accent text-white shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]" : "bg-white/5 text-foreground-muted hover:bg-white/10"
                )}
              >
                Page 2 (Back)
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer bg-white/5 text-foreground-muted hover:bg-white/10"
              >
                Saved Templates
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveCurrentAsTemplate}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/20 transition-colors cursor-pointer"
                title="Save as Template"
              >
                <Save size={16} />
                <span className="hidden sm:inline">Save</span>
              </button>
              <button
                onClick={addField}
                className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-xl text-sm font-medium hover:bg-accent/20 transition-colors cursor-pointer"
              >
                <Plus size={18} />
                Add Field
              </button>
            </div>
          </div>

          <div className="flex-1 bg-surface-elevated rounded-xl overflow-hidden relative flex items-center justify-center p-4 border border-border-default/50">
            {currentTemplate ? (
              <div 
                ref={containerRef}
                className="relative shadow-elevation-high bg-white max-h-full max-w-full"
                style={{ backgroundImage: `url(${currentTemplate})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
              >
                <img src={currentTemplate} className="max-h-full max-w-full opacity-0 pointer-events-none" alt="Template" />
                
                {config.certificateFields.filter(f => f.page === activePage).map(field => (
                  <div
                    key={field.id}
                    onMouseDown={(e) => handleMouseDown(field.id, e)}
                    className={cn(
                      "absolute cursor-move select-none p-2 border-2 transition-all whitespace-nowrap",
                      selectedFieldId === field.id ? "border-accent bg-accent/10" : "border-transparent hover:border-accent/50"
                    )}
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      transform: `translate(${field.align === 'left' ? '0' : field.align === 'right' ? '-100%' : '-50%'}, -50%)`,
                      fontSize: `${field.fontSize * (editorHeight / 540)}px`,
                      color: field.color,
                      fontWeight: field.bold ? 'bold' : 'normal',
                      fontFamily: field.fontFamily,
                      textAlign: field.align,
                    }}
                  >
                    {field.type.startsWith('category_avg') 
                      ? `${config.assessmentCategories.find(c => c.id === field.type.split(':')[1])?.name || 'Category'} Avg`
                      : field.label}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-foreground-muted shadow-elevation-low border border-border-default">
                  <Upload size={32} />
                </div>
                <p className="text-foreground font-medium">No Template Uploaded</p>
                <p className="text-sm text-foreground-muted/50 mb-6">Upload an image for Page {activePage}</p>
                <label className="px-6 py-3 bg-accent text-white rounded-xl font-medium cursor-pointer hover:bg-accent-bright transition-colors shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                  Upload Template
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(activePage, e)}
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="flex-1 flex flex-col gap-4 bg-surface/80 backdrop-blur-xl rounded-2xl border border-border-default shadow-elevation-low p-4">
          <div className="flex items-center justify-between px-2 py-1">
            <h3 className="font-medium text-foreground tracking-tight">Live Preview</h3>
            <span className="text-xs font-medium px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              {students.length > 0 ? `Data: ${students[0].name}` : 'Dummy Data'}
            </span>
          </div>

          <div className="flex-1 bg-surface-elevated rounded-xl overflow-hidden relative flex items-center justify-center p-4 border border-border-default/50">
            {currentTemplate ? (
              <div 
                ref={previewContainerRef}
                className="relative shadow-elevation-high bg-white max-h-full max-w-full pointer-events-none"
                style={{ backgroundImage: `url(${currentTemplate})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
              >
                <img src={currentTemplate} className="max-h-full max-w-full opacity-0" alt="Template" />
                
                {config.certificateFields.filter(f => f.page === activePage).map(field => (
                  <div
                    key={`preview-${field.id}`}
                    className="absolute whitespace-nowrap"
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      transform: `translate(${field.align === 'left' ? '0' : field.align === 'right' ? '-100%' : '-50%'}, -50%)`,
                      fontSize: `${field.fontSize * (previewHeight / 540)}px`,
                      color: field.color,
                      fontWeight: field.bold ? 'bold' : 'normal',
                      fontFamily: field.fontFamily,
                      textAlign: field.align,
                    }}
                  >
                    {getPreviewText(field)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-foreground-muted/50">
                <p>Upload a template to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Properties */}
      <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-border-default shadow-elevation-low p-6 shrink-0">
        <h3 className="font-medium text-lg mb-4 text-foreground tracking-tight">Properties</h3>
        
        {selectedField ? (
          <div className="flex flex-wrap gap-6 items-end">
            <div className="space-y-2 w-48">
              <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">Field Label</label>
              <input
                type="text"
                value={selectedField.label}
                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none text-foreground placeholder-foreground-muted/50 transition-all"
              />
            </div>

            <div className="space-y-2 w-48">
              <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">Data Type</label>
              <select
                value={selectedField.type}
                onChange={(e) => updateField(selectedField.id, { type: e.target.value as any })}
                className="w-full px-4 py-2 bg-white/5 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none text-foreground transition-all"
              >
                <option value="name">Student Name</option>
                <option value="program">Program Name</option>
                <option value="certId">Certificate ID</option>
                <option value="periode">Periode</option>
                <option value="average">Final Average</option>
                <option value="grade">Grade (A+, A, etc)</option>
                <option value="description">Description (Superstar, etc)</option>
                <option value="date">Current Date</option>
                <option value="custom">Custom Text</option>
                <optgroup label="Category Averages">
                  {config.assessmentCategories.map(cat => (
                    <option key={cat.id} value={`category_avg:${cat.id}`}>
                      {cat.name} Average
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="space-y-2 w-48">
              <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">Font Family</label>
              <select
                value={selectedField.fontFamily}
                onChange={(e) => updateField(selectedField.id, { fontFamily: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none text-foreground transition-all"
              >
                <option value="helvetica">Helvetica (Standard)</option>
                <option value="times">Times New Roman</option>
                <option value="courier">Courier</option>
                {config.customFonts.map(font => (
                  <option key={font.id} value={font.name}>{font.name} (Custom)</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 w-40">
              <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">Alignment</label>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-border-default">
                <button
                  onClick={() => updateField(selectedField.id, { align: 'left' })}
                  className={cn("flex-1 py-1.5 flex justify-center rounded-lg transition-colors cursor-pointer", selectedField.align === 'left' ? "bg-white/10 shadow-elevation-low text-accent" : "text-foreground-muted hover:text-foreground")}
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => updateField(selectedField.id, { align: 'center' })}
                  className={cn("flex-1 py-1.5 flex justify-center rounded-lg transition-colors cursor-pointer", selectedField.align === 'center' ? "bg-white/10 shadow-elevation-low text-accent" : "text-foreground-muted hover:text-foreground")}
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => updateField(selectedField.id, { align: 'right' })}
                  className={cn("flex-1 py-1.5 flex justify-center rounded-lg transition-colors cursor-pointer", selectedField.align === 'right' ? "bg-white/10 shadow-elevation-low text-accent" : "text-foreground-muted hover:text-foreground")}
                >
                  <AlignRight size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2 w-24">
              <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">Size</label>
              <input
                type="number"
                value={selectedField.fontSize}
                onChange={(e) => updateField(selectedField.id, { fontSize: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white/5 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none text-foreground transition-all"
              />
            </div>

            <div className="space-y-2 w-36">
              <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedField.color}
                  onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                  className="w-10 h-10 p-1 bg-white/5 border border-border-default rounded-lg cursor-pointer shrink-0"
                />
                {'EyeDropper' in window && (
                  <button
                    onClick={async () => {
                      try {
                        const eyeDropper = new (window as any).EyeDropper();
                        const result = await eyeDropper.open();
                        updateField(selectedField.id, { color: result.sRGBHex });
                      } catch (e) {}
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 text-foreground-muted rounded-lg border border-border-default transition-colors cursor-pointer"
                    title="Pick color from screen"
                  >
                    <Pipette size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 w-24">
              <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">Bold</label>
              <button
                onClick={() => updateField(selectedField.id, { bold: !selectedField.bold })}
                className={cn(
                  "w-12 h-10 rounded-xl transition-all relative cursor-pointer flex items-center justify-center",
                  selectedField.bold ? "bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" : "bg-white/5 text-foreground-muted border border-border-default"
                )}
              >
                <Bold size={18} />
              </button>
            </div>

            <div className="pb-1 flex gap-2">
              <button
                onClick={() => duplicateField(selectedField.id)}
                className="h-10 px-4 text-accent font-medium text-sm flex items-center justify-center gap-2 hover:bg-accent/10 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-accent/20"
              >
                <Copy size={16} />
                Duplicate
              </button>
              <button
                onClick={() => removeField(selectedField.id)}
                className="h-10 px-4 text-red-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-500/20"
              >
                <Trash2 size={16} />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-white/5 rounded-xl border border-border-default border-dashed">
            <p className="text-sm text-foreground-muted">Select a field on the canvas to edit its properties.</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-border-default flex flex-wrap gap-4 items-center">
          <h4 className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider mr-2">Assets</h4>
          
          <label className="px-4 py-2 bg-white/5 text-foreground-muted rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-white/10 hover:text-foreground transition-colors cursor-pointer border border-border-default">
            <Upload size={16} />
            Replace Template
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleImageUpload(activePage, e)}
            />
          </label>

          <label className="px-4 py-2 bg-accent/10 text-accent rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-accent/20 transition-colors cursor-pointer border border-accent/20">
            <FontIcon size={16} />
            Upload Custom Font
            <input
              type="file"
              className="hidden"
              accept=".ttf,.otf,.woff,.woff2"
              onChange={handleFontUpload}
            />
          </label>
          
          {config.customFonts.length > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-[10px] font-bold text-foreground-muted uppercase">Fonts:</span>
              <div className="flex flex-wrap gap-2">
                {config.customFonts.map(font => (
                  <div key={font.id} className="px-2 py-1 bg-white/5 border border-border-default rounded text-[10px] font-medium text-foreground-muted">
                    {font.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
