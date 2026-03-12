import { useState, useEffect } from 'react';
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
import GlobalSettingsModal from './components/GlobalSettingsModal';
import UpdateNotifier from './components/UpdateNotifier';

export default function App() {
  const [activeTab, setActiveTab] = useState<'config' | 'import' | 'design' | 'export'>('config');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState<AppConfig>({
    appName: 'CertiBatch',
    appLogo: '',
    favicon: '',
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

  useEffect(() => {
    if (config.appName) {
      document.title = config.appName;
    }
    if (config.favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = config.favicon;
    }
  }, [config.appName, config.favicon]);

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
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-surface/80 backdrop-blur-xl border border-border-default shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-full p-2 flex items-center gap-1 sm:gap-2 w-max max-w-[98vw] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 sm:px-3 shrink-0">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(94,106,210,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] overflow-hidden">
            {config.appLogo ? (
              <img src={config.appLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <GraduationCap size={16} />
            )}
          </div>
        </div>
        
        <div className="w-px h-6 bg-border-default shrink-0 hidden sm:block" />
        
        {/* Tabs */}
        <div className="flex items-center gap-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-300 cursor-pointer",
                activeTab === tab.id
                  ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "text-foreground-muted hover:text-foreground hover:bg-white/5"
              )}
            >
              <tab.icon size={16} className={cn("transition-transform duration-300", activeTab === tab.id && "text-accent-bright")} />
              <span className={cn(
                "text-xs font-medium tracking-wide",
                activeTab === tab.id ? "block" : "hidden md:block"
              )}>{tab.label}</span>
            </button>
          ))}
          
          <div className="w-px h-6 bg-border-default shrink-0 mx-1" />
          
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full text-foreground-muted hover:text-foreground hover:bg-white/5 transition-all duration-300 cursor-pointer"
            title="Global Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen pt-28 relative z-10">
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

      <GlobalSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        setConfig={setConfig}
      />
      
      <UpdateNotifier />
    </div>
  );
}
