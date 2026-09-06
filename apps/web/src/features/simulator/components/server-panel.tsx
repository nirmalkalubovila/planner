import React from 'react';
import { useSimulatorStore } from '../state/simulator-store';
import { 
  Server, Wifi, WifiOff, Settings, Play, RefreshCw, 
  Clock, Sliders 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/typography';

export const ServerPanel: React.FC = () => {
  const {
    mode,
    setMode,
    isOnline,
    setIsOnline,
    networkLatency,
    setNetworkLatency,
    simulationSpeed,
    setSimulationSpeed,
    stdServerVersion,
    stdDeleteOldChunks,
    setDeleteOldChunks,
    stdAutoPoll,
    setStdAutoPoll,
    pwaServerVersion,
    swStatus,
    swActiveVersion,
    swWaitingVersion,
    deployUpdate,
    checkVersion,
    triggerByteCheck
  } = useSimulatorStore();

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-md flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Server Control Panel
        </CardTitle>
        <CardDescription className="text-xs">
          Orchestrate deployments, server rules, and network conditions.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        {/* Connection & Mode selectors */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant={isOnline ? "outline" : "destructive"} 
            size="sm" 
            onClick={() => setIsOnline(!isOnline)}
            className="flex items-center justify-center gap-2 transition-all duration-300 h-9"
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-semibold">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-destructive-foreground animate-bounce" />
                <span className="text-xs font-semibold">Offline</span>
              </>
            )}
          </Button>

          <div className="flex bg-secondary/80 rounded-lg p-0.5 border h-9 items-center">
            <button
              onClick={() => setMode('standard')}
              className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${
                mode === 'standard' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setMode('pwa')}
              className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${
                mode === 'pwa' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              PWA
            </button>
          </div>
        </div>

        {/* Server State Header */}
        <div className="p-3 bg-secondary/30 rounded-xl border border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="h-4 w-4 text-blue-400" />
            <div>
              <div className="text-xs font-bold">App Server v{mode === 'standard' ? stdServerVersion : pwaServerVersion}</div>
              <div className="text-[9px] text-muted-foreground font-mono">production-cdn-node</div>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>

        {/* Deploy & Setup controls based on Mode */}
        {mode === 'standard' ? (
          <div className="space-y-3 pt-1">
            <Button 
              onClick={() => deployUpdate()} 
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md font-bold text-xs h-9"
            >
              <Play className="h-3 w-3 fill-current" />
              Deploy version {stdServerVersion === '1.0.0' ? 'v2.0.0' : 'v1.0.0'}
            </Button>

            <Divider className="my-2" />

            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 bg-secondary/20 hover:bg-secondary/30 rounded-lg cursor-pointer transition-colors border text-[11px] font-semibold">
                <div className="flex flex-col">
                  <span>Purge Hashed Chunks</span>
                  <span className="text-[8.5px] text-muted-foreground font-normal">Deletes old chunks during deployment</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={stdDeleteOldChunks} 
                  onChange={(e) => setDeleteOldChunks(e.target.checked)}
                  className="rounded bg-background border-border text-primary focus:ring-ring"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-secondary/20 hover:bg-secondary/30 rounded-lg cursor-pointer transition-colors border text-[11px] font-semibold">
                <div className="flex flex-col">
                  <span>Enable Auto Version Poll</span>
                  <span className="text-[8.5px] text-muted-foreground font-normal">Checks version.json every 8 seconds</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={stdAutoPoll} 
                  onChange={(e) => setStdAutoPoll(e.target.checked)}
                  className="rounded bg-background border-border text-primary focus:ring-ring"
                />
              </label>
            </div>

            <Button 
              variant="outline" 
              onClick={() => checkVersion(false)}
              className="w-full text-xs font-bold h-8.5"
              disabled={!isOnline}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Trigger Version Check
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <Button 
              onClick={() => deployUpdate()} 
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-md font-bold text-xs h-9"
            >
              <Play className="h-3 w-3 fill-current" />
              Deploy SW Update {pwaServerVersion === '1.0.0' ? 'v2.0.0' : 'v1.0.0'}
            </Button>

            <Divider className="my-2" />

            <div className="p-3 bg-secondary/20 rounded-xl space-y-1.5 border border-border/80 text-[10px]">
              <span className="uppercase font-bold tracking-wider text-muted-foreground">Active PWA Service Worker</span>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${
                  swStatus === 'activated' ? 'bg-green-500 animate-pulse' :
                  swStatus === 'waiting' ? 'bg-amber-500 animate-bounce' :
                  'bg-blue-400 animate-pulse'
                }`} />
                <span className="font-bold uppercase tracking-wide text-foreground">
                  {swStatus}
                </span>
              </div>
              <div className="text-muted-foreground">
                Active SW: <span className="font-semibold text-foreground">v{swActiveVersion}</span>
                {swWaitingVersion && (
                  <span> | Waiting: <span className="font-semibold text-amber-400">v{swWaitingVersion}</span></span>
                )}
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => triggerByteCheck()}
              className="w-full text-xs font-bold h-8.5"
              disabled={!isOnline}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Sync / Byte-Check SW Script
            </Button>
          </div>
        )}

        <Divider className="my-3" />

        {/* Network Conditions Sliders */}
        <div className="space-y-3 text-xs pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/80" />
                Network Latency
              </span>
              <span className="font-mono text-[10px] bg-secondary/50 px-1.5 py-0.2 rounded border">{networkLatency} ms</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="2500" 
              step="250"
              value={networkLatency} 
              onChange={(e) => setNetworkLatency(Number(e.target.value))}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sliders className="h-3.5 w-3.5 text-muted-foreground/80" />
                Simulation Speed
              </span>
              <span className="font-mono text-[10px] bg-secondary/50 px-1.5 py-0.2 rounded border">{simulationSpeed}x</span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-secondary/40 p-0.5 rounded-lg border">
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setSimulationSpeed(s)}
                  className={`py-0.8 text-[9px] font-bold rounded transition-colors ${
                    simulationSpeed === s 
                      ? 'bg-background text-primary shadow-sm border border-border/40' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
