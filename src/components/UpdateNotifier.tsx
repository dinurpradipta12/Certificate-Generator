import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

export default function UpdateNotifier() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const currentVersionRef = useRef<string | null>(null);

  const checkVersion = async () => {
    try {
      // Fetch version.json with cache-busting
      const res = await fetch(`/version.json?t=${Date.now()}`);
      if (!res.ok) return;
      
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data && data.version) {
          if (!currentVersionRef.current) {
            // First load, set current version
            currentVersionRef.current = data.version;
          } else if (currentVersionRef.current !== data.version && data.version !== 'dev') {
            // Version changed and it's not dev mode!
            setIsUpdateAvailable(true);
          }
        }
      } catch (e) {
        // Ignore JSON parse errors (e.g. if index.html is returned in dev mode fallback)
      }
    } catch (error) {
      console.error('Failed to check app version:', error);
    }
  };

  useEffect(() => {
    // Check immediately on mount
    checkVersion();

    // Check every 5 minutes
    const interval = setInterval(checkVersion, 5 * 60 * 1000);

    // Check when window regains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-elevated border border-border-default rounded-2xl w-full max-w-sm shadow-elevation-high overflow-hidden flex flex-col items-center text-center p-8 gap-4 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mb-2">
          <RefreshCw size={32} className="animate-[spin_3s_linear_infinite]" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Update Available</h3>
        <p className="text-sm text-foreground-muted mb-2">
          A new version of the application has been deployed. Please refresh to apply the latest updates and avoid any issues.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-bright transition-colors shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] cursor-pointer flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh Now
        </button>
      </div>
    </div>
  );
}
