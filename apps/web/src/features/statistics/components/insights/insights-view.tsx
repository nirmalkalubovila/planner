import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Play, Trophy, Flame, Zap, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInsights } from '../../hooks/use-insights';
import { StoryViewer } from './story-viewer';
import { getInsightTheme } from './insight-themes';
import { PageLoader } from '@/components/common/page-loader';
import { Button } from '@/components/ui/button';

export const InsightsView: React.FC = () => {
  const { data, isLoading } = useInsights();
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [viewerOpen, setViewerOpen] = useState(false);

  if (isLoading || !data) {
    return <PageLoader />;
  }

  const weeklyCards = data.weekly || [];
  const monthlyCards = data.monthly || [];
  
  const currentCards = activeTab === 'weekly' ? weeklyCards : monthlyCards;
  const wins = activeTab === 'weekly' ? data.weeklyWins || [] : data.monthlyWins || [];
  
  // Create deterministic hash seed for color styling
  const hashSeed = activeTab === 'weekly' 
    ? new Date().toISOString().split('T')[0]
    : `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500 select-none">
      
      {/* Upper Selector Toggle */}
      <div className="flex items-center justify-between border-b border-border pb-4">
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
      </div>

      {/* Main Card Deck Preview & Play Button */}
      {currentCards.length > 0 ? (
        <div className="flex flex-col items-center justify-center space-y-6 py-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Card Deck Preview</span>
          
          {/* Stacked card deck preview */}
          <div className="relative h-[300px] w-full max-w-[280px] flex items-center justify-center">
            {currentCards.slice(0, 3).map((card, idx) => {
              const theme = getInsightTheme(idx, hashSeed);
              const rot = [4, -4, 2][idx];
              const shiftY = idx * 10;
              
              return (
                <motion.div
                  key={idx}
                  className={cn(
                    "absolute w-[240px] h-[280px] rounded-3xl p-5 flex flex-col justify-between border border-white/10 shadow-2xl overflow-hidden select-none pointer-events-none",
                    theme.gradientClass
                  )}
                  style={{
                    transform: `rotate(${rot}deg) translateY(${shiftY}px)`,
                    zIndex: 3 - idx,
                    boxShadow: `0 15px 35px -8px ${theme.glowColor || 'rgba(0,0,0,0.5)'}`
                  }}
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-[0.24] z-0 pointer-events-none mix-blend-overlay" 
                    style={{ backgroundImage: "url('/gym-wrapped-bg.png')" }} 
                  />
                  <div className="absolute inset-0 bg-[#06080E]/75 z-0 pointer-events-none" />

                  <div className="flex justify-between items-start z-10 relative">
                    <span className="text-[8px] uppercase tracking-widest font-black text-white/50">Insight</span>
                    <img
                      src="/white-logo.svg"
                      alt="Legacy Logo"
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

          {/* Play Button Only */}
          <Button
            onClick={() => setViewerOpen(true)}
            className="w-auto px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] transition-all bg-white text-black hover:bg-white/90 shadow-xl shadow-black/20 mt-6"
          >
            <Play size={13} fill="currentColor" /> {activeTab === 'weekly' ? 'Play Reflections Story' : 'Play Monthly Story'}
          </Button>
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

      {/* Point-wise system wins section */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
            {activeTab === 'weekly' ? "Weekly System Breakthroughs" : "Monthly System Breakthroughs"}
          </h3>
        </div>
        
        {wins.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wins.map((win, idx) => (
              <motion.div
                key={win.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="relative rounded-2xl border border-border bg-card/60 p-4 pl-6 flex gap-4 items-start hover:border-primary/30 transition-colors"
              >
                <div className={cn(
                  "absolute left-0 top-4 bottom-4 w-1 rounded-r-lg",
                  win.type === 'goal' && "bg-intent-goal",
                  win.type === 'habit' && "bg-intent-habit",
                  win.type === 'execution' && "bg-intent-warning",
                  win.type === 'vault' && "bg-indigo-400"
                )} />
                
                <div className="p-2 rounded-xl bg-muted shrink-0 text-foreground">
                  {win.type === 'goal' && <Trophy size={16} className="text-intent-goal" />}
                  {win.type === 'habit' && <Flame size={16} className="text-intent-habit" />}
                  {win.type === 'execution' && <Zap size={16} className="text-intent-warning" />}
                  {win.type === 'vault' && <Brain size={16} className="text-indigo-400" />}
                </div>
                
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block truncate">
                    {win.title}
                  </span>
                  <p className="text-xs text-foreground font-medium leading-normal">
                    {win.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-muted/20 border border-border text-center text-xs text-muted-foreground">
            Complete tasks, build habit streaks, and achieve goals to generate breakthrough wins!
          </div>
        )}
      </div>

      {/* Full-screen story overlay component */}
      <StoryViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        cards={currentCards}
        hashSeed={hashSeed}
      />
    </div>
  );
};
