import { useState, useRef, useEffect, type MouseEvent, type ChangeEvent } from 'react';
import { Upload, Trash2, Move, Type, Palette, Bold, ChevronLeft, ChevronRight, Plus, Type as FontIcon, AlignLeft, AlignCenter, AlignRight, Pipette } from 'lucide-react';
import type { AppConfig, CertificateField, CustomFont } from '../types';
import { cn } from '../utils/cn';

interface Props {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
}

export default function CertificateDesigner({ config, setConfig }: Props) {
  const [activePage, setActivePage] = useState<1 | 2>(1);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const selectedField = config.certificateFields.find(f => f.id === selectedFieldId);
  const currentTemplate = activePage === 1 ? config.templateImages.page1 : config.templateImages.page2;

  return (
    <div className="flex gap-8 h-[calc(100vh-12rem)]">
      {/* Left Panel: Editor */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActivePage(1)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
                activePage === 1 ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              Page 1 (Front)
            </button>
            <button
              onClick={() => setActivePage(2)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
                activePage === 2 ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              Page 2 (Back)
            </button>
          </div>
          <button
            onClick={addField}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <Plus size={18} />
            Add Field
          </button>
        </div>

        <div className="flex-1 bg-gray-200 rounded-2xl overflow-hidden relative flex items-center justify-center p-8">
          {currentTemplate ? (
            <div 
              ref={containerRef}
              className="relative shadow-2xl bg-white aspect-[1.414/1] max-h-full max-w-full"
              style={{ backgroundImage: `url(${currentTemplate})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }}
            >
              <img src={currentTemplate} className="max-h-full max-w-full opacity-0 pointer-events-none" alt="Template" />
              
              {config.certificateFields.filter(f => f.page === activePage).map(field => (
                <div
                  key={field.id}
                  onMouseDown={(e) => handleMouseDown(field.id, e)}
                  className={cn(
                    "absolute cursor-move select-none p-2 border-2 transition-all whitespace-nowrap",
                    selectedFieldId === field.id ? "border-indigo-500 bg-indigo-50/20" : "border-transparent hover:border-indigo-300"
                  )}
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    transform: `translate(${field.align === 'left' ? '0' : field.align === 'right' ? '-100%' : '-50%'}, -50%)`,
                    fontSize: `${field.fontSize}px`,
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
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 shadow-sm">
                <Upload size={32} />
              </div>
              <p className="text-gray-500 font-bold">No Template Uploaded</p>
              <p className="text-sm text-gray-400 mb-6">Upload an image for Page {activePage}</p>
              <label className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer hover:bg-indigo-700 transition-colors">
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

      {/* Right Panel: Properties */}
      <div className="w-80 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-y-auto">
        <h3 className="font-bold text-lg mb-6">Properties</h3>
        
        {selectedField ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Field Label</label>
              <input
                type="text"
                value={selectedField.label}
                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Data Type</label>
              <select
                value={selectedField.type}
                onChange={(e) => updateField(selectedField.id, { type: e.target.value as any })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Font Family</label>
              <select
                value={selectedField.fontFamily}
                onChange={(e) => updateField(selectedField.id, { fontFamily: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="helvetica">Helvetica (Standard)</option>
                <option value="times">Times New Roman</option>
                <option value="courier">Courier</option>
                {config.customFonts.map(font => (
                  <option key={font.id} value={font.name}>{font.name} (Custom)</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alignment</label>
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button
                  onClick={() => updateField(selectedField.id, { align: 'left' })}
                  className={cn("flex-1 py-1.5 flex justify-center rounded-lg transition-colors cursor-pointer", selectedField.align === 'left' ? "bg-white shadow-sm text-indigo-600" : "text-gray-400 hover:text-gray-600")}
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => updateField(selectedField.id, { align: 'center' })}
                  className={cn("flex-1 py-1.5 flex justify-center rounded-lg transition-colors cursor-pointer", selectedField.align === 'center' ? "bg-white shadow-sm text-indigo-600" : "text-gray-400 hover:text-gray-600")}
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => updateField(selectedField.id, { align: 'right' })}
                  className={cn("flex-1 py-1.5 flex justify-center rounded-lg transition-colors cursor-pointer", selectedField.align === 'right' ? "bg-white shadow-sm text-indigo-600" : "text-gray-400 hover:text-gray-600")}
                >
                  <AlignRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Font Size</label>
                <input
                  type="number"
                  value={selectedField.fontSize}
                  onChange={(e) => updateField(selectedField.id, { fontSize: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedField.color}
                    onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                    className="w-10 h-10 p-1 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono text-gray-500 flex-1">{selectedField.color}</span>
                  {'EyeDropper' in window && (
                    <button
                      onClick={async () => {
                        try {
                          const eyeDropper = new (window as any).EyeDropper();
                          const result = await eyeDropper.open();
                          updateField(selectedField.id, { color: result.sRGBHex });
                        } catch (e) {
                          // User canceled
                        }
                      }}
                      className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg border border-gray-100 transition-colors cursor-pointer"
                      title="Pick color from screen"
                    >
                      <Pipette size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-sm font-bold text-gray-700">Bold Text</span>
              <button
                onClick={() => updateField(selectedField.id, { bold: !selectedField.bold })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative cursor-pointer",
                  selectedField.bold ? "bg-indigo-600" : "bg-gray-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  selectedField.bold ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <button
                onClick={() => removeField(selectedField.id)}
                className="w-full py-3 text-red-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
                Remove Field
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Type className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-sm text-gray-400">Select a field on the canvas to edit its properties.</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assets</h4>
          
          <label className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer">
            <Upload size={16} />
            Replace Template
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleImageUpload(activePage, e)}
            />
          </label>

          <label className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors cursor-pointer">
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
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Uploaded Fonts</p>
              <div className="flex flex-wrap gap-2">
                {config.customFonts.map(font => (
                  <div key={font.id} className="px-2 py-1 bg-gray-100 rounded text-[10px] font-medium text-gray-600">
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
