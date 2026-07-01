import React, { useRef, useEffect } from 'react';
import { useSimulatorStore } from '../state/simulator-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Terminal, CornerDownLeft, RefreshCcw, History } from 'lucide-react';

export const ConsoleLog: React.FC = () => {
  const {
    logs,
    clearLogs,
    history,
    replayStep,
    resetSimulation
  } = useSimulatorStore();

  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom when new logs are added
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <Card className="border-border bg-card/75 backdrop-blur-md overflow-hidden flex flex-col h-full">
      {/* Tab/Console Header */}
      <CardHeader className="py-2.5 px-4 bg-secondary/35 border-b border-border flex flex-row items-center justify-between shrink-0">
        <CardTitle className="text-xs font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          Interactive Console & Step Timeline
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetSimulation}
            className="h-6 text-[10px] px-2 flex items-center gap-1 hover:bg-secondary"
          >
            <RefreshCcw className="h-2.5 w-2.5" />
            Reset Sim
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearLogs}
            className="h-6 text-[10px] px-2 hover:bg-secondary text-muted-foreground"
          >
            Clear Console
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border/60 overflow-hidden min-h-[220px]">
        {/* LEFT COLUMN: Terminal Logs (7 cols) */}
        <div className="md:col-span-7 flex flex-col bg-black/40 overflow-hidden h-full">
          <div className="p-2 border-b border-border/30 bg-black/20 text-[9px] uppercase font-bold text-muted-foreground select-none">
            Console stdout / stderr
          </div>
          
          <div className="flex-1 p-3 font-mono text-[10px] overflow-y-auto space-y-1.5 min-h-0 max-h-[190px]">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 leading-relaxed text-muted-foreground hover:bg-secondary/10 px-1 py-0.5 rounded transition-colors">
                <span className="text-[9px] opacity-40 select-none shrink-0">{log.time}</span>
                <span className={`text-[8.5px] uppercase font-black shrink-0 px-1.5 py-0.2 rounded tracking-wide text-center w-14 select-none ${
                  log.source === 'server' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  log.source === 'network' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                  log.source === 'sw' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                  'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                }`}>
                  {log.source}
                </span>
                
                <span className={`flex-1 break-all ${
                  log.type === 'error' ? 'text-destructive font-semibold' :
                  log.type === 'warning' ? 'text-amber-400' :
                  log.type === 'success' ? 'text-green-400' :
                  'text-slate-300'
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
            
            {logs.length === 0 && (
              <div className="text-muted-foreground/35 text-center py-10 select-none font-mono">
                [Logs empty. Interact with controls to trigger events]
              </div>
            )}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* RIGHT COLUMN: Replay Step History (5 cols) */}
        <div className="md:col-span-5 flex flex-col bg-secondary/10 overflow-hidden h-full">
          <div className="p-2 border-b border-border/30 bg-black/10 text-[9px] uppercase font-bold text-muted-foreground flex items-center justify-between select-none">
            <span className="flex items-center gap-1">
              <History className="h-3 w-3" />
              Event Timeline (Rewind)
            </span>
            <span className="text-[8px] text-muted-foreground font-normal">Double-click steps to restore</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3 max-h-[190px]">
            {history.map((step, idx) => (
              <div 
                key={step.id} 
                className="group relative pl-4 border-l border-primary/20 hover:border-primary/50 transition-colors pb-1 text-[10px]"
              >
                {/* Timeline node dot */}
                <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-primary bg-background group-hover:scale-110 transition-transform" />
                
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-200 uppercase tracking-wide text-[9px] text-primary">
                    {idx + 1}. {step.eventType}
                  </span>
                  
                  <button
                    onClick={() => replayStep(step.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 rounded px-1.5 py-0.2 text-[8px] font-bold flex items-center gap-0.5 shadow-sm"
                    title="Rewind simulation to this state"
                  >
                    <CornerDownLeft className="h-2 w-2" />
                    Restore
                  </button>
                </div>

                <div className="text-slate-300 font-medium mt-0.5">{step.description}</div>
                <div className="text-[8.5px] text-muted-foreground font-mono mt-0.5 break-all">
                  ↳ {step.technicalDetail}
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <div className="text-muted-foreground/35 text-center py-10 select-none">
                [No snapshots yet. Deploy or toggle states to log steps]
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
