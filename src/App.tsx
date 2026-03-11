import { useState } from 'react';
import { 
  Settings, 
  Upload, 
  Download, 
  GraduationCap,
  Layout as LayoutIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils/cn';
import type { AppConfig, StudentData } from './types';

// Components
import GradingConfig from './components/GradingConfig';
import DataImporter from './components/DataImporter';
import CertificateDesigner from './components/CertificateDesigner';
import ExportManager from './components/ExportManager';

export default function App() {
  const [activeTab, setActiveTab] = useState<'config' | 'import' | 'design' | 'export'>('config');
  const [config, setConfig] = useState<AppConfig>({
    defaultProgramName: 'Mini Bootcamp',
    assessmentCategories: [
      {
        id: 'cat-post-test',
        name: 'Post Test',
        fields: [
          { id: 'pt1', name: 'Post Test 1' },
          { id: 'pt2', name: 'Post Test 2' },
          { id: 'pt3', name: 'Post Test 3' },
          { id: 'pt4', name: 'Post Test 4' },
          { id: 'pt5', name: 'Post Test 5' },
          { id: 'pt6', name: 'Post Test 6' },
        ],
      },
      {
        id: 'cat-assignment',
        name: 'Assignment',
        fields: [
          { id: 'as1', name: 'Individual Assignment 1 (Social Media Analysis)' },
          { id: 'as2', name: 'Individual Assignment 2 (Content Ideation)' },
          { id: 'as3', name: 'Mini Group Challenge (Social Media Analysis)' },
          { id: 'as4', name: 'Group Assignment (Social Media Reporting)' },
        ],
      },
      {
        id: 'cat-group-challenge',
        name: 'Group Challenge',
        fields: [
          { id: 'gc1', name: 'Kriteria 1' },
          { id: 'gc2', name: 'Kriteria 2' },
          { id: 'gc3', name: 'Kriteria 3' },
          { id: 'gc4', name: 'Kriteria 4' },
        ],
      },
      {
        id: 'cat-keaktifan',
        name: 'Keaktifan',
        fields: [
          { id: 'act1', name: 'Nilai Keaktifan di kelas' },
        ],
      },
    ],
    certificateFields: [
      { id: 'f-name', label: 'Student Name', type: 'name', x: 50, y: 40, fontSize: 32, color: '#000000', bold: true, fontFamily: 'helvetica', align: 'center', page: 1 },
      { id: 'f-prog', label: 'Program', type: 'program', x: 50, y: 50, fontSize: 24, color: '#000000', bold: false, fontFamily: 'helvetica', align: 'center', page: 1 },
      { id: 'f-cid', label: 'Certificate ID', type: 'certId', x: 50, y: 60, fontSize: 18, color: '#000000', bold: false, fontFamily: 'helvetica', align: 'center', page: 1 },
      { id: 'f-per', label: 'Periode', type: 'periode', x: 50, y: 70, fontSize: 18, color: '#000000', bold: false, fontFamily: 'helvetica', align: 'center', page: 1 },
    ],
    customFonts: [],
    templateImages: {
      page1: null,
      page2: null,
    }
  });

  const [students, setStudents] = useState<StudentData[]>([]);

  const tabs = [
    { id: 'config', label: 'Grading Config', icon: Settings },
    { id: 'import', label: 'Import Data', icon: Upload },
    { id: 'design', label: 'Certificate Design', icon: LayoutIcon },
    { id: 'export', label: 'Export PDF', icon: Download },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-6 flex flex-col gap-8 z-50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">CertiBatch</h1>
            <p className="text-xs text-gray-500">Bootcamp Grading</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium cursor-pointer",
                activeTab === tab.id 
                  ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 bg-indigo-600 rounded-2xl text-white">
          <p className="text-xs opacity-80 mb-2">Ready to export?</p>
          <p className="text-sm font-semibold mb-4">{students.length} Students Loaded</p>
          <button 
            onClick={() => setActiveTab('export')}
            className="w-full py-2 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-opacity-90 transition-colors cursor-pointer"
          >
            Generate All
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="pl-64 min-h-screen">
        <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                  <img src={`https://picsum.photos/seed/user${i}/32/32`} alt="User" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'config' && (
                <GradingConfig config={config} setConfig={setConfig} />
              )}
              {activeTab === 'import' && (
                <DataImporter 
                  config={config} 
                  students={students} 
                  setStudents={setStudents} 
                />
              )}
              {activeTab === 'design' && (
                <CertificateDesigner config={config} setConfig={setConfig} />
              )}
              {activeTab === 'export' && (
                <ExportManager config={config} students={students} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
