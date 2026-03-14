import React from 'react';
import { useAnalytics } from './hooks/use-analytics';
import { PerformanceDashboard } from './components/performance-dashboard';

export const StatisticsPage: React.FC = () => {
    const { 
        legacyPulse, 
        totalGoals,
        activeHabits,
    } = useAnalytics();

    return (
        <div className="flex flex-col h-[calc(100vh-48px)] overflow-hidden px-4 pt-4 md:px-8">
            {/* Header section mirroring Goals/Habits page style */}
            <div className="flex justify-between items-end mb-4 border-b border-white/5 pb-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40 leading-none text-left">Performance Insights</h2>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-12 bg-primary/40 rounded-full" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{legacyPulse}% OVERALL PROGRESS</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm">
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[9px] font-black text-white/20 uppercase">Goals</span>
                        <span className="text-sm font-black text-white">{totalGoals}</span>
                    </div>
                    <div className="w-[1px] h-6 bg-white/10" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[9px] font-black text-white/20 uppercase">Habits</span>
                        <span className="text-sm font-black text-white">{activeHabits}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full flex-1 flex flex-col min-h-0">
                <PerformanceDashboard />
            </div>
        </div>
    );
};
