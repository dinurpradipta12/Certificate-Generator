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
    <div className="min-h-screen bg-background-base text-foreground font-sans flex flex-col relative overflow-hidden">
      {/* Ambient Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]" />
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="absolute inset-0 bg-noise" />
        
        {/* Animated Blobs */}
        <div className="absolute top-[-20%] left-[20%] w-[900px] h-[900px] bg-accent/20 rounded-full blur-[150px] animate-float mix-blend-screen" />
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[800px] bg-purple-500/10 rounded-full blur-[120px] animate-float-delayed mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-indigo-500/10 rounded-full blur-[100px] animate-float-slow mix-blend-screen" />
      </div>

      {/* Floating Menu */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-surface/80 backdrop-blur-xl border border-border-default shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl px-6 py-4 flex items-center justify-between gap-8 w-[90%] max-w-4xl">
        <div className="flex flex-col items-center gap-1.5 px-2 border-r border-border-default pr-8">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(94,106,210,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <GraduationCap size={20} />
          </div>
          <span className="font-bold text-[10px] tracking-widest uppercase text-foreground-muted">CertiBatch</span>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-8 flex-1 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-2 px-4 sm:px-6 py-2 rounded-xl transition-all duration-300 cursor-pointer min-w-[80px] sm:min-w-[100px]",
                activeTab === tab.id
                  ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "text-foreground-muted hover:text-foreground hover:bg-white/5"
              )}
            >
              <tab.icon size={24} className={cn("transition-transform duration-300", activeTab === tab.id && "scale-110 text-accent-bright")} />
              <span className="text-[11px] font-medium tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
        
        <div className="w-px h-12 bg-border-default mx-2" />
        
        <button
          onClick={() => setActiveTab('export')}
          className="flex flex-col items-center gap-2 px-6 py-2 bg-accent text-white rounded-xl font-medium hover:bg-accent-bright transition-all duration-300 cursor-pointer min-w-[100px] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_0_1px_rgba(104,114,217,0.6),0_8px_20px_rgba(94,106,210,0.4),inset_0_1px_0_0_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
        >
          <Download size={24} />
          <span className="text-[11px] tracking-wide">Export ({students.length})</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen pt-36 relative z-10">
        <div className="p-4 md:px-8 md:pb-8 w-full max-w-[1600px] mx-auto flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col"
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
                <CertificateDesigner config={config} setConfig={setConfig} students={students} />
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
