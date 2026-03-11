import { Plus, Trash2, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useState } from 'react';
import type { AppConfig, AssessmentCategory, AssessmentField } from '../types';
import { cn } from '../utils/cn';

interface Props {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
}

export default function GradingConfig({ config, setConfig }: Props) {
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const toggleCat = (id: string) => {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addCategory = () => {
    const newCat: AssessmentCategory = {
      id: `cat-${Date.now()}`,
      name: `New Category ${config.assessmentCategories.length + 1}`,
      fields: [],
    };
    setConfig({
      ...config,
      assessmentCategories: [...config.assessmentCategories, newCat],
    });
    setExpandedCats(prev => ({ ...prev, [newCat.id]: true }));
  };

  const removeCategory = (id: string) => {
    setConfig({
      ...config,
      assessmentCategories: config.assessmentCategories.filter((c) => c.id !== id),
    });
  };

  const updateCategoryName = (id: string, name: string) => {
    setConfig({
      ...config,
      assessmentCategories: config.assessmentCategories.map((c) =>
        c.id === id ? { ...c, name } : c
      ),
    });
  };

  const addField = (catId: string) => {
    const cat = config.assessmentCategories.find(c => c.id === catId);
    if (!cat) return;

    const newField: AssessmentField = {
      id: `field-${Date.now()}`,
      name: `New Field ${cat.fields.length + 1}`,
    };

    setConfig({
      ...config,
      assessmentCategories: config.assessmentCategories.map(c => 
        c.id === catId ? { ...c, fields: [...c.fields, newField] } : c
      ),
    });
  };

  const removeField = (catId: string, fieldId: string) => {
    setConfig({
      ...config,
      assessmentCategories: config.assessmentCategories.map(c => 
        c.id === catId ? { ...c, fields: c.fields.filter(f => f.id !== fieldId) } : c
      ),
    });
  };

  const updateFieldName = (catId: string, fieldId: string, name: string) => {
    setConfig({
      ...config,
      assessmentCategories: config.assessmentCategories.map(c => 
        c.id === catId ? { 
          ...c, 
          fields: c.fields.map(f => f.id === fieldId ? { ...f, name } : f) 
        } : c
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-border-default shadow-elevation-low p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shadow-[inset_0_0_20px_rgba(94,106,210,0.1)]">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-foreground tracking-tight">General Settings</h2>
            <p className="text-sm text-foreground-muted">Global configuration for your certificates</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Default Program Name</label>
          <input
            type="text"
            value={config.defaultProgramName || ''}
            onChange={(e) => setConfig({ ...config, defaultProgramName: e.target.value })}
            className="w-full px-4 py-3 bg-white/5 border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none text-foreground placeholder-foreground-muted/50 transition-all"
            placeholder="e.g. Fullstack Web Development"
          />
          <p className="text-xs text-foreground-muted mt-2">This name will be used on certificates if the imported CSV doesn't have a Program column.</p>
        </div>
      </div>

      <div className="bg-surface/80 backdrop-blur-xl rounded-2xl p-8 border border-border-default shadow-elevation-low">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-medium tracking-tight text-foreground">Grading Structure</h3>
            <p className="text-sm text-foreground-muted">Organize your assessments into categories and sub-fields.</p>
          </div>
          <button
            onClick={addCategory}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-bright transition-all cursor-pointer shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_0_1px_rgba(104,114,217,0.6),0_8px_20px_rgba(94,106,210,0.4),inset_0_1px_0_0_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        <div className="space-y-4">
          {config.assessmentCategories.map((cat) => (
            <div key={cat.id} className="border border-border-default rounded-2xl overflow-hidden bg-surface-elevated/50">
              <div className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 transition-colors group">
                <button 
                  onClick={() => toggleCat(cat.id)}
                  className="p-1 text-foreground-muted hover:text-accent cursor-pointer transition-colors"
                >
                  {expandedCats[cat.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 font-medium text-foreground outline-none placeholder-foreground-muted/50"
                  placeholder="Category Name"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground-muted bg-white/5 px-2 py-1 rounded-lg border border-border-default">
                    {cat.fields.length} Fields
                  </span>
                  <button
                    onClick={() => removeCategory(cat.id)}
                    className="p-2 text-foreground-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {expandedCats[cat.id] && (
                <div className="p-4 bg-surface/50 space-y-3 border-t border-border-default">
                  {cat.fields.map((field, fIndex) => (
                    <div key={field.id} className="flex items-center gap-3 pl-8 group/field">
                      <div className="w-6 h-6 flex items-center justify-center bg-white/5 rounded-lg text-[10px] font-medium text-foreground-muted border border-border-default">
                        {fIndex + 1}
                      </div>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateFieldName(cat.id, field.id, e.target.value)}
                        className="flex-1 bg-transparent border-b border-transparent hover:border-border-default focus:border-accent focus:ring-0 py-1 text-sm text-foreground-muted focus:text-foreground outline-none transition-colors placeholder-foreground-muted/50"
                        placeholder="Field Name"
                      />
                      <button
                        onClick={() => removeField(cat.id, field.id)}
                        className="p-1.5 text-foreground-muted/50 hover:text-red-400 opacity-0 group-hover/field:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => addField(cat.id)}
                    className="flex items-center gap-2 pl-8 py-2 text-xs font-medium text-accent hover:text-accent-bright transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    Add Sub-field
                  </button>
                </div>
              )}
            </div>
          ))}

          {config.assessmentCategories.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border-default rounded-2xl bg-white/5">
              <p className="text-foreground-muted text-sm">No categories defined yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-accent/5 rounded-2xl p-6 border border-accent/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(94,106,210,0.1),transparent_50%)] pointer-events-none" />
        <h4 className="text-accent-bright font-medium mb-2 relative z-10">Grading Logic</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm relative z-10">
          <div>
            <p className="text-accent font-medium mb-2">Calculation:</p>
            <ol className="text-foreground-muted space-y-1 list-decimal pl-5">
              <li>System calculates average for each category.</li>
              <li>Final average is the average of all category averages.</li>
            </ol>
          </div>
          <div>
            <p className="text-accent font-medium mb-2">Grading Scales:</p>
            <ul className="text-foreground-muted space-y-1 list-disc pl-5">
              <li>90+ : A+ (Superstar)</li>
              <li>85+ : A (Very Good)</li>
              <li>80+ : B+ (Good)</li>
              <li>70+ : B (Average)</li>
              <li>60+ : C (Below Average)</li>
              <li>&lt; 60 : D (Very Poor)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
