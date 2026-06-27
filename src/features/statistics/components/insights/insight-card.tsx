import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { InsightCardData } from '@/utils/insights-engine';
import type { InsightTheme } from './insight-themes';
import { Target, Sparkles, TrendingUp, TrendingDown, BookOpen, AlertCircle } from 'lucide-react';

interface InsightCardProps {
  data: InsightCardData;
  theme: InsightTheme;
  index: number;
}

export const InsightCard: React.FC<InsightCardProps> = ({ data, theme, index: _index }) => {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1] as [number, number, number, number],
        staggerChildren: 0.12
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "relative w-full h-full flex flex-col justify-between p-7 sm:p-9 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl",
        theme.gradientClass
      )}
      style={{
        boxShadow: `0 25px 50px -12px ${theme.glowColor || 'rgba(0,0,0,0.5)'}`
      }}
    >
      {/* Dark premium mask overlays with generated gym background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.24] z-0 pointer-events-none mix-blend-overlay" 
        style={{ backgroundImage: "url('/gym-wrapped-bg.png')" }} 
      />
      <div className="absolute inset-0 bg-[#06080E]/75 z-0 pointer-events-none" />

      {/* Background soft glow elements */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-black/20 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center z-10">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50 block">
            {data.type === 'intro' ? 'Overview' : data.type === 'outro' ? 'Next Steps' : 'Wrapped Insights'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white mt-1.5 drop-shadow-md">{data.title}</h2>
          {data.subtitle && <p className="text-xs font-semibold text-white/70 mt-1">{data.subtitle}</p>}
        </div>
        <img
          src="/white-logo.svg"
          alt="Legacy Life Builder Logo"
          className="h-9 w-9 object-contain opacity-95 select-none relative z-10 drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] hover:opacity-100 transition-opacity"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center my-6 z-10">
        <RenderCardContent data={data} theme={theme} itemVariants={itemVariants} />
      </div>

      {/* Footer / Watermark */}
      <div className="flex justify-center items-center text-[9px] font-black uppercase tracking-[0.25em] text-white/50 z-10 pt-3.5 border-t border-white/5">
        <span>Legacy Life Builder</span>
      </div>
    </motion.div>
  );
};

// Count-up helper component
const AnimatedNumber: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return setCount(end);

    const duration = 1200; // ms
    const increment = end > start ? 1 : -1;
    const stepTime = Math.max(Math.floor(duration / Math.abs(end - start)), 15);
    
    const timer = setInterval(() => {
      start += increment;
      setCount(start);
      if (start === end) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count}{suffix}</>;
};

// Sub-router for card content layout templates
const RenderCardContent: React.FC<{
  data: InsightCardData;
  theme: InsightTheme;
  itemVariants: any;
}> = ({ data, theme, itemVariants }) => {
  switch (data.type) {
    case 'intro':
      return (
        <motion.div variants={itemVariants} className="text-center space-y-6">
          <div className="relative inline-flex items-center justify-center p-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl animate-pulse">
            <img
              src="/white-logo.svg"
              alt="Legacy Life Builder Logo"
              className="h-12 w-12 object-contain select-none"
            />
          </div>
          <p className="text-sm sm:text-base leading-relaxed max-w-xs mx-auto font-black text-white/70">
            {data.highlightText}
          </p>
        </motion.div>
      );

    case 'stats':
      return (
        <div className="grid grid-cols-1 gap-4 w-full">
          {data.metrics?.map((m, idx) => {
            const numericValue = typeof m.value === 'number' ? m.value : parseInt(m.value.replace(/[^0-9]/g, ''), 10) || 0;
            const isPercent = typeof m.value === 'string' && m.value.includes('%');
            const isFraction = typeof m.value === 'string' && m.value.includes('/');
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="flex items-center justify-between p-4.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 backdrop-blur-xl shadow-lg transition-all duration-300"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{m.label}</span>
                  {m.change !== undefined && m.change !== 0 && (
                    <span className={cn(
                      "flex items-center gap-1 text-[9px] font-black uppercase mt-0.5",
                      m.changeType === 'up' ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {m.changeType === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(m.change)} {m.changeType === 'up' ? 'more' : 'fewer'} vs last week
                    </span>
                  )}
                </div>
                <div className="text-3.5xl font-black tracking-tight text-white drop-shadow-md">
                  {isFraction ? (
                    m.value
                  ) : (
                    <AnimatedNumber value={numericValue} suffix={isPercent ? '%' : ''} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      );

    case 'ranking':
      return (
        <div className="space-y-3.5 w-full">
          {data.listItems?.map((item, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="flex items-center gap-4 p-4.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 backdrop-blur-xl shadow-lg transition-all duration-300"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-black text-white/90 truncate">{item.label}</p>
                {item.sublabel && <p className="text-[10px] font-bold text-white/50 mt-1">{item.sublabel}</p>}
              </div>
              <span className="text-base font-black tracking-tight text-white/90">
                {item.value}
              </span>
            </motion.div>
          ))}
        </div>
      );

    case 'heatmap':
      return (
        <motion.div variants={itemVariants} className="text-center space-y-6 w-full">
          <div className="p-5.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-lg space-y-4">
            <p className="text-xs font-black leading-relaxed text-white/70">{data.highlightText}</p>
            <div className="flex justify-center gap-2 py-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-6 h-6 rounded-md border border-white/10 flex items-center justify-center text-[9px] font-black transition-all",
                    i === 2 || i === 4 ? "bg-white/20 text-white shadow-inner" : "bg-white/5 text-white/30"
                  )}
                >
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </div>
              ))}
            </div>
          </div>
          {data.metrics && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Peak Volume:</span>
              <span className="text-base font-black text-white">{data.metrics[0].value} Tasks</span>
            </div>
          )}
        </motion.div>
      );

    case 'grade':
      const progress = data.progressValue || 0;
      return (
        <motion.div variants={itemVariants} className="text-center space-y-6 w-full">
          <div className="relative inline-flex items-center justify-center">
            {/* Soft backdrop glow */}
            <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl scale-125 pointer-events-none" />
            {/* Grade display circle */}
            <div className="relative w-32 h-32 rounded-full border border-white/10 flex flex-col items-center justify-center bg-white/[0.03] shadow-2xl backdrop-blur-xl">
              <span className="text-5.5xl font-black tracking-tighter text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)]">
                {data.grade}
              </span>
              <span className="text-[9px] font-black uppercase text-white/50 mt-1">{progress}% Efficiency</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-black leading-snug text-white/70">{data.highlightText}</p>
            <div className="w-40 h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
              <motion.div 
                className="h-full bg-white rounded-full" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      );

    case 'radar':
      // Renders a beautiful SVG radar spider chart
      const maxVal = 100;
      const radarPoints = data.radarData || [];
      const axisCount = radarPoints.length;
      const size = 150;
      const center = size / 2;
      const r = size * 0.35; // radar radius

      // Helper to compute node locations
      const getPoint = (index: number, value: number) => {
        const angle = (Math.PI * 2 / axisCount) * index - Math.PI / 2;
        const x = center + r * (value / maxVal) * Math.cos(angle);
        const y = center + r * (value / maxVal) * Math.sin(angle);
        return { x, y };
      };

      const pathData = radarPoints.map((pt, i) => {
        const { x, y } = getPoint(i, pt.value);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(' ') + ' Z';

      // Concentric circles data
      const grids = [0.25, 0.5, 0.75, 1];

      return (
        <motion.div variants={itemVariants} className="flex flex-col items-center space-y-6 w-full">
          <div className="relative w-[150px] h-[150px]">
            <svg width={size} height={size} className="overflow-visible">
              {/* Draw grids */}
              {grids.map((g, idx) => {
                const gridPoints = Array.from({ length: axisCount }).map((_, i) => {
                  const angle = (Math.PI * 2 / axisCount) * i - Math.PI / 2;
                  const x = center + r * g * Math.cos(angle);
                  const y = center + r * g * Math.sin(angle);
                  return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ') + ' Z';
                return (
                  <path 
                    key={idx} 
                    d={gridPoints} 
                    fill="none" 
                    stroke="rgba(255,255,255,0.08)" 
                    strokeWidth={1} 
                  />
                );
              })}

              {/* Draw axes */}
              {Array.from({ length: axisCount }).map((_, i) => {
                const angle = (Math.PI * 2 / axisCount) * i - Math.PI / 2;
                const targetX = center + r * Math.cos(angle);
                const targetY = center + r * Math.sin(angle);
                return (
                  <line 
                    key={i} 
                    x1={center} 
                    y1={center} 
                    x2={targetX} 
                    y2={targetY} 
                    stroke="rgba(255,255,255,0.1)" 
                    strokeWidth={1} 
                  />
                );
              })}

              {/* Draw filled area */}
              <motion.path 
                d={pathData} 
                fill={theme.accentTextColor.includes('emerald') ? 'rgba(52, 211, 153, 0.25)' : theme.accentTextColor.includes('cyan') ? 'rgba(34, 211, 238, 0.25)' : 'rgba(255, 255, 255, 0.25)'}
                stroke={theme.accentTextColor.includes('emerald') ? '#34d399' : theme.accentTextColor.includes('cyan') ? '#22d3ee' : '#ffffff'}
                strokeWidth={2}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ transformOrigin: 'center' }}
              />
              {radarPoints.map((pt, i) => {
                const angle = (Math.PI * 2 / axisCount) * i - Math.PI / 2;
                const labelDist = r + 15;
                const lx = center + labelDist * Math.cos(angle);
                const ly = center + (r + 20) * Math.sin(angle);
                return (
                  <text
                    key={i}
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="text-[9px] font-black fill-white/60 uppercase tracking-widest"
                  >
                    {pt.label}
                  </text>
                );
              })}
            </svg>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 w-full text-center">
            {radarPoints.map((pt, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px] px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-md">
                <span className="font-bold opacity-75">{pt.label}:</span>
                <span className="font-black text-white">{pt.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      );

    case 'quote':
      return (
        <motion.div variants={itemVariants} className="text-center px-4 space-y-6 w-full flex flex-col justify-center items-center">
          <div className="relative">
            <span className="absolute -top-10 -left-6 text-7xl font-serif text-white/10 select-none">“</span>
            <blockquote className="text-base sm:text-lg font-black leading-relaxed italic relative z-10 text-white/70 max-w-xs">
              {data.quote?.text}
            </blockquote>
            <span className="absolute -bottom-16 -right-6 text-7xl font-serif text-white/10 select-none">”</span>
          </div>
          {data.quote?.author && (
            <cite className="block text-[10px] not-italic font-black uppercase tracking-[0.25em] text-white/60 mt-2">
              — {data.quote.author}
            </cite>
          )}
        </motion.div>
      );

    case 'vaultStats':
      return (
        <div className="grid grid-cols-1 gap-4 w-full">
          {data.metrics?.map((m, idx) => {
            const icons = [<Sparkles size={14} />, <AlertCircle size={14} />, <BookOpen size={14} />];
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="flex items-center justify-between p-4.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 backdrop-blur-xl shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                    {icons[idx % icons.length]}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{m.label}</span>
                </div>
                <span className="text-2xl font-black tracking-tight text-white drop-shadow-md">
                  <AnimatedNumber value={typeof m.value === 'number' ? m.value : 0} />
                </span>
              </motion.div>
            );
          })}
          {data.highlightText && (
            <motion.p variants={itemVariants} className="text-[10px] leading-relaxed text-center text-white/60 mt-2 px-2 font-semibold">
              {data.highlightText}
            </motion.p>
          )}
        </div>
      );

    case 'outro':
      return (
        <motion.div variants={itemVariants} className="text-center space-y-6 w-full">
          <div className="relative inline-flex items-center justify-center p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md animate-bounce">
            <Target className="h-10 w-10 text-white" />
          </div>
          <div className="p-5.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-lg space-y-2.5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60">Weekly Suggestion</h4>
            <p className="text-sm font-black leading-relaxed text-white/70">{data.highlightText}</p>
          </div>
        </motion.div>
      );

    case 'summary':
      const completedCount = typeof data.metrics?.[0]?.value === 'number' 
        ? data.metrics[0].value 
        : parseInt(String(data.metrics?.[0]?.value || 0), 10);
      const habitsCount = typeof data.metrics?.[1]?.value === 'number' 
        ? data.metrics[1].value 
        : parseInt(String(data.metrics?.[1]?.value || 0), 10);
      const hoursCount = (completedCount * 1.5).toFixed(1);
      const insightsCount = data.metrics?.[3]?.value ?? 0;
      const isMonthly = data.title?.toLowerCase().includes('month');

      return (
        <motion.div variants={itemVariants} className="w-full flex flex-col gap-4 text-left">
          {/* Heatmap Grid Section */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-lg space-y-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Activity Heatmap</span>
            {isMonthly ? (
              /* Monthly compact grid (30 blocks) */
              <div className="grid grid-cols-10 gap-1.5 py-1">
                {Array.from({ length: 30 }).map((_, i) => {
                  const isActive = (i * 7) % 3 === 0 || i % 5 === 0; // deterministic mockup representation
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "w-4 h-4 rounded-sm border border-white/5 transition-all",
                        isActive ? "bg-emerald-500/30 border-emerald-500/20" : "bg-white/5"
                      )} 
                    />
                  );
                })}
              </div>
            ) : (
              /* Weekly 7 day blocks */
              <div className="flex justify-between gap-1.5 py-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                  const isActive = i === 1 || i === 2 || i === 4; // mockup representation
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "flex-1 py-1.5 rounded-md border text-[9px] font-black text-center transition-all",
                        isActive 
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-inner" 
                          : "bg-white/5 border-white/5 text-white/30"
                      )}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Metrics Grid (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center flex flex-col justify-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-white/45 block mb-1">Tasks Done</span>
              <span className="text-2xl font-black text-white">{completedCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center flex flex-col justify-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-white/45 block mb-1">Hours Focused</span>
              <span className="text-2xl font-black text-white">{hoursCount}h</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center flex flex-col justify-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-white/45 block mb-1">Habits Done</span>
              <span className="text-2xl font-black text-white">{habitsCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center flex flex-col justify-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-white/45 block mb-1">Insights Logged</span>
              <span className="text-2xl font-black text-white">{insightsCount}</span>
            </div>
          </div>

          {/* Comparison Rank Badge */}
          {data.highlightText && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 shadow-lg relative overflow-hidden">
              <div className="absolute right-3 top-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-widest animate-pulse">
                Global Rank
              </div>
              <p className="text-xs font-black leading-snug text-white/90 pr-20">{data.highlightText}</p>
            </div>
          )}
        </motion.div>
      );

    default:
      return null;
  }
};
