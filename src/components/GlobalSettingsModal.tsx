import { useState, useRef, type ChangeEvent } from 'react';
import { X, Upload, Image as ImageIcon, Type, Globe } from 'lucide-react';
import type { AppConfig } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
}

export default function GlobalSettingsModal({ isOpen, onClose, config, setConfig }: Props) {
  const [appName, setAppName] = useState(config.appName || 'CertiBatch');
  const [appLogo, setAppLogo] = useState(config.appLogo || '');
  const [favicon, setFavicon] = useState(config.favicon || '');

  if (!isOpen) return null;

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAppLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFavicon(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setConfig({
      ...config,
      appName,
      appLogo,
      favicon,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-elevated border border-border-default rounded-2xl w-full max-w-md shadow-elevation-high overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border-default bg-white/5">
          <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
            <Globe size={18} className="text-accent" />
            Global Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-foreground-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* App Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
              <Type size={14} />
              App Name
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full bg-background-base border border-border-default rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
              placeholder="e.g. My Certificate App"
            />
          </div>

          {/* App Logo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
              <ImageIcon size={14} />
              App Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-background-base border border-border-default flex items-center justify-center overflow-hidden shrink-0">
                {appLogo ? (
                  <img src={appLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon size={24} className="text-foreground-muted/50" />
                )}
              </div>
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-border-default border-dashed rounded-xl text-sm font-medium text-foreground-muted transition-colors cursor-pointer">
                <Upload size={16} />
                Upload Logo
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </label>
              {appLogo && (
                <button
                  onClick={() => setAppLogo('')}
                  className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                  title="Remove Logo"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Favicon */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
              <Globe size={14} />
              Favicon
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-background-base border border-border-default flex items-center justify-center overflow-hidden shrink-0">
                {favicon ? (
                  <img src={favicon} alt="Favicon" className="w-8 h-8 object-contain" />
                ) : (
                  <Globe size={24} className="text-foreground-muted/50" />
                )}
              </div>
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-border-default border-dashed rounded-xl text-sm font-medium text-foreground-muted transition-colors cursor-pointer">
                <Upload size={16} />
                Upload Favicon
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFaviconUpload}
                />
              </label>
              {favicon && (
                <button
                  onClick={() => setFavicon('')}
                  className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                  title="Remove Favicon"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <p className="text-xs text-foreground-muted/70">Recommended size: 32x32px or 64x64px (PNG/ICO).</p>
          </div>
        </div>

        <div className="p-4 border-t border-border-default bg-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-bright transition-colors shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
