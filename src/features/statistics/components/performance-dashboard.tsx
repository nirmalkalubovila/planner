import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, Target, Zap, AlertCircle, Moon, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

interface UserStatsCache {
    predictive_burnout_warning: string | null;
    consistency_grade: string;
    habit_heatmap: { date: string; count: number }[];
    top_goal: {
        name: string;
        progress: number;
        projected_completion: string;
    };
    bio_sync: {
        sleep_duration: number;
        completion_volume: number;
        correlationText: string;
    };
}

import { supabase } from '@/lib/supabaseClient';

// Authentic Data Fetching from DB
const fetchUserStatsCache = async (metadata: any): Promise<UserStatsCache> => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const today = new Date();
    const last30Days = Array.from({ length: 30 }).map((_, i) => {
        const d = new Date(today.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
    });

    // 1. Fetch Completed Tasks mapping
    const { data: completedTasks } = await supabase
        .from('completed_tasks')
        .select('dayStr, taskIds')
        .in('dayStr', last30Days)
        .eq('user_id', userId);

    const completedMap = (completedTasks || []).reduce((acc: any, curr: any) => {
        acc[curr.dayStr] = curr.taskIds?.length || 0;
        return acc;
    }, {});

    const habit_heatmap = last30Days.map(dateStr => ({
        date: dateStr,
        count: completedMap[dateStr] || 0
    }));

    const totalCompleted = habit_heatmap.reduce((sum, d) => sum + d.count, 0);
    const avgCompleted = last30Days.length ? Math.round((totalCompleted / last30Days.length) * 10) / 10 : 0;

    // 2. Grading Heuristic
    let consistency_grade = 'F';
    const activeDaysCount = habit_heatmap.filter(d => d.count > 0).length;
    if (activeDaysCount > 25) consistency_grade = 'A+';
    else if (activeDaysCount > 20) consistency_grade = 'A';
    else if (activeDaysCount > 15) consistency_grade = 'B+';
    else if (activeDaysCount > 10) consistency_grade = 'B';
    else if (activeDaysCount > 5) consistency_grade = 'C';
    else if (activeDaysCount > 0) consistency_grade = 'D';

    // 3. Burnout Warning & Bio-Sync
    const sleepDuration = Number(metadata?.sleepDuration) || 7;
    let predictive_burnout_warning = null;
    if (sleepDuration < 6 && avgCompleted >= 5) {
        predictive_burnout_warning = "Pacing required. High output vs. low sleep detected.";
    }

    // 4. Goals Processing
    const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('createdAt', { ascending: false });

    let top_goal = { name: 'No active goals', progress: 0, projected_completion: '-' };
    if (goalsData && goalsData.length > 0) {
        const goal = goalsData.find(g => g.milestones && g.milestones.length > 0) || goalsData[0];
        let progress = 0;
        if (goal.milestones?.length > 0) {
            const finishedList = goal.milestones.filter((m: any) => m.completed).length;
            progress = Math.round((finishedList / goal.milestones.length) * 100);
        }
        top_goal = {
            name: goal.name,
            progress,
            projected_completion: goal.endDate ? new Date(goal.endDate).toLocaleDateString() : 'TBD'
        };
    }

    return {
        predictive_burnout_warning,
        consistency_grade,
        habit_heatmap,
        top_goal,
        bio_sync: {
            sleep_duration: sleepDuration,
            completion_volume: avgCompleted,
            correlationText: (sleepDuration >= 7 && avgCompleted > 2) 
                ? 'Healthy sleep positively correlates with your task execution rate.'
                : 'Warning: Sleep debt may naturally reduce optimal daily execution.',
        },
    };
};

const BentoCard: React.FC<{
    className?: string;
    children: React.ReactNode;
    delay?: number;
}> = ({ className, children, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
                "relative flex flex-col overflow-hidden bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md",
                className
            )}
        >
            {/* Subtle glow effect behind cards */}
            <div className="absolute -z-10 bg-primary/5 w-full h-full inset-0 blur-3xl opacity-50 pointer-events-none" />
            {children}
        </motion.div>
    );
};

export const PerformanceDashboard: React.FC = () => {
    const { user } = useAuth();
    
    // Fallbacks for profile metadata
    const energyPeakTime = user?.user_metadata?.energyPeakTime || 'Morning';
    const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Voyager';

    const { data: stats, isLoading } = useQuery({
        queryKey: ['user_stats_cache'],
        queryFn: () => fetchUserStatsCache(user?.user_metadata),
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading || !stats) {
        return (
            <div className="flex flex-col w-full h-full items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-white/40 text-sm">Synthesizing insights...</p>
            </div>
        );
    }

    const { consistency_grade, habit_heatmap, top_goal, bio_sync, predictive_burnout_warning } = stats;

    // Heatmap color logic
    const getHeatmapColor = (count: number) => {
        if (count === 0) return 'bg-white/5';
        if (count === 1) return 'bg-primary/20';
        if (count === 2) return 'bg-primary/40';
        if (count === 3) return 'bg-primary/60';
        return 'bg-primary/90';
    };

    return (
        <div className="flex flex-col w-full max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header Section */}
            <header className="flex flex-col space-y-2">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl md:text-4xl font-black tracking-tight text-white"
                >
                    Good {energyPeakTime.toLowerCase() === 'evening' ? 'evening' : 'day'}, {userName}.
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-white/60 flex items-center gap-2 text-sm md:text-base font-medium max-w-xl"
                >
                    {predictive_burnout_warning ? (
                        <span className="flex items-center gap-2 text-rose-400">
                            <AlertCircle size={16} />
                            {predictive_burnout_warning}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Activity size={16} className="text-primary" />
                            Your systems are optimized for {energyPeakTime.toLowerCase()} execution.
                        </span>
                    )}
                </motion.p>
            </header>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-min">
                
                {/* Main Bento Box 1: Legacy Pulse */}
                <BentoCard className="md:col-span-1 min-h-[220px] justify-between" delay={0.2}>
                    <div className="flex items-center space-x-2 text-white/50 mb-4">
                        <Zap size={16} className="text-primary" />
                        <h2 className="text-xs uppercase tracking-widest font-bold">Legacy Pulse</h2>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center flex-1">
                        <div className="relative">
                            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] select-none">
                                {consistency_grade}
                            </span>
                            {/* Glowing aura for the grade */}
                            <div className="absolute inset-0 bg-primary opacity-20 blur-[40px] -z-10 rounded-full" />
                        </div>
                        <p className="mt-4 text-sm text-white/40 font-medium">Consistency Grade</p>
                    </div>
                </BentoCard>

                {/* Main Bento Box 2: Habit Heatmap */}
                <BentoCard className="md:col-span-2 min-h-[220px] justify-between" delay={0.3}>
                    <div className="flex items-center space-x-2 text-white/50 mb-6">
                        <BarChart3 size={16} />
                        <h2 className="text-xs uppercase tracking-widest font-bold">30-Day Heatmap</h2>
                    </div>

                    <div className="flex flex-col h-full justify-center space-y-6">
                        <div className="flex gap-2 flex-wrap items-center justify-start md:justify-center">
                            {habit_heatmap.map((day, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "w-5 h-5 md:w-6 md:h-6 rounded-md transition-colors duration-300 hover:scale-110 cursor-pointer",
                                        getHeatmapColor(day.count)
                                    )}
                                    title={`${new Date(day.date).toLocaleDateString()}: ${day.count} tasks`}
                                />
                            ))}
                        </div>
                        <div className="flex justify-end items-center gap-2 text-xs text-white/30 font-medium font-mono select-none">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <span className="w-3 h-3 rounded-sm bg-white/5" />
                                <span className="w-3 h-3 rounded-sm bg-primary/20" />
                                <span className="w-3 h-3 rounded-sm bg-primary/40" />
                                <span className="w-3 h-3 rounded-sm bg-primary/60" />
                                <span className="w-3 h-3 rounded-sm bg-primary/90" />
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                </BentoCard>

                {/* Row 2 Bento 1: Goal Velocity */}
                <BentoCard className="md:col-span-2 min-h-[200px]" delay={0.4}>
                    <div className="flex items-center space-x-2 text-white/50 mb-6">
                        <Target size={16} />
                        <h2 className="text-xs uppercase tracking-widest font-bold">Goal Velocity</h2>
                    </div>

                    <div className="flex flex-col space-y-5">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">{top_goal.name}</h3>
                                <p className="text-sm text-primary flex items-center gap-1.5">
                                    <TrendingUp size={14} />
                                    Projected completion: {top_goal.projected_completion}
                                </p>
                            </div>
                            <span className="text-2xl font-black text-white/80">{top_goal.progress}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${top_goal.progress}%` }}
                                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                            />
                        </div>
                    </div>
                </BentoCard>

                {/* Row 2 Bento 2: Bio-Sync */}
                <BentoCard className="md:col-span-1 min-h-[200px]" delay={0.5}>
                    <div className="flex items-center space-x-2 text-white/50 mb-6">
                        <Moon size={16} />
                        <h2 className="text-xs uppercase tracking-widest font-bold">Bio-Sync</h2>
                    </div>

                    <div className="flex flex-col space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-white">{bio_sync.sleep_duration}h</span>
                                <span className="text-xs text-white/40 uppercase tracking-wider font-bold">Avg Sleep</span>
                            </div>
                            <div className="flex flex-col border-l border-white/5 pl-4">
                                <span className="text-2xl font-bold text-white">{bio_sync.completion_volume}</span>
                                <span className="text-xs text-white/40 uppercase tracking-wider font-bold">Avg Tasks</span>
                            </div>
                        </div>

                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <p className="text-xs text-white/60 leading-relaxed font-medium">
                                {bio_sync.correlationText}
                            </p>
                        </div>
                    </div>
                </BentoCard>
            </div>
        </div>
    );
};
