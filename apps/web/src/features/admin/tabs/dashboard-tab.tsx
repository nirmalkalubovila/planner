import React from 'react';
import { Users, CheckCircle2, UserPlus, Zap, Calendar, Target, Activity, Sparkles, AlertTriangle, Percent } from 'lucide-react';
import { useAdminStats } from '@/api/services/feedback-service';
import { StatCard } from '../components/stat-card';

export const DashboardTab: React.FC = () => {
    const stats = useAdminStats();

    if (stats.isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-card/60 border border-border rounded-2xl p-5 h-28 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard label="Total Users" value={stats.totalUsers} icon={<Users className="h-4.5 w-4.5 text-blue-400" />} accent="bg-blue-500/10" />
                <StatCard label="Active Users (7d)" value={stats.activeUsers7d} icon={<Activity className="h-4.5 w-4.5 text-emerald-400" />} accent="bg-emerald-500/10" />
                <StatCard label="Engagement Rate" value={`${stats.engagementRate}%`} icon={<Percent className="h-4.5 w-4.5 text-violet-400" />} accent="bg-violet-500/10" />
                <StatCard label="Most Used Feature" value={stats.mostUsedFeature} icon={<Sparkles className="h-4.5 w-4.5 text-amber-400" />} accent="bg-amber-500/10" />
                <StatCard label="New This Week" value={stats.recentUsers} icon={<UserPlus className="h-4.5 w-4.5 text-sky-400" />} accent="bg-sky-500/10" />
                <StatCard label="Open Issues" value={stats.openCount} icon={<AlertTriangle className="h-4.5 w-4.5 text-orange-400" />} accent="bg-orange-500/10" />
            </div>

            {/* Growth Target Tracker */}
            <div className="bg-card/60 border border-border rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Road to 50 Active Users</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Target: 50 active weekly users. We need {stats.remaining} more active users.</p>
                    </div>
                    {stats.weeksToTarget !== null && (
                        <div className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                            Estimated: {stats.weeksToTarget} {stats.weeksToTarget === 1 ? 'week' : 'weeks'} to target
                        </div>
                    )}
                </div>
                
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-foreground">{stats.activeUsers7d} / {stats.growthTarget} ({Math.round(Math.min(100, (stats.activeUsers7d / stats.growthTarget) * 100))}%)</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                        <div 
                            className="bg-primary h-full transition-all duration-500 rounded-full" 
                            style={{ width: `${Math.min(100, (stats.activeUsers7d / stats.growthTarget) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Business adoption and engagement grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature Adoption Card */}
                <div className="bg-card/60 border border-border rounded-2xl p-5 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Feature Adoption Rates</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Adoption rates across major feature categories.</p>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Goals */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-blue-400" /> Goals Feature</span>
                                <span>{stats.featureAdoption?.goals.pct}% ({stats.featureAdoption?.goals.count} users)</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${stats.featureAdoption?.goals.pct}%` }} />
                            </div>
                        </div>

                        {/* Habits */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-400" /> Habits Feature</span>
                                <span>{stats.featureAdoption?.habits.pct}% ({stats.featureAdoption?.habits.count} users)</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats.featureAdoption?.habits.pct}%` }} />
                            </div>
                        </div>

                        {/* Planner */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-violet-400" /> Weekly Planner</span>
                                <span>{stats.featureAdoption?.planner.pct}% ({stats.featureAdoption?.planner.count} users)</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="bg-violet-500 h-full rounded-full" style={{ width: `${stats.featureAdoption?.planner.pct}%` }} />
                            </div>
                        </div>

                        {/* Task Completions */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Execution Tracking</span>
                                <span>{stats.featureAdoption?.completions.pct}% ({stats.featureAdoption?.completions.count} users)</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.featureAdoption?.completions.pct}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border pt-3 grid grid-cols-3 gap-2 text-center">
                        <div>
                            <div className="text-base font-bold">{stats.avgGoals}</div>
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Goals / User</div>
                        </div>
                        <div>
                            <div className="text-base font-bold">{stats.avgHabits}</div>
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Habits / User</div>
                        </div>
                        <div>
                            <div className="text-base font-bold">{stats.avgPlans}</div>
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Plans / User</div>
                        </div>
                    </div>
                </div>

                {/* Engagement Funnel Card */}
                <div className="bg-card/60 border border-border rounded-2xl p-5 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">User Engagement Funnel</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Drop-off sequence from sign up to weekly active status.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                        {/* Funnel Step 1 */}
                        <div className="relative flex items-center justify-between p-2.5 bg-muted/20 border border-border/30 rounded-xl">
                            <span className="text-xs font-bold text-foreground pl-2">1. Signed Up</span>
                            <span className="text-xs font-black pr-2">{stats.funnel?.signedUp} Users (100%)</span>
                        </div>

                        {/* Funnel Step 2 */}
                        <div className="relative flex items-center justify-between p-2.5 bg-muted/20 border border-border/30 rounded-xl overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-primary/5 transition-all duration-300" style={{ width: `${stats.totalUsers > 0 ? ((stats.funnel?.personalized ?? 0) / stats.totalUsers) * 100 : 0}%` }} />
                            <span className="text-xs font-bold text-foreground pl-2 z-10">2. Personalized Profile</span>
                            <span className="text-xs font-black pr-2 z-10">
                                {stats.funnel?.personalized} ({stats.totalUsers > 0 ? Math.round(((stats.funnel?.personalized ?? 0) / stats.totalUsers) * 100) : 0}%)
                            </span>
                        </div>

                        {/* Funnel Step 3 */}
                        <div className="relative flex items-center justify-between p-2.5 bg-muted/20 border border-border/30 rounded-xl overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-300" style={{ width: `${stats.totalUsers > 0 ? ((stats.funnel?.createdGoal ?? 0) / stats.totalUsers) * 100 : 0}%` }} />
                            <span className="text-xs font-bold text-foreground pl-2 z-10">3. Created At Least 1 Goal</span>
                            <span className="text-xs font-black pr-2 z-10">
                                {stats.funnel?.createdGoal} ({stats.totalUsers > 0 ? Math.round(((stats.funnel?.createdGoal ?? 0) / stats.totalUsers) * 100) : 0}%)
                            </span>
                        </div>

                        {/* Funnel Step 4 */}
                        <div className="relative flex items-center justify-between p-2.5 bg-muted/20 border border-border/30 rounded-xl overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-primary/15 transition-all duration-300" style={{ width: `${stats.totalUsers > 0 ? ((stats.funnel?.active7d ?? 0) / stats.totalUsers) * 100 : 0}%` }} />
                            <span className="text-xs font-bold text-foreground pl-2 z-10">4. Active Weekly (7d)</span>
                            <span className="text-xs font-black pr-2 z-10">
                                {stats.funnel?.active7d} ({stats.totalUsers > 0 ? Math.round(((stats.funnel?.active7d ?? 0) / stats.totalUsers) * 100) : 0}%)
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Engagement Tiers */}
            <div className="bg-card/60 border border-border rounded-2xl p-5 space-y-4">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">User Engagement Tiers</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Distribution of user cohort based on action patterns.</p>
                </div>

                <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                    {stats.tiers?.power > 0 && (
                        <div className="bg-emerald-500" style={{ width: `${((stats.tiers?.power ?? 0) / stats.totalUsers) * 100}%` }} title="Power Users" />
                    )}
                    {stats.tiers?.active > 0 && (
                        <div className="bg-blue-500" style={{ width: `${((stats.tiers?.active ?? 0) / stats.totalUsers) * 100}%` }} title="Active Users" />
                    )}
                    {stats.tiers?.casual > 0 && (
                        <div className="bg-amber-500" style={{ width: `${((stats.tiers?.casual ?? 0) / stats.totalUsers) * 100}%` }} title="Casual Users" />
                    )}
                    {stats.tiers?.dormant > 0 && (
                        <div className="bg-red-500" style={{ width: `${((stats.tiers?.dormant ?? 0) / stats.totalUsers) * 100}%` }} title="Dormant Users" />
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-500" />
                        <div>
                            <div className="text-xs font-bold text-foreground">Power Users</div>
                            <div className="text-[10px] text-muted-foreground font-semibold">{stats.tiers?.power} users ({stats.totalUsers > 0 ? Math.round(((stats.tiers?.power ?? 0) / stats.totalUsers) * 100) : 0}%)</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-blue-500" />
                        <div>
                            <div className="text-xs font-bold text-foreground">Active</div>
                            <div className="text-[10px] text-muted-foreground font-semibold">{stats.tiers?.active} users ({stats.totalUsers > 0 ? Math.round(((stats.tiers?.active ?? 0) / stats.totalUsers) * 100) : 0}%)</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-amber-500" />
                        <div>
                            <div className="text-xs font-bold text-foreground">Casual</div>
                            <div className="text-[10px] text-muted-foreground font-semibold">{stats.tiers?.casual} users ({stats.totalUsers > 0 ? Math.round(((stats.tiers?.casual ?? 0) / stats.totalUsers) * 100) : 0}%)</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500" />
                        <div>
                            <div className="text-xs font-bold text-foreground">Dormant</div>
                            <div className="text-[10px] text-muted-foreground font-semibold">{stats.tiers?.dormant} users ({stats.totalUsers > 0 ? Math.round(((stats.tiers?.dormant ?? 0) / stats.totalUsers) * 100) : 0}%)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

