import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold">Grading Structure</h3>
            <p className="text-sm text-gray-500">Organize your assessments into categories and sub-fields.</p>
          </div>
          <button
            onClick={addCategory}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        <div className="space-y-4">
          {config.assessmentCategories.map((cat) => (
            <div key={cat.id} className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 transition-colors group">
                <button 
                  onClick={() => toggleCat(cat.id)}
                  className="p-1 text-gray-400 hover:text-indigo-600 cursor-pointer"
                >
                  {expandedCats[cat.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-gray-800"
                  placeholder="Category Name"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-200">
                    {cat.fields.length} Fields
                  </span>
                  <button
                    onClick={() => removeCategory(cat.id)}
                    className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {expandedCats[cat.id] && (
                <div className="p-4 bg-white space-y-3">
                  {cat.fields.map((field, fIndex) => (
                    <div key={field.id} className="flex items-center gap-3 pl-8 group/field">
                      <div className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 border border-gray-100">
                        {fIndex + 1}
                      </div>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateFieldName(cat.id, field.id, e.target.value)}
                        className="flex-1 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 focus:ring-0 py-1 text-sm text-gray-600 outline-none"
                        placeholder="Field Name"
                      />
                      <button
                        onClick={() => removeField(cat.id, field.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover/field:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => addField(cat.id)}
                    className="flex items-center gap-2 pl-8 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    Add Sub-field
                  </button>
                </div>
              )}
            </div>
          ))}

          {config.assessmentCategories.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
              <p className="text-gray-400 text-sm">No categories defined yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
        <h4 className="text-indigo-900 font-bold mb-2">Grading Logic</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-indigo-700 font-semibold mb-2">Calculation:</p>
            <ol className="text-indigo-600 space-y-1 list-decimal pl-5">
              <li>System calculates average for each category.</li>
              <li>Final average is the average of all category averages.</li>
            </ol>
          </div>
          <div>
            <p className="text-indigo-700 font-semibold mb-2">Grading Scales:</p>
            <ul className="text-indigo-600 space-y-1 list-disc pl-5">
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
