import React, { useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, Share, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const InstallAppSection: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Initial check for deferred prompt
    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }

    // Event listeners
    const handlePromptAvailable = () => {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    };

    const handlePromptInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('pwa-prompt-installed', handlePromptInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('pwa-prompt-installed', handlePromptInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        (window as any).deferredInstallPrompt = null;
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Download size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Install Planner App</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isStandalone ? 'Installed on this device' : 'Available for offline access & faster loads'}
              </p>
            </div>
          </div>

          {/* Standalone state badge */}
          <div className={cn(
            'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
            isStandalone
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
          )}>
            {isStandalone ? 'Installed' : 'Installable'}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {isStandalone ? (
          <div className="flex items-start gap-3 py-2 px-3 rounded-xl bg-green-500/5 border border-green-500/10">
            <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">You are running the standalone app!</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                Enjoy complete offline access, faster transitions, and native desktop/mobile layout integration.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Install Legacy Life Builder directly to your home screen or desktop. It works offline, starts instantly, and feels like a native application.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-start gap-3">
                <Monitor size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-foreground">Desktop Experience</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
                    Run in a dedicated window, dock to taskbar/dock, and start directly from your desktop.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-start gap-3">
                <Smartphone size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-foreground">Mobile App</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
                    Add to your mobile home screen to access your plans instantly, even when offline.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              {isIOS ? (
                <div className="p-3 rounded-xl border border-blue-500/10 bg-blue-500/5 text-blue-300 space-y-2">
                  <p className="text-[10px] font-bold flex items-center gap-1.5">
                    <Share size={12} />
                    iOS Installation Instructions
                  </p>
                  <ol className="text-[9px] list-decimal list-inside space-y-1 text-muted-foreground font-medium">
                    <li>Open this website in <span className="text-foreground font-bold">Safari</span> browser.</li>
                    <li>Tap the <span className="text-foreground font-bold">Share</span> button at the bottom of the screen.</li>
                    <li>Scroll down and select <span className="text-foreground font-bold">"Add to Home Screen"</span> <span className="text-foreground font-bold font-mono">(+)</span>.</li>
                  </ol>
                </div>
              ) : deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all active:scale-95 shadow-md shadow-blue-500/10"
                >
                  <Download size={12} />
                  Install App Now
                </button>
              ) : (
                <div className="p-3 rounded-xl border border-border bg-muted/30 text-[10px] text-muted-foreground leading-relaxed font-medium">
                  To install the app, click the install icon in your browser's address bar (look for the <span className="text-foreground font-bold">"+"</span> or desktop install icon), or use browser settings.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
