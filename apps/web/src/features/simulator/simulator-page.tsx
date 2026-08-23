import React, { useEffect } from 'react';
import { useSimulatorStore } from './state/simulator-store';
import { useSimulationTimers } from './hooks/use-simulation-timers';
import { ServerPanel } from './components/server-panel';
import { NetworkBus } from './components/network-bus';
import { BrowserMockup } from './components/browser-mockup';
import { CacheViewer } from './components/cache-viewer';
import { ConsoleLog } from './components/console-log';
import { Layers, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Heading, Text } from '@/components/ui/typography';

export const SimulatorPage: React.FC = () => {
  const {
    mode,
    stdAutoPoll,
    stdServerVersion,
    stdClientVersion,
    isOnline,
    checkVersion
  } = useSimulatorStore();

  const timers = useSimulationTimers();

  // Version polling trigger with auto-cleanup timer hook
  useEffect(() => {
    timers.clearAllTimers();
    if (mode === 'standard' && stdAutoPoll) {
      timers.setInterval(() => {
        checkVersion(true);
      }, 8000);
    }
    return () => {
      timers.clearAllTimers();
    };
  }, [mode, stdAutoPoll, stdServerVersion, stdClientVersion, isOnline, timers, checkVersion]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-20 select-none">
      {/* Top Page Header */}
      <div className="p-6 border-b border-border bg-card/45 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary animate-pulse" />
              <Heading as="h1" className="text-2xl font-black tracking-tight animate-in fade-in slide-in-from-top duration-500">
                Deployment & Update Lifecycle Simulator
              </Heading>
            </div>
            <Text variant="muted" className="mt-1 max-w-2xl text-xs">
              Step through and inspect memory/cache storage states to see how Progressive Web Apps (PWAs) differ from Standard Single Page Apps (SPAs).
            </Text>
          </div>
        </div>
      </div>

      {/* Main dashboard grid */}
      <div className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
        
        {/* COLUMN 1: Server Settings Control Panel (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <ServerPanel />

          {/* Educational task checks list */}
          <Card className="border-border/60 bg-card/60 flex-1 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <BookOpen className="h-4 w-4" />
                Simulation Tasks
              </CardTitle>
            </CardHeader>
            
            <CardContent className="text-xs space-y-3 text-muted-foreground leading-normal flex-1 flex flex-col justify-center">
              {mode === 'standard' ? (
                <ul className="space-y-3 list-decimal list-inside">
                  <li>
                    <strong className="text-slate-200">Simulate a Chunk Loading Error:</strong> 
                    <div className="pl-4 mt-0.5 font-normal">Click <strong className="text-primary">Deploy version</strong>, then navigate to <strong className="text-primary">Lazy Page Link</strong> in Mock App. Because chunk pruning is enabled on the server, the loader returns a 404 error and mounts the React Error Boundary.</div>
                  </li>
                  <li>
                    <strong className="text-slate-200">Verify Version Polling Update:</strong>
                    <div className="pl-4 mt-0.5 font-normal">Click <strong className="text-primary">Deploy version</strong>, then click <strong className="text-primary">Trigger Version Check</strong>. The toast displays. Click "Reload" to fetch index.html and update the client version.</div>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-3 list-decimal list-inside">
                  <li>
                    <strong className="text-slate-200">Service Worker Waiting Lifecycle:</strong>
                    <div className="pl-4 mt-0.5 font-normal">Click <strong className="text-purple-400">Deploy SW Update</strong>, then click <strong className="text-primary">Sync / Byte-Check SW</strong>. The service worker installs and precaches files, but enters the <span className="text-amber-400 font-semibold font-mono">waiting</span> state.</div>
                  </li>
                  <li>
                    <strong className="text-slate-200">Skip Waiting & Cache Swap:</strong>
                    <div className="pl-4 mt-0.5 font-normal">Click the toast banner reload button. The waiting worker activates, deletes the legacy version cache bucket, and reloads to serve files offline-first.</div>
                  </li>
                  <li>
                    <strong className="text-slate-200">Network Offline Simulation:</strong>
                    <div className="pl-4 mt-0.5 font-normal">Toggle <strong className="text-destructive">Offline</strong> on the controls panel. Notice how the PWA navigates between pages served from CacheStorage, while Standard mode crashes.</div>
                  </li>
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUMN 2: Server Assets & Cache storages (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <NetworkBus />
          <CacheViewer />
        </div>

        {/* COLUMN 3: Browser UI Mockup Screen (3 cols) */}
        <div className="lg:col-span-3 flex flex-col">
          <BrowserMockup />
        </div>
      </div>

      {/* Terminal log console and timeline row */}
      <div className="max-w-7xl mx-auto w-full px-6 mt-2">
        <ConsoleLog />
      </div>
    </div>
  );
};
