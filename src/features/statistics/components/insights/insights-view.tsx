import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Play, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInsights } from '../../hooks/use-insights';
import { StoryViewer } from './story-viewer';
import { getInsightTheme } from './insight-themes';
import { PageLoader } from '@/components/common/page-loader';
import { useNotificationStore } from '@/lib/notification-store';
import { Button } from '@/components/ui/button';

export const InsightsView: React.FC = () => {
  const { data, isLoading } = useInsights();
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [viewerOpen, setViewerOpen] = useState(false);
  const preferences = useNotificationStore((s) => s.preferences);

  if (isLoading || !data) {
    return <PageLoader />;
  }

  const weeklyCards = data.weekly || [];
  const monthlyCards = data.monthly || [];
  
  const currentCards = activeTab === 'weekly' ? weeklyCards : monthlyCards;
  
  // Create deterministic hash seed for color styling
  const hashSeed = activeTab === 'weekly' 
    ? new Date().toISOString().split('T')[0] // today's date splits key
    : `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;

  // Next run schedule helpers
  const getNextReportScheduleText = () => {
    if (activeTab === 'weekly') {
      const day = preferences.weeklyReportDay || 'Sunday';
      const time = preferences.weeklyReportTime || '20:00';
      return `Generates every ${day} at ${time}`;
    } else {
      const dayNum = preferences.monthlyReportDay || 1;
      const time = preferences.monthlyReportTime || '20:00';
      const suffix = dayNum === 1 ? '1st' : dayNum === 2 ? '2nd' : dayNum === 3 ? '3rd' : `${dayNum}th`;
      return `Generates on the ${suffix} of the month at ${time}`;
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500 max-w-[1000px] mx-auto select-none">
      
      {/* Upper Selector Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-1 p-1 rounded-full bg-muted border border-border w-fit z-20 relative select-none">
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={cn(
              'relative px-5 py-2 text-xs font-black uppercase tracking-wider rounded-full transition-colors duration-150 focus:outline-none select-none cursor-pointer',
              activeTab === 'weekly' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {activeTab === 'weekly' && (
              <motion.span
                layoutId="active-insight-tab"
                className="absolute inset-0 rounded-full bg-accent border border-border pointer-events-none"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 pointer-events-none">
              <Sparkles size={12} className="pointer-events-none" /> Weekly Reflection
            </span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={cn(
              'relative px-5 py-2 text-xs font-black uppercase tracking-wider rounded-full transition-colors duration-150 focus:outline-none select-none cursor-pointer',
              activeTab === 'monthly' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {activeTab === 'monthly' && (
              <motion.span
                layoutId="active-insight-tab"
                className="absolute inset-0 rounded-full bg-accent border border-border pointer-events-none"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 pointer-events-none">
              <Calendar size={12} className="pointer-events-none" /> Monthly Report
            </span>
          </button>
        </div>

        {/* Schedule metadata information */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <HelpCircle size={12} />
          <span>{getNextReportScheduleText()}</span>
        </div>
      </div>

      {/* Main hero call to action area (Spotify Wrapped cover style) */}
      {currentCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Main big cover CTA */}
          <div className="md:col-span-3 rounded-[2rem] border border-border bg-card/40 overflow-hidden relative p-6 sm:p-8 flex flex-col justify-center gap-5 h-[280px] shadow-2xl">
            {/* Blended background illustration representing personal growth */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-[0.3] pointer-events-none mix-blend-overlay" 
              style={{ 
                backgroundImage: activeTab === 'weekly' 
                  ? "url('/weekly-growth-cover.png')" 
                  : "url('/monthly-growth-cover.png')" 
              }} 
            />
            <div className="absolute inset-0 bg-[#06080E]/75 pointer-events-none" />
            
            {/* Top Info */}
            <div className="space-y-3 z-10 relative">
              <div className="inline-flex p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground shadow-sm">
                {activeTab === 'weekly' ? <Sparkles size={16} className="animate-spin" /> : <Calendar size={16} />}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white uppercase drop-shadow-md">
                  {activeTab === 'weekly' ? 'Your Week in Motion' : 'Your Month in Focus'}
                </h2>
                <p className="text-xs text-white/50 leading-relaxed font-semibold max-w-sm">
                  {activeTab === 'weekly' 
                    ? 'Check out your statistics, consistency grade, productivity flow days, and habits metrics in full screen!'
                    : 'Analyze your long-term goal velocity, radar balance metrics, notes captured, and quotes added to the Vault.'}
                </p>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="z-10 relative">
              <Button
                onClick={() => setViewerOpen(true)}
                className="w-full sm:w-fit px-6 py-4.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] transition-all bg-white text-black hover:bg-white/90 shadow-lg shadow-black/20"
              >
                <Play size={11} fill="currentColor" /> Play Reflections Story
              </Button>
            </div>
          </div>

          {/* Side overlapping stacked card preview grid */}
          <div className="md:col-span-2 flex flex-col justify-center space-y-4 relative min-h-[300px]">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Card Deck Preview</span>
            <div className="relative h-[280px] w-full flex items-center justify-center">
              {currentCards.slice(0, 3).map((card, idx) => {
                const theme = getInsightTheme(idx, hashSeed);
                const rot = [4, -4, 2][idx];
                const shiftY = idx * 10;
                
                return (
                  <motion.div
                    key={idx}
                    className={cn(
                      "absolute w-[220px] h-[260px] rounded-3xl p-5 flex flex-col justify-between border border-white/10 shadow-2xl overflow-hidden select-none pointer-events-none",
                      theme.gradientClass
                    )}
                    style={{
                      transform: `rotate(${rot}deg) translateY(${shiftY}px)`,
                      zIndex: 3 - idx,
                      boxShadow: `0 15px 35px -8px ${theme.glowColor || 'rgba(0,0,0,0.5)'}`
                    }}
                  >
                    {/* Dark premium mask overlays with generated gym background */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-[0.24] z-0 pointer-events-none mix-blend-overlay" 
                      style={{ backgroundImage: "url('/gym-wrapped-bg.png')" }} 
                    />
                    <div className="absolute inset-0 bg-[#06080E]/75 z-0 pointer-events-none" />

                    <div className="flex justify-between items-start z-10 relative">
                      <span className="text-[8px] uppercase tracking-widest font-black text-white/50">Insight</span>
                      <img
                        src="/white-logo.svg"
                        alt="Legacy Life Builder Logo"
                        className="h-5 w-5 object-contain opacity-80"
                      />
                    </div>
                    <div className="space-y-1 my-3 z-10 relative">
                      <h4 className="text-xs font-black uppercase leading-tight truncate text-white">{card.title}</h4>
                      {card.highlightText && (
                        <p className="text-[9px] opacity-70 leading-normal line-clamp-4 font-semibold text-white/70">{card.highlightText}</p>
                      )}
                      {card.quote && (
                        <p className="text-[9px] opacity-70 leading-normal italic line-clamp-4 font-semibold text-white/70">“{card.quote.text}”</p>
                      )}
                    </div>
                    <div className="text-[8px] uppercase tracking-widest font-black text-white/50 text-right z-10 relative">
                      &nbsp;
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-border bg-card/20 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground/30">
            <Sparkles size={32} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-foreground uppercase tracking-widest">No Insights Generated Yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Keep planning your planner grid, completing tasks on the Today view, and creating vault entries. Your wrapped report will populate soon!
            </p>
          </div>
        </div>
      )}

      {/* Story Viewer overlay component */}
      <StoryViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        cards={currentCards}
        hashSeed={hashSeed}
      />

    </div>
  );
};
