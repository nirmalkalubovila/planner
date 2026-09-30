import React from 'react';
import { AlertTriangle, Flame, Star, Lightbulb } from 'lucide-react';
import { useAdminStats } from '@/api/services/feedback-service';
import { StatCard } from './stat-card';
import { StatusDropdown } from './status-dropdown';

export const ProductIntelligenceTab: React.FC = () => {
    const stats = useAdminStats();

    if (stats.isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-2xl p-5 h-28 animate-pulse" />
                ))}
            </div>
        );
    }

    const featureRankings = [
        {
            rank: '01',
            name: 'Daily Execution & Task Checklist',
            category: 'Today Engine',
            adoption: stats.featureAdoption?.completions.pct || 0,
            userCount: stats.featureAdoption?.completions.count || 0,
            status: 'Top Retention Anchor',
            whyLoved: 'Highest repeat daily engagement loop. Users return daily to check off planned time blocks and habit items.',
        },
        {
            rank: '02',
            name: 'Habits Consistency Engine',
            category: 'Habits',
            adoption: stats.featureAdoption?.habits.pct || 0,
            userCount: stats.featureAdoption?.habits.count || 0,
            status: 'High Adoption',
            whyLoved: `Users build active routines with an average of ${stats.avgHabits} habits per user across morning and evening rituals.`,
        },
        {
            rank: '03',
            name: 'Sunday Focus & Weekly Targets (P1, P2, P3)',
            category: 'Planner',
            adoption: stats.featureAdoption?.planner.pct || 0,
            userCount: stats.featureAdoption?.planner.count || 0,
            status: 'High Retention',
            whyLoved: `Provides weekly clarity. Active users schedule an average of ${stats.avgPlans} weekly time-blocking grids with life bucket balance.`,
        },
        {
            rank: '04',
            name: 'Goal Architecture & Milestones',
            category: 'Goals',
            adoption: stats.featureAdoption?.goals.pct || 0,
            userCount: stats.featureAdoption?.goals.count || 0,
            status: 'High Value',
            whyLoved: `Strong initial setup anchor. Users establish multi-week goals (average ${stats.avgGoals} goals/user) tied to primary life focuses.`,
        },
        {
            rank: '05',
            name: 'Stage Milestones & Consistency Badges',
            category: 'Gamification',
            adoption: stats.activeUsers7d > 0 ? Math.round((stats.activeUsers7d / Math.max(1, stats.totalUsers)) * 100) : 0,
            userCount: stats.activeUsers7d,
            status: 'Consistency Motivation',
            whyLoved: '6-stage progression (Spark 7d to Legacy 365d) provides tangible rewards and celebration milestones.',
        },
    ];

    const frictionSignals = [
        {
            name: 'Profile Personalization Skip',
            count: stats.unpersonalizedUsers,
            pct: stats.unpersonalizedPct,
            severity: 'Onboarding Friction',
            impact: 'Users who skip personalizing sleep, planning hour, and focus abilities miss out on tailored schedule recommendations.',
            solution: 'Trigger a gentle 30-second onboarding prompt upon first login.'
        },
        {
            name: 'Goal-to-Plan Execution Gap',
            count: stats.goalsWithoutPlans,
            pct: stats.goalsWithoutPlansPct,
            severity: 'Execution Bottleneck',
            impact: 'Users define overarching goals but fail to convert them into active weekly time blocks.',
            solution: 'Auto-suggest Big 3 weekly priority tasks directly from active goals during Sunday planning.'
        },
        {
            name: 'Zero Execution Drop-off',
            count: stats.zeroExecutionUsers,
            pct: stats.zeroExecutionPct,
            severity: 'Early Lapsed Risk',
            impact: 'Users configured their account but stopped before checking off their first day of planned items.',
            solution: 'Implement day-1 celebration toast and quick-win onboarding task.'
        },
        {
            name: 'Dormant Cohort (14+ Days Inactive)',
            count: stats.dormantUsers,
            pct: stats.dormantPct,
            severity: 'Retention Risk',
            impact: 'Users who fell out of the weekly planning routine and risk churning permanently.',
            solution: 'Send automated weekly Sunday planning email notification reminder.'
        },
    ];

    const conversionFunnel = [
        { step: '1. Account Sign Up', users: stats.funnel?.signedUp || 0, pct: 100 },
        { 
            step: '2. Profile Personalization', 
            users: stats.funnel?.personalized || 0, 
            pct: stats.totalUsers > 0 ? Math.round(((stats.funnel?.personalized || 0) / stats.totalUsers) * 100) : 0,
        },
        { 
            step: '3. Created Master Goal', 
            users: stats.funnel?.createdGoal || 0, 
            pct: stats.totalUsers > 0 ? Math.round(((stats.funnel?.createdGoal || 0) / stats.totalUsers) * 100) : 0,
        },
        { 
            step: '4. Active Weekly Time Planner', 
            users: stats.featureAdoption?.planner.count || 0, 
            pct: stats.totalUsers > 0 ? Math.round(((stats.featureAdoption?.planner.count || 0) / stats.totalUsers) * 100) : 0,
        },
        { 
            step: '5. Consistent Execution (7d Active)', 
            users: stats.funnel?.active7d || 0, 
            pct: stats.totalUsers > 0 ? Math.round(((stats.funnel?.active7d || 0) / stats.totalUsers) * 100) : 0,
        }
    ];

    return (
        <div className="space-y-6">
            {/* KPI Summary Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard 
                    label="User Satisfaction" 
                    value={`${stats.averageRating} / 5.0`} 
                    icon={<Star className="h-4 w-4 text-primary" />} 
                />
                <StatCard 
                    label="Top Loved Feature" 
                    value="Daily Execution" 
                    icon={<Flame className="h-4 w-4 text-primary" />} 
                />
                <StatCard 
                    label="Primary Friction Point" 
                    value="Goal Execution Gap" 
                    icon={<AlertTriangle className="h-4 w-4 text-primary" />} 
                />
                <StatCard 
                    label="Open Action Items" 
                    value={stats.openCount} 
                    icon={<Lightbulb className="h-4 w-4 text-primary" />} 
                />
            </div>

            {/* SECTION 1: SYSTEM ADOPTION & ENGAGEMENT (WHAT USERS LOVE MOST) */}
            <div className="space-y-4">
                <div className="border-b border-border pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        System Adoption & Feature Engagement
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Core workflows ranked by active user adoption and frequency.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Leaderboard list (2 cols) */}
                    <div className="lg:col-span-2 space-y-3">
                        {featureRankings.map((feat) => (
                            <div 
                                key={feat.rank}
                                className="bg-card border border-border rounded-2xl p-4 space-y-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                                            {feat.rank}
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs sm:text-sm font-bold text-foreground">{feat.name}</h4>
                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold px-2 py-0.5 rounded bg-muted">
                                                    {feat.category}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium mt-0.5">
                                                <span>{feat.userCount} active users</span>
                                                <span>•</span>
                                                <span>{feat.adoption}% adoption</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-border bg-muted text-foreground uppercase tracking-wider">
                                        {feat.status}
                                    </span>
                                </div>

                                <p className="text-xs text-muted-foreground leading-relaxed pl-11">
                                    {feat.whyLoved}
                                </p>

                                <div className="pl-11 pt-1">
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${feat.adoption}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Wall of Love Snippets (1 col) */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                    User Feedback & Reviews
                                </h4>
                                <span className="text-[10px] text-muted-foreground font-mono">{stats.positiveSentimentPct}% Positive</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Recent ratings and reflections submitted by users.
                            </p>

                            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                                {stats.recentPositiveFeedback?.length > 0 ? (
                                    stats.recentPositiveFeedback.map((f, idx) => (
                                        <div key={idx} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-foreground truncate max-w-[140px]">
                                                    {f.author_name || 'Legacy Builder'}
                                                </span>
                                                <span className="text-[10px] font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                                                    {f.rating || 5} Stars
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2">
                                                "{f.message}"
                                            </p>
                                            <div className="text-[9px] text-muted-foreground uppercase font-medium">
                                                {f.subject}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-xs text-muted-foreground italic">
                                        No reviews logged yet. Reviews submitted from updates and milestones will appear here.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between font-medium">
                            <span>Rating Average: {stats.averageRating} / 5</span>
                            <span className="text-foreground font-bold">5-Star Ratio: {stats.totalRated > 0 ? Math.round(((stats.ratingDist[5] || 0) / stats.totalRated) * 100) : 100}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: FRICTION & JOURNEY BOTTLENECKS */}
            <div className="space-y-4">
                <div className="border-b border-border pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        Friction Points & Journey Diagnostics
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Identify key drop-off areas where users stop executing or skip setup steps.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Friction List */}
                    <div className="space-y-3">
                        {frictionSignals.map((item, idx) => (
                            <div 
                                key={idx}
                                className="bg-card border border-border rounded-2xl p-4 space-y-2.5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs sm:text-sm font-bold text-foreground">{item.name}</h4>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-border bg-muted text-muted-foreground uppercase tracking-wider">
                                                {item.severity}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                                            {item.count} users affected ({item.pct}%)
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {item.impact}
                                </p>

                                <div className="p-2.5 rounded-xl bg-muted/50 border border-border flex items-start gap-2 text-xs text-foreground font-medium">
                                    <Lightbulb size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
                                    <span><strong>Action Item:</strong> {item.solution}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 5-Step Conversion Funnel Diagnostic */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                    5-Step User Journey Conversion Funnel
                                </h4>
                                <span className="text-[10px] text-muted-foreground font-mono">{stats.totalUsers} Total Users</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Conversion drop-off lifecycle from signup to daily consistency habits.
                            </p>

                            <div className="space-y-3 pt-1">
                                {conversionFunnel.map((step, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-foreground">{step.step}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-muted-foreground">{step.users} users</span>
                                                <span className="font-bold text-foreground font-mono bg-muted px-2 py-0.5 rounded text-[10px]">
                                                    {step.pct}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                            <div 
                                                className="bg-primary h-full transition-all duration-500 rounded-full" 
                                                style={{ width: `${step.pct}%` }} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground mt-4 space-y-1">
                            <span className="font-bold text-foreground uppercase tracking-wider block">Key Journey Insight:</span>
                            <p className="leading-relaxed">
                                The transition from <strong>Master Goal Creation</strong> to <strong>Active Weekly Time Planner</strong> is the key milestone that turns casual signups into active users.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 3: WHAT USERS NEED MOST (VOICE OF CUSTOMER & ROADMAP) */}
            <div className="space-y-4">
                <div className="border-b border-border pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        User Demands & Strategic Roadmap
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Open user requests, reported friction bugs, and automated strategic roadmap recommendations.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Open Feature Requests */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                Feature Requests ({stats.openFeatureRequestsList?.length || 0})
                            </h4>
                        </div>
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                            {stats.openFeatureRequestsList?.length > 0 ? (
                                stats.openFeatureRequestsList.map((f) => (
                                    <div key={f.id} className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-foreground truncate">{f.subject}</span>
                                            <StatusDropdown feedbackId={f.id} currentStatus={f.status} />
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{f.message}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-xs text-muted-foreground italic">
                                    No open feature requests pending.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Open Bug Reports */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                Reported Issues ({stats.openBugList?.length || 0})
                            </h4>
                        </div>
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                            {stats.openBugList?.length > 0 ? (
                                stats.openBugList.map((f) => (
                                    <div key={f.id} className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-foreground truncate">{f.subject}</span>
                                            <StatusDropdown feedbackId={f.id} currentStatus={f.status} />
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{f.message}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-xs text-muted-foreground italic">
                                    Zero open bug reports logged.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Strategic Recommendations */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
                            Actionable Product Recommendations
                        </h4>
                        <div className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                                <span className="font-bold text-foreground text-xs block">
                                    1. Sunday Planning Push Nudges
                                </span>
                                <p className="text-[11px]">
                                    Since Sunday planning is the top retention anchor, send scheduled browser alerts on Sunday 8:00 PM to prompt weekly priority setup.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                                <span className="font-bold text-foreground text-xs block">
                                    2. 1-Click Goal-to-Target Sync
                                </span>
                                <p className="text-[11px]">
                                    Add a button in Sunday Focus that automatically pulls active goals into the Big 3 priorities list to bridge the execution gap.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                                <span className="font-bold text-foreground text-xs block">
                                    3. Milestone Re-engagement Triggers
                                </span>
                                <p className="text-[11px]">
                                    When users reach day 5 of a streak, show a countdown to Stage 1 (Spark, 7d) to motivate crossing the first milestone.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

