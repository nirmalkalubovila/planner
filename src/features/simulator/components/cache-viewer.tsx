import React from 'react';
import { useSimulatorStore } from '../state/simulator-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Chrome, FileCode, Layers } from 'lucide-react';

export const CacheViewer: React.FC = () => {
  const {
    mode,
    stdClientVersion,
    stdLoadedChunks,
    pwaCacheBucket,
    swActiveVersion
  } = useSimulatorStore();

  const isStandard = mode === 'standard';

  return (
    <Card className="border-border/60 bg-card/60 flex-1 flex flex-col overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
          <Chrome className="h-4 w-4 text-orange-400" />
          Client Storage & Cache Policies
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
        {isStandard ? (
          /* Standard Mode HTTP Cache table layout */
          <div className="space-y-3.5">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                HTTP Browser Cache (Disk/Memory Cache)
              </span>
              <p className="text-[9px] text-muted-foreground leading-normal">
                Standard apps rely on the browser's HTTP cache. Files are matched by URL path. Hashed names bust the cache on update.
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden bg-background/30 text-[9.5px]">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-1.5 p-2 bg-secondary/40 font-bold border-b select-none">
                <span className="col-span-5">Asset Resource</span>
                <span className="col-span-4">Cache-Control Header</span>
                <span className="col-span-3 text-right">Hit / Miss Status</span>
              </div>

              {/* Data Rows */}
              <div className="divide-y divide-border/60 font-mono">
                {/* Entry file */}
                <div className="grid grid-cols-12 gap-1.5 p-2 hover:bg-secondary/15 transition-colors items-center">
                  <span className="col-span-5 font-semibold text-slate-200">index.html</span>
                  <span className="col-span-4 text-amber-400 text-[8.5px]">no-cache</span>
                  <span className="col-span-3 text-right text-emerald-400 text-[8.5px]">Revalidates (v{stdClientVersion})</span>
                </div>
                
                {/* Main script */}
                <div className="grid grid-cols-12 gap-1.5 p-2 hover:bg-secondary/15 transition-colors items-center">
                  <span className="col-span-5 font-semibold text-slate-200">main.v{stdClientVersion}.js</span>
                  <span className="col-span-4 text-blue-400 text-[8px]">max-age=31536000, immutable</span>
                  <span className="col-span-3 text-right text-emerald-500 font-semibold">CACHE HIT (Infinite)</span>
                </div>

                {/* Loaded chunks */}
                {stdLoadedChunks.filter(c => c.startsWith('details')).map(chunk => (
                  <div key={chunk} className="grid grid-cols-12 gap-1.5 p-2 hover:bg-secondary/15 transition-colors items-center">
                    <span className="col-span-5 text-slate-200 flex items-center gap-1">
                      <FileCode className="h-3 w-3 text-blue-500 shrink-0" />
                      <span className="truncate">{chunk}</span>
                    </span>
                    <span className="col-span-4 text-blue-400 text-[8px]">max-age=31536000, immutable</span>
                    <span className="col-span-3 text-right text-emerald-500 font-semibold">CACHE HIT (Infinite)</span>
                  </div>
                ))}
                
                {/* Version file */}
                <div className="grid grid-cols-12 gap-1.5 p-2 hover:bg-secondary/15 transition-colors items-center">
                  <span className="col-span-5 font-semibold text-slate-200">version.json</span>
                  <span className="col-span-4 text-red-400 text-[8.5px]">no-cache, no-store</span>
                  <span className="col-span-3 text-right text-yellow-500">CACHE BYPASS (Fetch)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* PWA Mode CacheStorage layout */
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                CacheStorage API (PWA Isolation)
              </span>
              <p className="text-[9px] text-muted-foreground leading-normal">
                PWAs cache files inside named buckets via the Service Worker. Caches are served offline-first, bypassing network queries.
              </p>
            </div>

            <div className="space-y-2.5">
              {Object.entries(pwaCacheBucket).map(([bucket, assets]) => (
                <div key={bucket} className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                  <div className="text-[10px] font-bold text-purple-400 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      📂 Cache Storage: {bucket}
                    </span>
                    <span className={`px-2 py-0.2 text-[8px] rounded border ${
                      bucket.includes(swActiveVersion) 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                    }`}>
                      {bucket.includes(swActiveVersion) ? 'Active SW Cache' : 'Pre-caching SW'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
                    {assets.map(asset => (
                      <span key={asset} className="px-2 py-0.6 bg-background/50 border border-border/80 rounded text-slate-300">
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(pwaCacheBucket).length === 0 && (
                <div className="p-6 border border-dashed rounded-xl text-center text-muted-foreground/60 text-xs font-mono">
                  CacheStorage is empty.
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
