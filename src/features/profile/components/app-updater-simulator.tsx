import React, { useState } from 'react';
import { 
  RefreshCw, Cloud, Sparkles, Check, Zap 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const AppUpdaterSimulator: React.FC = () => {
  const [checking, setChecking] = useState<boolean>(false);
  const [updateReady, setUpdateReady] = useState<boolean>(false);
  const [installing, setInstalling] = useState<boolean>(false);
  const [isUpToDate, setIsUpToDate] = useState<boolean>(false);
  
  const [currentVersion, setCurrentVersion] = useState<string>(() => {
    return localStorage.getItem('llb-app-version') || __APP_VERSION__;
  });
  
  const [serverVersion] = useState<string>(() => {
    return localStorage.getItem('llb-server-version') || '0.0.1';
  });

  const [lastChecked, setLastChecked] = useState<string>(() => {
    return localStorage.getItem('llb-last-update-check') || 'Never';
  });

  const handleCheckForUpdates = () => {
    setChecking(true);
    setUpdateReady(false);
    setIsUpToDate(false);
    
    // Simulate check
    setTimeout(() => {
      setChecking(false);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      setLastChecked(now);
      localStorage.setItem('llb-last-update-check', now);

      if (currentVersion !== serverVersion) {
        setUpdateReady(true);
        toast.success(`New version v${serverVersion} found and downloaded successfully!`);
        
        // Show native browser notification if permission is granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('App Update Available', {
            body: `Version v${serverVersion} is ready. Click to apply update.`,
            icon: '/white-logo.svg',
          });
        }
      } else {
        setIsUpToDate(true);
        toast.success('Your app is up to date!');
      }
    }, 2000);
  };

  const handleInstallUpdate = () => {
    setInstalling(true);
    setUpdateReady(false);

    // Simulate reloading & installing
    setTimeout(() => {
      setInstalling(false);
      setCurrentVersion(serverVersion);
      localStorage.setItem('llb-app-version', serverVersion);
      toast.success(`App updated to version v${serverVersion}!`);
      // Perform a clean reload of the tab to refresh page assets
      window.location.reload();
    }, 2500);
  };



  return (
    <div className="w-full space-y-6">
      {/* Main Container Card (matching NotificationPreferencesSection layout) */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden w-full">
        {/* Section Header */}
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">App Update & Offline</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Check and install the latest system version and planner assets.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/20 rounded-xl border border-border/80 flex flex-col justify-between">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                Current Version
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-xl font-black text-slate-150">v{currentVersion}</span>
                <span className="text-[8px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  Active
                </span>
              </div>
            </div>

            <div className="p-4 bg-muted/20 rounded-xl border border-border/80 flex flex-col justify-between">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                Last Checked
              </span>
              <div className="text-base font-bold text-slate-200 mt-2 font-mono">
                {lastChecked}
              </div>
            </div>
          </div>

          {/* Action buttons and progress stages */}
          <div className="space-y-4">
            {!updateReady && !checking && !installing && (
              <Button
                onClick={handleCheckForUpdates}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-750 text-white border-0 font-bold text-xs h-10 shadow-lg shadow-primary/10 rounded-xl transition-all duration-300 transform hover:scale-[1.005]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Check for Updates
              </Button>
            )}

            {checking && (
              <div className="p-6 bg-muted/10 rounded-xl border border-border/40 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
                <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                <div className="text-xs font-bold text-slate-200">Checking for updates...</div>
                <p className="text-[10px] text-muted-foreground max-w-[240px]">
                  Comparing current planner files with the release server CDN.
                </p>
              </div>
            )}

            {updateReady && (
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-4 animate-in fade-in duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">New Version Ready!</h4>
                    <p className="text-[10.5px] text-muted-foreground leading-relaxed mt-0.8">
                      An update (v{serverVersion}) has been pre-downloaded in the background. Apply this update now to load new planner widgets and stability improvements.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleInstallUpdate}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Restart & Apply Update
                </Button>
              </div>
            )}

            {isUpToDate && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2 animate-in fade-in duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">System Up to Date</h4>
                    <p className="text-[10.5px] text-muted-foreground leading-relaxed mt-0.8">
                      Your planner is running the latest system build (v{currentVersion}). All pages and offline modules are fully synced.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {installing && (
              <div className="p-6 bg-muted/10 rounded-xl border border-border/40 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="h-5 w-5 text-emerald-400 animate-spin" />
                <div className="text-xs font-bold text-slate-200">Installing Update...</div>
                <p className="text-[10px] text-muted-foreground max-w-[240px]">
                  Replacing cached planner modules. The page will refresh in a moment.
                </p>
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Offline Storage card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden w-full p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/50 border border-border/80 flex items-center justify-center">
            <Cloud className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Offline Availability</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              The planner is fully cached and runs entirely without an internet connection.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full text-[9px] font-bold flex items-center gap-1 shrink-0">
          <Check className="h-3 w-3" />
          Ready Offline
        </span>
      </div>
    </div>
  );
};
