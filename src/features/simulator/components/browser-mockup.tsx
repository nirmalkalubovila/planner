import React from 'react';
import { useSimulatorStore } from '../state/simulator-store';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCcw, AlertTriangle, AppWindow, FileCode, CheckCircle, 
  RefreshCw, Chrome 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const BrowserMockup: React.FC = () => {
  const {
    mode,
    stdClientVersion,
    pwaClientVersion,
    stdRoute,
    pwaRoute,
    stdToast,
    pwaToast,
    stdErrorBoundary,
    pwaErrorBoundary,
    swActiveVersion,
    handleToastUpdate,
    fallbackHardReload,
    activateNewSw,
    navigate,
    addLog,
    stdServerVersion
  } = useSimulatorStore();

  const isStandard = mode === 'standard';
  const currentRoute = isStandard ? stdRoute : pwaRoute;
  const clientVersion = isStandard ? stdClientVersion : pwaClientVersion;
  const errorBoundary = isStandard ? stdErrorBoundary : pwaErrorBoundary;
  const toastMessage = isStandard ? stdToast : pwaToast;

  // Custom PWA reload simulation: reload mounts assets from active SW cache
  const handlePwaReload = async () => {
    addLog('client', 'Manual reload triggered in PWA...', 'info');
    await new Promise(resolve => setTimeout(resolve, 400));
    addLog('sw', `Serving root index.html and assets from active CacheStorage (${swActiveVersion})`, 'success');
    
    // Set route back to home and client version back to active SW version
    useSimulatorStore.setState({ pwaClientVersion: swActiveVersion, pwaRoute: 'home', pwaErrorBoundary: null });
    addLog('client', `PWA Reload complete. Active client version: v${swActiveVersion}`, 'success');
  };

  const handleBrowserReload = () => {
    if (isStandard) {
      if (stdToast) {
        handleToastUpdate();
      } else {
        fallbackHardReload();
      }
    } else {
      handlePwaReload();
    }
  };

  return (
    <Card className="border-border/80 bg-card overflow-hidden shadow-xl flex flex-col h-full ring-2 ring-primary/5">
      {/* 1. Window top header bar */}
      <div className="bg-secondary/65 px-3 py-2 border-b border-border flex items-center gap-2 select-none">
        {/* Decorative window controls */}
        <div className="flex gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>

        {/* Reload button */}
        <button 
          onClick={handleBrowserReload}
          className="p-1 hover:bg-background rounded transition-colors text-muted-foreground hover:text-foreground shrink-0"
          title="Browser Reload"
        >
          <RefreshCcw className="h-3 w-3" />
        </button>

        {/* Address Bar */}
        <div className="flex-1 bg-background/80 border rounded px-2 py-0.5 text-[9px] font-mono text-muted-foreground truncate flex items-center justify-between min-w-0">
          <span className="truncate">https://myapp.com/{currentRoute}</span>
          <div className="flex items-center gap-1 text-[8px] text-muted-foreground/60 shrink-0 ml-1">
            🔒 <span className="font-semibold text-emerald-500">SSL</span>
          </div>
        </div>
      </div>

      {/* 2. Web browser display panel */}
      <div className="flex-1 bg-background p-4 relative min-h-[300px] flex flex-col justify-between">
        {errorBoundary ? (
          /* Error boundary screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-destructive/10 border border-destructive/20 rounded-xl my-auto animate-in fade-in zoom-in-95 duration-300">
            <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
            <h4 className="text-xs font-bold text-destructive">React Router Error Boundary</h4>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] leading-normal font-mono break-all">
              {errorBoundary}
            </p>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={isStandard ? fallbackHardReload : () => useSimulatorStore.setState({ pwaErrorBoundary: null })}
              className="mt-3 text-[10px] h-7 px-3 font-bold"
            >
              Force Hard Reload
            </Button>
          </div>
        ) : (
          /* Normal app routing container */
          <div className="flex-1 flex flex-col justify-between">
            {/* Mock Client app bar */}
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                <Chrome className="h-3 w-3 text-primary" />
                Mock App
              </span>
              <span className="px-2 py-0.2 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-semibold">
                v{clientVersion}
              </span>
            </div>

            {/* Dynamic Viewport */}
            <div className="flex-1 py-4 flex flex-col items-center justify-center text-center">
              {currentRoute === 'home' ? (
                <div className="animate-in fade-in duration-300">
                  <AppWindow className="h-10 w-10 text-primary/45 mx-auto mb-2" />
                  <h3 className="text-xs font-bold text-slate-200">Welcome Home Page</h3>
                  <p className="text-[9px] text-muted-foreground mt-1 max-w-[180px] leading-relaxed">
                    This view is bundled inside the app's main startup script (<code className="bg-muted px-1 rounded text-[8px] font-mono">main.js</code>).
                  </p>
                </div>
              ) : (
                <div className="animate-in fade-in duration-300">
                  <FileCode className="h-10 w-10 text-blue-500/40 mx-auto mb-2" />
                  <h3 className="text-xs font-bold text-slate-200">Lazy Loaded Details</h3>
                  <p className="text-[9px] text-muted-foreground mt-1 max-w-[180px] leading-relaxed">
                    This detail section was loaded asynchronously from chunk script: <code className="bg-muted px-1 rounded text-[8px] font-mono">details.js</code>.
                  </p>
                </div>
              )}
            </div>

            {/* Simulated router navigation footer */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t">
              <button
                onClick={() => navigate('home')}
                className={`py-1.5 rounded text-[10px] font-bold border transition-colors ${
                  currentRoute === 'home' 
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                    : 'hover:bg-accent border-border/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                Home Link
              </button>
              <button
                onClick={() => navigate('details')}
                className={`py-1.5 rounded text-[10px] font-bold border transition-colors ${
                  currentRoute === 'details' 
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                    : 'hover:bg-accent border-border/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                Lazy Page Link
              </button>
            </div>
          </div>
        )}

        {/* 3. Toast alerts popup notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute bottom-16 left-3 right-3 bg-card border border-primary/20 shadow-xl rounded-xl p-3 flex flex-col gap-2 z-30"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-green-500/10 text-green-500 mt-0.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-200">Application Update Available</div>
                  <p className="text-[8.5px] text-muted-foreground leading-normal mt-0.5">
                    {isStandard 
                      ? `New assets v${stdServerVersion} are deployed on the server. Click update to apply.`
                      : 'New version has been pre-cached in the background. Click to activate.'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-1.5">
                <button 
                  onClick={() => {
                    if (isStandard) {
                      useSimulatorStore.setState({ stdToast: null });
                    } else {
                      useSimulatorStore.setState({ pwaToast: null });
                    }
                  }}
                  className="px-2 py-0.5 border border-border/80 rounded text-[8px] font-semibold text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  Ignore
                </button>
                <button 
                  onClick={isStandard ? handleToastUpdate : activateNewSw}
                  className="px-2.5 py-0.5 bg-primary text-primary-foreground rounded text-[8px] font-bold hover:bg-primary/95 flex items-center gap-1 shadow-sm"
                >
                  <RefreshCw className="h-2 w-2" />
                  Reload & Update
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};
