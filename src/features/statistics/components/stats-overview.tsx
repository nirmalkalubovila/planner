import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Target, Zap, Waves } from 'lucide-react';

interface StatsOverviewProps {
    legacyPulse: number;
    goalYield: number;
    habitResilience: number;
    weeklyEfficiency: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
    legacyPulse,
    goalYield,
    habitResilience,
    weeklyEfficiency
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Legend Pulse Hero Card */}
            <Card className="col-span-1 lg:col-span-2 bg-primary/10 border-primary/20 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-all duration-700" />
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                        <Activity size={12} className="animate-pulse" />
                        Overall Life Score
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex items-center justify-between gap-8">
                    <div className="flex-1">
                        <div className="text-6xl font-black text-white tracking-tighter tabular-nums flex items-baseline gap-1">
                            {legacyPulse}<span className="text-xl text-primary/50 font-bold">%</span>
                        </div>
                        <p className="text-xs text-muted-foreground/60 mt-2 font-medium leading-relaxed max-w-[200px]">
                            Your combined progress across goals, daily habits, and active execution.
                        </p>
                    </div>
                    
                    <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="56"
                                cy="56"
                                r="50"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-primary/5"
                            />
                            <circle
                                cx="56"
                                cy="56"
                                r="50"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray={Math.PI * 100}
                                strokeDashoffset={Math.PI * 100 * (1 - legacyPulse / 100)}
                                strokeLinecap="round"
                                className="text-primary transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                                style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary)))' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap size={24} className="text-primary animate-pulse" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tactical Efficiency Card */}
            <Card className="border-border/40 hover:border-amber-500/30 transition-all duration-300 group">
                <CardHeader className="pb-0">
                    <CardTitle className="text-[9px] font-black uppercase tracking-widest text-amber-500/60 flex items-center gap-2">
                        <Activity size={11} />
                        Execution Score
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{weeklyEfficiency}%</div>
                    <div className="w-full h-1 bg-amber-500/10 rounded-full mt-3 overflow-hidden">
                        <div 
                            className="h-full bg-amber-500 transition-all duration-1000" 
                            style={{ width: `${weeklyEfficiency}%` }} 
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground/40 mt-3 font-bold uppercase tracking-widest">Daily Task Completion</p>
                </CardContent>
            </Card>

            {/* Strategic Yield Card */}
            <Card className="border-border/40 hover:border-emerald-500/30 transition-all duration-300 group">
                <CardHeader className="pb-0">
                    <CardTitle className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60 flex items-center gap-2">
                        <Target size={11} />
                        Goal Progress
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{goalYield}%</div>
                    <div className="w-full h-1 bg-emerald-500/10 rounded-full mt-3 overflow-hidden">
                        <div 
                            className="h-full bg-emerald-500 transition-all duration-1000" 
                            style={{ width: `${goalYield}%` }} 
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground/40 mt-3 font-bold uppercase tracking-widest">Milestone Achievement</p>
                </CardContent>
            </Card>

            {/* Habit Resilience Card */}
            <Card className="border-border/40 hover:border-blue-500/30 transition-all duration-300 group">
                <CardHeader className="pb-0">
                    <CardTitle className="text-[9px] font-black uppercase tracking-widest text-blue-500/60 flex items-center gap-2">
                        <Waves size={11} />
                        Habit Consistency
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{habitResilience}%</div>
                    <div className="w-full h-1 bg-blue-500/10 rounded-full mt-3 overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-1000" 
                            style={{ width: `${habitResilience}%` }} 
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground/40 mt-3 font-bold uppercase tracking-widest">Daily Pattern Strength</p>
                </CardContent>
            </Card>
        </div>
    );
};
