import React from 'react';
import { Activity } from 'lucide-react';
import { useAnalytics } from '../hooks/use-analytics';
import { Card } from '@/components/ui/card';

// Helper for conditional classes
function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

export const PerformanceDashboard: React.FC = () => {
    const {
        goalYield = 0,
        habitResilience = 0,
        weeklyEfficiency = 0,
        legacyPulse = 0,
    } = useAnalytics();

    // Determine the Peer Class Grouping based on Overall Life Score
    const getPeerGroup = (score: number) => {
        if (score < 30) return { 
            label: '90% Group', 
            desc: 'Low Focus, Limited Effort. This is the baseline initial phase.', 
            status: 'LOW', 
            color: 'text-red-500',
            bgBorder: 'bg-red-500/10 border-red-500/20'
        };
        if (score <= 80) return { 
            label: '10% Group', 
            desc: 'Established Discipline, Clear Strategic Goals. You are building momentum.', 
            status: 'STABLE', 
            color: 'text-blue-400',
            bgBorder: 'bg-blue-500/10 border-blue-500/20'
        };
        return { 
            label: '1% Group', 
            desc: 'Ultra-Elite: Absolute Clarity & Macro-Alignment. Peak execution.', 
            status: 'ELITE', 
            color: 'text-emerald-400',
            bgBorder: 'bg-emerald-500/10 border-emerald-500/20'
        };
    };

    const peerGroup = getPeerGroup(legacyPulse);

    return (
        <div className="w-full h-full flex flex-col flex-1 animate-in fade-in duration-700 min-h-0">
            
            {/* MAIN HERO SECTION: Full-screen fit responsive */}
            <Card className="relative w-full flex-1 bg-[#0a0c10]/80 backdrop-blur-md border border-white/10 overflow-hidden p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 min-h-0">
                {/* Background high-tech effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,rgba(59,130,246,0.05),transparent_50%)]" />
                
                {/* Left Side: Score & Class Info */}
                <div className="relative z-10 flex-1 flex flex-col gap-4 w-full justify-center">
                    <div className="flex items-center gap-2">
                        <Activity size={16} className="text-primary animate-pulse" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Overall Life Score</h2>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-3">
                        <span className="text-6xl lg:text-8xl font-black text-white tracking-tighter filter drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            {legacyPulse}%
                        </span>
                        <div className={cn("px-4 py-1.5 border rounded-md shadow-lg animate-pulse", peerGroup.bgBorder)}>
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", peerGroup.color)}>
                                [ {peerGroup.label} ]
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest">Global Peer Class Trajectory</h3>
                        <p className="text-sm text-white/40 italic max-w-md leading-relaxed">
                            {peerGroup.desc}
                        </p>
                    </div>

                    {/* Weighting Breakdown */}
                    <div className="flex gap-8 border-t border-white/10 pt-4 mt-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest mb-0.5">Goals (60%)</span>
                            <span className="text-sm font-bold text-white/80">{goalYield}%</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-widest mb-0.5">Habits (30%)</span>
                            <span className="text-sm font-bold text-white/80">{habitResilience}%</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest mb-0.5">Execution (10%)</span>
                            <span className="text-sm font-bold text-white/80">{weeklyEfficiency}%</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Human Visual */}
                <div className="relative z-10 flex-1 flex items-center justify-center w-full min-h-[280px]">
                    {/* Header Logo Style Background Light (Static) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[180px] h-[180px] bg-primary/20 blur-[70px] rounded-full opacity-60" />
                        <div className="absolute w-[70px] h-[70px] bg-white/5 blur-[40px] rounded-full opacity-30" />
                    </div>
                    
                    <img 
                        src="/LOGO 11 Inches.gif" 
                        alt="Legacy visual"
                        className="relative z-10 h-[100px] lg:h-[200px] w-auto object-contain filter drop-shadow-[0_0_20px_rgba(59,130,246,0.15)] brightness-110"
                    />
                </div>
            </Card>
        </div>
    );
};
