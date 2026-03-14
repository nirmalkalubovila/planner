import React from 'react';
import { motion } from 'framer-motion';
import { Target, ListTodo, Zap, Shield, Activity, TrendingUp, Brain, Flame } from 'lucide-react';
import { useAnalytics } from '../hooks/use-analytics';
import { Card } from '@/components/ui/card';

export const PerformanceDashboard: React.FC = () => {
    // Consuming actual analytics data with defaults
    const {
        goalYield = 0,
        habitResilience = 0,
        weeklyEfficiency = 0,
        legacyPulse = 0,
    } = useAnalytics();

    // Determine the Peer Class Grouping based on Overall Life Score
    const getPeerGroup = (score: number) => {
        if (score < 30) return { label: '90% Group', desc: 'Low Focus, Limited Effort', status: 'LOW', color: 'text-red-500' };
        if (score <= 80) return { label: '10% Group', desc: 'Established Discipline, Clear Goals', status: 'INITIAL', color: 'text-blue-400' };
        return { label: '1% Group', desc: 'Ultra-Elite, Absolute Clarity', status: 'ELITE', color: 'text-emerald-400' };
    };

    const peerGroup = getPeerGroup(legacyPulse);

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-700">
            
            {/* ROW 1: OVERALL LIFE SCORE */}
            <Card className="relative w-full bg-[#0a0c10] border-white/5 overflow-hidden p-8 min-h-[400px] flex flex-col items-center justify-center">
                {/* Background high-tech effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3 mb-4">
                        <Activity size={18} className="text-primary animate-pulse" />
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/40">Overall Life Score</h2>
                    </div>

                    {/* Central Gauge */}
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        {/* Static background ring */}
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle
                                cx="128"
                                cy="128"
                                r="110"
                                fill="transparent"
                                stroke="rgba(255,255,255,0.02)"
                                strokeWidth="12"
                                strokeDasharray="6 6"
                            />
                        </svg>

                        {/* Animated gauge rings */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative w-52 h-52 flex items-center justify-center"
                        >
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                <motion.circle
                                    cx="104"
                                    cy="104"
                                    r="90"
                                    fill="transparent"
                                    stroke="url(#pulseGradient)"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    initial={{ strokeDasharray: "0 1000" }}
                                    animate={{ strokeDasharray: `${(legacyPulse / 100) * 565} 1000` }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                />
                                <defs>
                                    <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#ef4444" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            
                            <div className="flex flex-col items-center text-center">
                                <span className="text-6xl font-black text-white tracking-tighter filter drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    {legacyPulse}%
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mt-1">Overall Progress</span>
                            </div>
                        </motion.div>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-8 border-t border-white/5 pt-8 w-full max-w-2xl">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Vision Weight</span>
                            <span className="text-sm font-bold text-white/60">60%</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Consistency</span>
                            <span className="text-sm font-bold text-white/60">30%</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Execution</span>
                            <span className="text-sm font-bold text-white/60">10%</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* ROW 2: CORE METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Goal Progress - Emerald */}
                <Card className="bg-[#0a0c10] border-emerald-500/10 hover:border-emerald-500/30 transition-all p-6 group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                            <Target size={16} className="text-emerald-500" />
                        </div>
                        <span className="text-2xl font-black text-emerald-400 tracking-tighter">{goalYield}%</span>
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Goal Progress</h3>
                    <p className="text-[9px] text-white/20 uppercase font-bold mb-4">Milestones, Goals, Achieved</p>
                    <div className="h-[2px] w-full bg-emerald-500/5 rounded-full overflow-hidden mb-4">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${goalYield}%` }}
                            transition={{ duration: 1.5 }}
                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                        />
                    </div>
                    <p className="text-[8px] text-emerald-500/40 leading-relaxed italic">
                        Metric Calculation: &#40;Achieved Milestones / Total Milestones&#41; * 100 with impact weighting.
                    </p>
                </Card>

                {/* Habit Consistency - Blue */}
                <Card className="bg-[#0a0c10] border-blue-500/10 hover:border-blue-500/30 transition-all p-6 group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
                            <ListTodo size={16} className="text-blue-500" />
                        </div>
                        <span className="text-2xl font-black text-blue-400 tracking-tighter">{habitResilience}%</span>
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Habit Consistency</h3>
                    <p className="text-[9px] text-white/20 uppercase font-bold mb-4">Patterns, Days, Active</p>
                    <div className="h-[2px] w-full bg-blue-500/5 rounded-full overflow-hidden mb-4">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${habitResilience}%` }}
                            transition={{ duration: 1.5, delay: 0.2 }}
                            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                        />
                    </div>
                    <p className="text-[8px] text-blue-500/40 leading-relaxed italic">
                        Consistency Calculation: 7-day completion rate of scheduled habits vs checked tasks.
                    </p>
                </Card>

                {/* Execution Score - Amber */}
                <Card className="bg-[#0a0c10] border-amber-500/10 hover:border-amber-500/30 transition-all p-6 group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
                            <Zap size={16} className="text-amber-500" />
                        </div>
                        <span className="text-2xl font-black text-amber-400 tracking-tighter">{weeklyEfficiency}%</span>
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Execution Score</h3>
                    <p className="text-[9px] text-white/20 uppercase font-bold mb-4">Today Tasks, Daily Completion</p>
                    <div className="h-[2px] w-full bg-amber-500/5 rounded-full overflow-hidden mb-4">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${weeklyEfficiency}%` }}
                            transition={{ duration: 1.5, delay: 0.4 }}
                            className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                        />
                    </div>
                    <p className="text-[8px] text-amber-500/40 leading-relaxed italic">
                        Execution Score Calculation: Planned Goal/Custom blocks vs today's checked tasks.
                    </p>
                </Card>
            </div>

            {/* ROW 3: PEER CLASS TRAJECTORY */}
            <Card className="bg-[#0a0c10] border-white/5 p-8 relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                    
                    {/* Video and Trajectory Title */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div>
                            <h2 className="text-base font-black text-white/90 tracking-tight flex items-center gap-2 mb-2">
                                GLOBAL PEER CLASS TRAJECTORY: 
                                <span className="text-primary bg-primary/10 px-3 py-1 rounded-sm border border-primary/20 animate-pulse">
                                    [ {peerGroup.label} ]
                                </span>
                            </h2>
                            <p className="text-[11px] text-white/40 font-medium">
                                Initial calibration class based on overall percentile rank global data subset.
                            </p>
                        </div>

                        {/* Video Player Section */}
                        <div className="relative aspect-video max-w-2xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
                            <video 
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                                className="w-full h-full object-cover mix-blend-screen opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
                            >
                                <source src="/LOGO 11 Inches.mp4" type="video/mp4" />
                            </video>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-transparent to-transparent opacity-60" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Shield size={64} className="text-white/5 group-hover:text-primary/10 transition-all duration-700" />
                            </div>
                        </div>
                    </div>

                    {/* Right Info Panels */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Global Populace Groupings</h4>
                            
                            {/* Groupings with Highlight based on score */}
                            <div className={cn(
                                "p-4 border rounded-xl transition-all duration-500",
                                legacyPulse < 30 ? "bg-red-500/5 border-red-500/20" : "bg-white/[0.02] border-white/5 opacity-40"
                            )}>
                                <span className="text-[10px] font-black text-white/60">[ 90% Group ]</span>
                                <p className="text-[10px] text-white/40 mt-1 italic">Low Focus, limited effort initial phase.</p>
                            </div>

                            <div className={cn(
                                "p-4 border rounded-xl transition-all duration-500",
                                (legacyPulse >= 30 && legacyPulse <= 80) ? "bg-blue-500/5 border-blue-500/20" : "bg-white/[0.02] border-white/5 opacity-40"
                            )}>
                                <span className="text-[10px] font-black text-white/60">[ 10% Group ]</span>
                                <p className="text-[10px] text-white/40 mt-1 italic">Established discipline, clear strategic goals.</p>
                            </div>

                            <div className={cn(
                                "p-4 border rounded-xl transition-all duration-500",
                                legacyPulse > 80 ? "bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-white/[0.02] border-white/5 opacity-40"
                            )}>
                                <span className="text-[10px] font-black text-white/60">[ 1% Group ]</span>
                                <p className="text-[10px] text-white/40 mt-1 italic">Ultra-Elite: Macro-alignment, absolute clarity.</p>
                            </div>
                        </div>

                        {/* Status Tags */}
                        <div className="grid grid-cols-2 gap-2 mt-6">
                            <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex flex-col gap-1">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Focus Level</span>
                                <div className="flex items-center gap-1.5">
                                    <Brain size={10} className={peerGroup.color} />
                                    <span className={cn("text-[10px] font-black", peerGroup.color)}>{peerGroup.status}</span>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex flex-col gap-1">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Discipline</span>
                                <div className="flex items-center gap-1.5">
                                    <Flame size={10} className={peerGroup.color} />
                                    <span className={cn("text-[10px] font-black", peerGroup.color)}>{legacyPulse > 50 ? 'STABLE' : 'INITIAL'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Scanline effect */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
            </Card>

        </div>
    );
};

// Helper for conditional classes
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
