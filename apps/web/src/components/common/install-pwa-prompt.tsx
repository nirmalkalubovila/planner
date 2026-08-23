import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

const DISMISS_KEY = 'llb-pwa-prompt-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWAPrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Check if dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed === 'permanent') return;
    if (dismissed) {
      const elapsed = Date.now() - parseInt(dismissed, 10);
      if (elapsed < 14 * 24 * 60 * 60 * 1000) return; // 14 days
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show after a delay
      const timer = setTimeout(() => setVisible(true), 8000);
      return () => clearTimeout(timer);
    }

    // Chrome/Edge: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).deferredInstallPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
      setTimeout(() => setVisible(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setVisible(false);
        (window as any).deferredInstallPrompt = null;
        window.dispatchEvent(new CustomEvent('pwa-prompt-installed'));
        localStorage.setItem(DISMISS_KEY, 'permanent');
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = (permanent: boolean) => {
    localStorage.setItem(DISMISS_KEY, permanent ? 'permanent' : String(Date.now()));
    setVisible(false);
  };

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl">
            <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0" />

            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Smartphone size={20} className="text-blue-400" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground tracking-tight">
                    Install App
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {isIOS
                      ? 'Tap the Share button, then "Add to Home Screen" for the best experience with notifications.'
                      : 'Install Legacy Life Builder for offline access and real-time notifications.'}
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    {!isIOS && deferredPrompt && (
                      <button
                        onClick={handleInstall}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all active:scale-95"
                      >
                        <Download size={12} />
                        Install
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(false)}
                      className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Not now
                    </button>
                    <button
                      onClick={() => handleDismiss(true)}
                      className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    >
                      Don't ask again
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleDismiss(false)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
