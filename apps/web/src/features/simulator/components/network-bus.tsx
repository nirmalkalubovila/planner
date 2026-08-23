import React from 'react';
import { useSimulatorStore } from '../state/simulator-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, Globe, RefreshCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const NetworkBus: React.FC = () => {
  const {
    mode,
    stdServerVersion,
    stdDeleteOldChunks,
    pwaServerVersion,
    networkAnim
  } = useSimulatorStore();

  return (
    <Card className="border-border/60 bg-card/60 flex-1 flex flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
          <Database className="h-4 w-4" />
          Infrastructure View
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between py-2 gap-4 relative">
        {/* 1. SERVER CDN BOX */}
        <div className="p-3.5 bg-secondary/35 rounded-xl border border-border/80 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Server className="h-4 w-4 text-blue-500" />
              Web Server / CDN Assets
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              v{mode === 'standard' ? stdServerVersion : pwaServerVersion}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-2 bg-background/50 border rounded flex items-center justify-between">
              <span>index.html</span>
              <span className="text-muted-foreground text-[8px] uppercase">Entry</span>
            </div>
            
            {mode === 'standard' ? (
              <>
                <div className={`p-2 border rounded flex items-center justify-between transition-colors ${
                  stdServerVersion === '1.0.0' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                }`}>
                  <span>main.v{stdServerVersion}.js</span>
                  <span className="text-[8px] font-semibold text-emerald-400">active</span>
                </div>
                <div className={`p-2 border rounded flex items-center justify-between transition-colors ${
                  stdServerVersion === '1.0.0' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                }`}>
                  <span>details.v{stdServerVersion}.js</span>
                  <span className="text-[8px] font-semibold text-emerald-400">active</span>
                </div>
                {!stdDeleteOldChunks && stdServerVersion === '2.0.0' && (
                  <div className="p-2 bg-background/30 border border-dashed rounded flex items-center justify-between text-muted-foreground/60">
                    <span>details.v1.0.0.js</span>
                    <span className="text-[8px]">legacy</span>
                  </div>
                )}
                <div className="p-2 bg-background/50 border rounded flex items-center justify-between">
                  <span>version.json</span>
                  <span className="text-[8px] text-yellow-400 font-semibold">{stdServerVersion}</span>
                </div>
              </>
            ) : (
              <>
                <div className={`p-2 border rounded flex items-center justify-between transition-colors ${
                  pwaServerVersion === '1.0.0' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                }`}>
                  <span>main.v{pwaServerVersion}.js</span>
                  <span className="text-[8px] text-purple-400">app-shell</span>
                </div>
                <div className={`p-2 border rounded flex items-center justify-between transition-colors ${
                  pwaServerVersion === '1.0.0' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                }`}>
                  <span>details.v{pwaServerVersion}.js</span>
                  <span className="text-[8px] text-purple-400">lazy-chunk</span>
                </div>
                <div className="p-2 bg-background/50 border rounded flex items-center justify-between">
                  <span>service-worker.js</span>
                  <span className="text-[8px] text-yellow-400 font-semibold">SW v{pwaServerVersion}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 2. PHYSICAL NETWORK TRANSIT BUS */}
        <div className="h-24 flex flex-col items-center justify-center relative border-l border-r border-dashed border-border/80 my-1 bg-secondary/5 rounded-lg">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 select-none pointer-events-none">
            <div className="w-px h-full bg-gradient-to-b from-blue-500/20 via-transparent to-purple-500/20" />
            <div className="absolute text-[8px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground/50" />
              Network Request Pipe
            </div>
          </div>

          <AnimatePresence>
            {networkAnim.active && (
              <motion.div
                initial={{ 
                  y: networkAnim.direction === 'to-server' ? 45 : -45,
                  opacity: 0,
                  scale: 0.85
                }}
                animate={{ 
                  y: networkAnim.direction === 'to-server' ? -45 : 45, 
                  opacity: [0, 1, 1, 0],
                  scale: 1
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute z-20 flex items-center justify-center"
              >
                <div className={`px-2 py-1 ${networkAnim.color} text-white text-[9px] font-bold font-mono rounded shadow-lg flex items-center gap-1.5`}>
                  <RefreshCcw className="h-2.5 w-2.5 animate-spin" />
                  {networkAnim.label}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. LOCAL BROWSER CACHE LABELS */}
        <div className="p-3.5 bg-secondary/25 border border-border/50 rounded-xl relative z-10 text-center">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Client Browser Environment
          </div>
          <p className="text-[9.5px] text-muted-foreground mt-1 max-w-[280px] mx-auto leading-relaxed">
            Requests travel from browser mockup below, crossing the network pipe to fetch assets from Web Server.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
