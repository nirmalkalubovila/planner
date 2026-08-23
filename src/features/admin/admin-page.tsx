import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, MessageSquare, Users, ArrowLeft,
    Clock, CheckCircle2, Eye, EyeOff, UserPlus,
    ChevronDown, Search, Mail, Settings, FileText, Check, Save, Info, Loader2, KeyRound,
    Zap, Calendar, Target, Activity, Sparkles, AlertTriangle, Percent, Trash2,
    Flame, Star, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AppUpdateService, type AppUpdate } from '@/api/services/update-service';
import { 
    useAdminFeedbacks, useAdminStats, useAdminUpdateFeedbackStatus,
    useLandingSettings, useUpdateLandingSettings, useAdminUpdateFeedback,
    useAdminUsersActivity, getUserEngagementTier, TIER_META, type EngagementTier
} from '@/api/services/feedback-service';
import { STATUS_COLORS, FEEDBACK_STATUSES, type FeedbackStatus } from './admin-constants';
import { AdminGuard } from './admin-guard';
import {
    useGlobalSmtpSettings,
    useGlobalEmailTemplates
} from '@/api/services/admin-smtp-service';

type Tab = 'dashboard' | 'intelligence' | 'feedbacks' | 'users' | 'mails' | 'landing' | 'updates';

const TAB_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'intelligence', label: 'Needs & Sentiment', icon: <Flame className="h-4 w-4" /> },
    { key: 'feedbacks', label: 'Feedbacks', icon: <MessageSquare className="h-4 w-4" /> },
    { key: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
    { key: 'mails', label: 'Mails', icon: <Mail className="h-4 w-4" /> },
    { key: 'landing', label: 'Landing Config', icon: <Settings className="h-4 w-4" /> },
    { key: 'updates', label: 'App Updates', icon: <Sparkles className="h-4 w-4" /> },
];

// ── Stat Card ────────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; accent?: string }> = ({ label, value, icon, accent }) => (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-5 flex flex-col gap-3 relative overflow-hidden group transition-all duration-300 hover:border-primary/20">
        <div className={`flex items-center justify-center h-9 w-9 rounded-xl ${accent ?? 'bg-primary/10'}`}>
            {icon}
        </div>
        <div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight">{value}</div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
        </div>
        <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-primary/[0.03] group-hover:bg-primary/[0.06] transition-colors" />
    </div>
);

// ── Dashboard Tab ────────────────────────────────────────────────────
const DashboardTab: React.FC = () => {
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

// ── Product Intelligence Tab (Needs, Love & Ignore Analysis) ──────────
const ProductIntelligenceTab: React.FC = () => {
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

// ── Status Dropdown ──────────────────────────────────────────────────
const StatusDropdown: React.FC<{ feedbackId: string; currentStatus: FeedbackStatus }> = ({ feedbackId, currentStatus }) => {
    const [open, setOpen] = useState(false);
    const updateStatus = useAdminUpdateFeedbackStatus();

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${STATUS_COLORS[currentStatus]}`}
            >
                {currentStatus}
                <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-2xl p-1 min-w-[120px]">
                        {FEEDBACK_STATUSES.map((s) => (
                            <button
                                key={s}
                                onClick={() => {
                                    updateStatus.mutate({ id: feedbackId, status: s });
                                    setOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    s === currentStatus ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ── Feedbacks Tab ────────────────────────────────────────────────────
const FeedbacksTab: React.FC = () => {
    const { data: feedbacks, isLoading } = useAdminFeedbacks();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');
    const [filterCategory, setFilterCategory] = useState<'all' | 'Bug Report' | 'Feature Request' | 'About Legacy Life Builder' | 'Other'>('all');

    const filtered = (feedbacks ?? []).filter((f) => {
        const matchSearch = !search || 
            f.subject.toLowerCase().includes(search.toLowerCase()) || 
            f.message.toLowerCase().includes(search.toLowerCase()) ||
            (f.author_name && f.author_name.toLowerCase().includes(search.toLowerCase()));
        const matchStatus = filterStatus === 'all' || f.status === filterStatus;
        const matchCategory = filterCategory === 'all' || f.category === filterCategory;
        return matchSearch && matchStatus && matchCategory;
    });

    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card/60 border border-border rounded-2xl p-5 h-24 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search feedbacks by subject, content, or author..."
                        className="h-10 pl-9 rounded-xl bg-muted border-border"
                    />
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Category Filter pills */}
                    <div className="flex flex-wrap gap-1.5">
                        {(['all', 'Bug Report', 'Feature Request', 'About Legacy Life Builder', 'Other'] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                    filterCategory === cat
                                        ? 'bg-primary/15 text-primary border-primary/30'
                                        : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                                }`}
                            >
                                {cat === 'all' ? 'All Categories' : cat === 'About Legacy Life Builder' ? 'Reviews & Ratings' : cat}
                            </button>
                        ))}
                    </div>

                    {/* Status Filter pills */}
                    <div className="flex gap-1.5">
                        {(['all', ...FEEDBACK_STATUSES] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                    filterStatus === s
                                        ? 'bg-primary/15 text-primary border-primary/30'
                                        : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                                }`}
                            >
                                {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No feedbacks found</div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((f) => (
                        <div key={f.id} className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-5 space-y-3 transition-all duration-200 hover:border-primary/10">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{f.category}</span>
                                        {typeof f.rating === 'number' && f.rating > 0 && (
                                            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                {f.rating} / 5 Stars
                                            </span>
                                        )}
                                        {f.author_name && (
                                            <span className="text-[10px] font-medium text-foreground bg-muted/80 px-2 py-0.5 rounded-md">
                                                By: {f.author_name} {f.author_position ? `(${f.author_position})` : ''}
                                            </span>
                                        )}
                                        {f.consent_to_show ? (
                                            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                                Consent Given
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                                Private Only
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-bold truncate">{f.subject}</h4>
                                </div>
                                <StatusDropdown feedbackId={f.id} currentStatus={f.status} />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{f.message}</p>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                                <span>{new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span>•</span>
                                <span className="font-mono">{f.user_id.slice(0, 8)}...</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Users Tab ────────────────────────────────────────────────────────
const UsersTab: React.FC = () => {
    const { data: users, isLoading } = useAdminUsersActivity();
    const [search, setSearch] = useState('');
    const [filterTier, setFilterTier] = useState<'all' | EngagementTier | 'new'>('all');
    const [sortMode, setSortMode] = useState<'engaged' | 'attention'>('engaged');

    const getRelativeTime = (dateStr: string | null) => {
        if (!dateStr) return 'No activity yet';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        if (isNaN(diffMs)) return 'No activity yet';
        const diffMins = Math.floor(diffMs / (60 * 1000));
        const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card/60 border border-border rounded-2xl p-6 h-40 animate-pulse" />
                ))}
            </div>
        );
    }

    const now = new Date();
    const processedUsers = (users ?? []).map((u) => {
        const tier = getUserEngagementTier(u);
        const lastActive = u.last_active_at ? new Date(u.last_active_at) : null;
        const daysSinceActive = lastActive ? Math.floor((now.getTime() - lastActive.getTime()) / (24 * 60 * 60 * 1000)) : Infinity;
        const isNew = (now.getTime() - new Date(u.created_at).getTime()) <= 7 * 24 * 60 * 60 * 1000;
        
        // Compute engagement score (higher is more engaged)
        const engagementScore = (u.goals_count * 3) + (u.habits_count * 2) + (u.week_plans_count * 4) + (u.completed_days_count * 5);

        return {
            ...u,
            tier,
            daysSinceActive,
            isNew,
            engagementScore
        };
    });

    const filtered = processedUsers.filter((u) => {
        const matchSearch = !search ||
            (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) || 
            (u.email ?? '').toLowerCase().includes(search.toLowerCase()) || 
            u.user_id.toLowerCase().includes(search.toLowerCase());

        if (!matchSearch) return false;

        if (filterTier === 'all') return true;
        if (filterTier === 'new') return u.isNew;
        return u.tier === filterTier;
    });

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
        if (sortMode === 'attention') {
            // Dormant / needs attention first (most days since active, least engagement score)
            if (a.daysSinceActive !== b.daysSinceActive) {
                return b.daysSinceActive - a.daysSinceActive; // Larger days since active first
            }
            return a.engagementScore - b.engagementScore; // Lower score first
        } else {
            // Most engaged first
            if (a.tier !== b.tier) {
                const tierPriority = { power: 4, active: 3, casual: 2, dormant: 1 };
                return tierPriority[b.tier] - tierPriority[a.tier];
            }
            return b.engagementScore - a.engagementScore;
        }
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, or user ID..."
                        className="h-10 pl-9 rounded-xl bg-muted border-border"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setSortMode('engaged')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                            sortMode === 'engaged'
                                ? 'bg-primary text-primary-foreground border-transparent'
                                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                        }`}
                    >
                        Most Engaged
                    </button>
                    <button
                        onClick={() => setSortMode('attention')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                            sortMode === 'attention'
                                ? 'bg-destructive/15 text-destructive border-destructive/20'
                                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                        }`}
                    >
                        Needs Attention
                    </button>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
                {(['all', 'power', 'active', 'casual', 'dormant', 'new'] as const).map((t) => {
                    let label = t === 'all' ? 'All Users' : t === 'new' ? 'New (7d)' : TIER_META[t].label;
                    return (
                        <button
                            key={t}
                            onClick={() => setFilterTier(t)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                filterTier === t
                                    ? 'bg-primary/15 text-primary border-primary/30'
                                    : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                            }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            <div className="text-xs text-muted-foreground font-semibold px-1 flex justify-between items-center">
                <span>{sorted.length} user{sorted.length !== 1 ? 's' : ''} showing</span>
                {sortMode === 'attention' && <span className="text-destructive font-bold uppercase tracking-wider text-[9px]">Sorted by needs attention</span>}
            </div>

            {sorted.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sorted.map((u) => {
                        const meta = TIER_META[u.tier];
                        const needsGlow = u.tier === 'dormant' || u.daysSinceActive >= 14;

                        return (
                            <div 
                                key={u.user_id} 
                                className={`bg-card/60 backdrop-blur-sm border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:border-primary/10 relative overflow-hidden group ${
                                    needsGlow ? 'border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : 'border-border'
                                }`}
                            >
                                {/* Accent decoration */}
                                <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary/[0.01] group-hover:bg-primary/[0.03] transition-colors pointer-events-none" />

                                <div className="space-y-3">
                                    {/* Header / User Profile Info */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary font-black text-sm shrink-0 border border-primary/10">
                                                {(u.full_name ?? '?')[0]?.toUpperCase() ?? '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-black truncate">{u.full_name || 'Unnamed User'}</div>
                                                <div className="text-[11px] text-muted-foreground/80 truncate font-medium">{u.email}</div>
                                                <div className="text-[9px] text-muted-foreground/50 font-mono mt-0.5">{u.user_id}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.bgColor} ${meta.color} ${meta.borderColor}`}>
                                                {meta.label}
                                            </span>
                                            {u.is_personalized && (
                                                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">Personalized</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Activity Stats Grid */}
                                    <div className="grid grid-cols-4 gap-2 pt-1">
                                        <div className="bg-muted/30 border border-border/40 rounded-xl p-2 text-center flex flex-col items-center justify-center gap-0.5">
                                            <Target className="h-3.5 w-3.5 text-blue-400" />
                                            <span className="text-xs font-black text-foreground mt-0.5">{u.goals_count}</span>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Goals</span>
                                        </div>
                                        <div className="bg-muted/30 border border-border/40 rounded-xl p-2 text-center flex flex-col items-center justify-center gap-0.5">
                                            <Zap className="h-3.5 w-3.5 text-amber-400" />
                                            <span className="text-xs font-black text-foreground mt-0.5">{u.habits_count}</span>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Habits</span>
                                        </div>
                                        <div className="bg-muted/30 border border-border/40 rounded-xl p-2 text-center flex flex-col items-center justify-center gap-0.5">
                                            <Calendar className="h-3.5 w-3.5 text-violet-400" />
                                            <span className="text-xs font-black text-foreground mt-0.5">{u.week_plans_count}</span>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Plans</span>
                                        </div>
                                        <div className="bg-muted/30 border border-border/40 rounded-xl p-2 text-center flex flex-col items-center justify-center gap-0.5">
                                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                                            <span className="text-xs font-black text-foreground mt-0.5">{u.completed_days_count}</span>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Done Days</span>
                                        </div>
                                    </div>

                                    {/* Working On / Recent Goals Section */}
                                    {u.recent_goals && u.recent_goals.length > 0 && (
                                        <div className="bg-muted/15 border border-border/40 rounded-xl p-3 space-y-1.5">
                                            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                <Activity className="h-3 w-3 text-primary" />
                                                Active Focus / Recent Goals
                                            </div>
                                            <div className="space-y-1">
                                                {u.recent_goals.map((g, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-xs font-semibold text-foreground/95 bg-muted/20 px-2.5 py-1 rounded-lg border border-border/30">
                                                        <span className="truncate flex-1 pr-2">{g.name}</span>
                                                        {g.start_date && (
                                                            <span className="text-[9px] text-muted-foreground shrink-0 font-mono">
                                                                Starts: {new Date(g.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer / Last Active Time */}
                                <div className="border-t border-border/40 pt-2.5 flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-muted-foreground/60" />
                                        Last Active:
                                    </span>
                                    <span className={`font-bold ${u.last_active_at ? 'text-primary' : 'text-muted-foreground/50'}`}>
                                        {getRelativeTime(u.last_active_at)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ── Mails Tab ────────────────────────────────────────────────────────
const DEFAULT_TEMPLATES_DATA: Record<string, { subject: string; body: string; enabled: boolean }> = {
    'daily-briefing': {
        subject: '☀️ Your Daily Briefing for {date}',
        body: `Good morning {name},

You have {task_count} tasks scheduled for today. Here is your briefing:

{tasks_list}

Let's build your legacy today!

Best,
{sender_name}`,
        enabled: true
    },
    'task-reminder': {
        subject: '📋 Reminder: {task_name} starts soon',
        body: `Hi {name},

This is a quick reminder that your task "{task_name}" starts at {start_time} and ends at {end_time}.

Best,
{sender_name}`,
        enabled: true
    },
    'goal-deadline': {
        subject: '🎯 Goal Deadline: {goal_name} is approaching',
        body: `Hi {name},

Your goal "{goal_name}" is approaching its deadline in {days_remaining} days.

You have completed {completed_milestones} of your {total_milestones} milestones ({progress}%).

Keep pushing forward!

Best,
{sender_name}`,
        enabled: true
    }
};

const MailsTab: React.FC = () => {
    const [subTab, setSubTab] = useState<'smtp' | 'templates'>('smtp');
    const { settings, isLoading: isSmtpLoading, saveSettings, isSaving: isSavingSmtp } = useGlobalSmtpSettings();
    const { templates, isLoading: isTemplatesLoading, saveTemplate, isSaving: isSavingTemplate } = useGlobalEmailTemplates();

    // SMTP form state
    const [smtpEnabled, setSmtpEnabled] = useState(false);
    const [senderEmail, setSenderEmail] = useState('');
    const [senderName, setSenderName] = useState('');
    const [host, setHost] = useState('');
    const [port, setPort] = useState(587);
    const [minInterval, setMinInterval] = useState(60);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Template state
    const [selectedType, setSelectedType] = useState<string>('daily-briefing');
    const [templateSubject, setTemplateSubject] = useState('');
    const [templateBody, setTemplateBody] = useState('');
    const [templateEnabled, setTemplateEnabled] = useState(true);

    React.useEffect(() => {
        if (settings) {
            setSmtpEnabled(settings.enabled);
            setSenderEmail(settings.senderEmail || '');
            setSenderName(settings.senderName || '');
            setHost(settings.host || '');
            setPort(settings.port || 587);
            setMinInterval(settings.minInterval || 60);
            setUsername(settings.username || '');
            setPassword(settings.hasPassword ? '••••••••' : '');
        }
    }, [settings]);

    React.useEffect(() => {
        const current = templates.find(t => t.type === selectedType);
        if (current) {
            setTemplateSubject(current.subject);
            setTemplateBody(current.body);
            setTemplateEnabled(current.enabled);
        } else {
            const defaults = DEFAULT_TEMPLATES_DATA[selectedType];
            if (defaults) {
                setTemplateSubject(defaults.subject);
                setTemplateBody(defaults.body);
                setTemplateEnabled(defaults.enabled);
            } else {
                setTemplateSubject('');
                setTemplateBody('');
                setTemplateEnabled(true);
            }
        }
    }, [templates, selectedType]);

    const handleSaveSmtp = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveSettings({
            settings: {
                enabled: smtpEnabled,
                senderEmail,
                senderName,
                host,
                port,
                minInterval,
                username,
            },
            password: password === '••••••••' ? undefined : password,
        });
    };

    const handleSaveTemplate = async () => {
        await saveTemplate({
            type: selectedType,
            enabled: templateEnabled,
            subject: templateSubject,
            body: templateBody,
        });
    };

    const placeholders: Record<string, string[]> = {
        'daily-briefing': ['{name}', '{date}', '{task_count}', '{tasks_list}', '{sender_name}'],
        'task-reminder': ['{name}', '{task_name}', '{start_time}', '{end_time}', '{sender_name}'],
        'goal-deadline': ['{name}', '{goal_name}', '{days_remaining}', '{completed_milestones}', '{total_milestones}', '{progress}', '{sender_name}'],
    };

    if (isSmtpLoading || isTemplatesLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Sub-navigation */}
            <div className="flex gap-2 border-b border-border pb-3">
                <button
                    onClick={() => setSubTab('smtp')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        subTab === 'smtp'
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                    <Settings className="h-3.5 w-3.5" />
                    SMTP Settings
                </button>
                <button
                    onClick={() => setSubTab('templates')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        subTab === 'templates'
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                    <FileText className="h-3.5 w-3.5" />
                    Email Templates
                </button>
            </div>

            {subTab === 'smtp' && (
                <form onSubmit={handleSaveSmtp} className="space-y-6 max-w-2xl">
                    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold">Enable Custom SMTP</h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Send all email notifications through your Brevo/custom provider.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSmtpEnabled(!smtpEnabled)}
                                className={`relative w-10 h-6 rounded-full transition-colors ${
                                    smtpEnabled ? 'bg-emerald-500' : 'bg-muted'
                                }`}
                            >
                                <span className={`absolute top-[2px] left-[2px] w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                                    smtpEnabled ? 'translate-x-[18px]' : ''
                                }`} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                Sender Details
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Sender Email Address</label>
                                    <Input
                                        value={senderEmail}
                                        onChange={e => setSenderEmail(e.target.value)}
                                        placeholder="nirmalpriyankara.web@gmail.com"
                                        className="mt-1 h-9 bg-muted/50 border-border rounded-xl text-xs"
                                        required={smtpEnabled}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Sender Name</label>
                                    <Input
                                        value={senderName}
                                        onChange={e => setSenderName(e.target.value)}
                                        placeholder="Legacy Life Builder Team"
                                        className="mt-1 h-9 bg-muted/50 border-border rounded-xl text-xs"
                                        required={smtpEnabled}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <KeyRound className="h-3.5 w-3.5" />
                                SMTP Credentials
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Host</label>
                                    <Input
                                        value={host}
                                        onChange={e => setHost(e.target.value)}
                                        placeholder="smtp-relay.brevo.com"
                                        className="mt-1 h-9 bg-muted/50 border-border rounded-xl text-xs"
                                        required={smtpEnabled}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Port Number</label>
                                        <Input
                                            type="number"
                                            value={port}
                                            onChange={e => setPort(Number(e.target.value))}
                                            placeholder="587"
                                            className="mt-1 h-9 bg-muted/50 border-border rounded-xl text-xs"
                                            required={smtpEnabled}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Min Interval (s)</label>
                                        <Input
                                            type="number"
                                            value={minInterval}
                                            onChange={e => setMinInterval(Number(e.target.value))}
                                            placeholder="60"
                                            className="mt-1 h-9 bg-muted/50 border-border rounded-xl text-xs"
                                            required={smtpEnabled}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Username</label>
                                    <Input
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="a3beaa001@smtp-brevo.com"
                                        className="mt-1 h-9 bg-muted/50 border-border rounded-xl text-xs"
                                        required={smtpEnabled}
                                    />
                                </div>
                                <div className="relative">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Password</label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="SMTP Password"
                                            className="mt-1 h-9 pr-9 bg-muted/50 border-border rounded-xl text-xs"
                                            required={smtpEnabled && !settings?.hasPassword}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSavingSmtp} className="rounded-xl px-5 h-10 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 transition-all">
                            {isSavingSmtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Save SMTP Settings
                        </Button>
                    </div>
                </form>
            )}

            {subTab === 'templates' && (
                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
                    {/* Template list */}
                    <div className="space-y-2">
                        {['daily-briefing', 'task-reminder', 'goal-deadline'].map((type) => {
                            const t = templates.find(temp => temp.type === type);
                            return (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`w-full text-left px-4 py-3 border rounded-xl transition-all ${
                                        selectedType === type
                                            ? 'bg-primary/10 border-primary/30 text-foreground'
                                            : 'bg-card/40 border-border text-muted-foreground hover:text-foreground hover:bg-card'
                                    }`}
                                >
                                    <div className="text-xs font-bold capitalize">{type.replace('-', ' ')}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                        {t?.enabled ? 'Active' : 'Disabled'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Editor */}
                    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold capitalize">{selectedType.replace('-', ' ')} Template</h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Customize the email content.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTemplateEnabled(!templateEnabled)}
                                className={`relative w-10 h-6 rounded-full transition-colors ${
                                    templateEnabled ? 'bg-emerald-500' : 'bg-muted'
                                }`}
                            >
                                <span className={`absolute top-[2px] left-[2px] w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                                    templateEnabled ? 'translate-x-[18px]' : ''
                                }`} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Subject</label>
                                <Input
                                    value={templateSubject}
                                    onChange={e => setTemplateSubject(e.target.value)}
                                    placeholder="Enter subject line..."
                                    className="mt-1 h-10 bg-muted/50 border-border rounded-xl text-xs font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Body</label>
                                <textarea
                                    value={templateBody}
                                    onChange={e => setTemplateBody(e.target.value)}
                                    rows={10}
                                    className="w-full mt-1 p-3 bg-muted/50 border border-border rounded-xl text-xs font-medium focus:outline-none focus:border-primary transition-colors resize-y leading-relaxed font-mono"
                                    placeholder="Enter template body..."
                                />
                            </div>
                        </div>

                        {/* Available Placeholders Tip */}
                        <div className="bg-primary/[0.03] border border-primary/10 rounded-xl p-3.5 space-y-1.5">
                            <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                Available Variables
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {placeholders[selectedType]?.map((p) => (
                                    <code key={p} className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded text-foreground font-mono">
                                        {p}
                                    </code>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSaveTemplate} disabled={isSavingTemplate} className="rounded-xl px-5 h-10 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 transition-all">
                                {isSavingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Template
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Landing Page Config Tab ──────────────────────────────────────────
const LandingTab: React.FC = () => {
    const { data: settings, isLoading: isSettingsLoading } = useLandingSettings();
    const updateSettings = useUpdateLandingSettings();
    const { data: feedbacks, isLoading: isFeedbacksLoading } = useAdminFeedbacks();
    const updateFeedback = useAdminUpdateFeedback();

    // Form states for video and galleries
    const [desktopVideo, setDesktopVideo] = useState('');
    const [mobileVideo, setMobileVideo] = useState('');
    const [desktopGallery, setDesktopGallery] = useState<string[]>([]);
    const [mobileGallery, setMobileGallery] = useState<string[]>([]);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [newDesktopUrl, setNewDesktopUrl] = useState('');
    const [newMobileUrl, setNewMobileUrl] = useState('');

    // Sync state when settings query resolves
    React.useEffect(() => {
        if (settings) {
            setDesktopVideo(settings.desktop_video_url || '');
            setMobileVideo(settings.mobile_video_url || '');
            setDesktopGallery(settings.desktop_gallery || []);
            setMobileGallery(settings.mobile_gallery || []);
            setMaintenanceMode(settings.maintenance_mode || false);
        }
    }, [settings]);

    const handleSaveSettings = () => {
        updateSettings.mutate({
            desktop_video_url: desktopVideo,
            mobile_video_url: mobileVideo,
            desktop_gallery: desktopGallery,
            mobile_gallery: mobileGallery,
            maintenance_mode: maintenanceMode,
        });
    };

    const handleAddDesktopUrl = () => {
        if (newDesktopUrl.trim()) {
            setDesktopGallery(prev => [...prev, newDesktopUrl.trim()]);
            setNewDesktopUrl('');
        }
    };

    const handleRemoveDesktopUrl = (index: number) => {
        setDesktopGallery(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddMobileUrl = () => {
        if (newMobileUrl.trim()) {
            setMobileGallery(prev => [...prev, newMobileUrl.trim()]);
            setNewMobileUrl('');
        }
    };

    const handleRemoveMobileUrl = (index: number) => {
        setMobileGallery(prev => prev.filter((_, i) => i !== index));
    };

    if (isSettingsLoading || isFeedbacksLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-card/60 border border-border rounded-2xl p-5 h-32 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Maintenance Mode Card */}
            <div className="bg-card/60 border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Maintenance / Upgrade Mode</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Enable this mode before performing system upgrades or database restarts. Logged-in users will see a friendly upgrade/maintenance page instead of database errors.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
                            maintenanceMode ? 'bg-amber-500' : 'bg-muted'
                        }`}
                    >
                        <span className={`absolute top-[2px] left-[2px] w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                            maintenanceMode ? 'translate-x-[18px]' : ''
                        }`} />
                    </button>
                </div>
            </div>

            {/* Hero Video & Product Gallery Config */}
            <div className="bg-card/60 border border-border rounded-2xl p-5 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Media Settings</h3>
                  <p className="text-xs text-muted-foreground mt-1">Configure landing page hero videos and preview screenshots.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Desktop Hero Video */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Desktop Video URL</label>
                        <Input
                            value={desktopVideo}
                            onChange={(e) => setDesktopVideo(e.target.value)}
                            placeholder="Enter Cloudinary/MP4 Video URL"
                            className="bg-muted text-xs h-10 rounded-xl"
                        />
                    </div>

                    {/* Mobile Hero Video */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mobile Video URL</label>
                        <Input
                            value={mobileVideo}
                            onChange={(e) => setMobileVideo(e.target.value)}
                            placeholder="Enter Cloudinary/MP4 Video URL"
                            className="bg-muted text-xs h-10 rounded-xl"
                        />
                    </div>
                </div>

                {/* Galleries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border pt-6">
                    {/* Desktop Gallery */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Desktop Gallery Images</label>
                        <div className="flex gap-2">
                            <Input
                                value={newDesktopUrl}
                                onChange={(e) => setNewDesktopUrl(e.target.value)}
                                placeholder="Add desktop image URL"
                                className="bg-muted text-xs h-10 rounded-xl flex-1"
                            />
                            <Button onClick={handleAddDesktopUrl} size="sm" className="rounded-xl h-10 px-4">Add</Button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {desktopGallery.map((url, i) => (
                                <div key={i} className="flex items-center justify-between gap-3 bg-muted/40 border border-border/60 p-2 rounded-xl text-xs">
                                    <span className="truncate flex-1 text-muted-foreground">{url}</span>
                                    <Button onClick={() => handleRemoveDesktopUrl(i)} variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/15">
                                        &times;
                                    </Button>
                                </div>
                            ))}
                            {desktopGallery.length === 0 && (
                                <span className="text-xs text-muted-foreground/60 italic">No custom desktop screenshots added. Defaults will be shown.</span>
                            )}
                        </div>
                    </div>

                    {/* Mobile Gallery */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Mobile Gallery Images</label>
                        <div className="flex gap-2">
                            <Input
                                value={newMobileUrl}
                                onChange={(e) => setNewMobileUrl(e.target.value)}
                                placeholder="Add mobile image URL"
                                className="bg-muted text-xs h-10 rounded-xl flex-1"
                            />
                            <Button onClick={handleAddMobileUrl} size="sm" className="rounded-xl h-10 px-4">Add</Button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {mobileGallery.map((url, i) => (
                                <div key={i} className="flex items-center justify-between gap-3 bg-muted/40 border border-border/60 p-2 rounded-xl text-xs">
                                    <span className="truncate flex-1 text-muted-foreground">{url}</span>
                                    <Button onClick={() => handleRemoveMobileUrl(i)} variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/15">
                                        &times;
                                    </Button>
                                </div>
                            ))}
                            {mobileGallery.length === 0 && (
                                <span className="text-xs text-muted-foreground/60 italic">No custom mobile screenshots added. Defaults will be shown.</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                    <Button onClick={handleSaveSettings} disabled={updateSettings.isPending} className="gap-2 rounded-xl h-10 px-5">
                        {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Settings
                    </Button>
                </div>
            </div>

            {/* Testimonials Curation */}
            <div className="bg-card/60 border border-border rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Testimonials Curation</h3>
                  <p className="text-xs text-muted-foreground mt-1">Approve specific user feedback messages to render in the landing page review marquee.</p>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {(feedbacks ?? []).filter(f => f.category === 'About Legacy Life Builder').map((f) => (
                        <div key={f.id} className="bg-muted/30 border border-border/80 p-4 rounded-2xl flex flex-col gap-4 transition-all hover:border-border">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{f.category}</span>
                                        <span className="text-[9px] text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</span>
                                        {f.consent_to_show ? (
                                            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                                Consent Given
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                                No Consent
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-xs font-bold text-foreground truncate">{f.subject}</h4>
                                    <p className="text-xs text-muted-foreground leading-normal">{f.message}</p>
                                </div>
                                <Button
                                    onClick={() => updateFeedback.mutate({ id: f.id, show_on_landing: !f.show_on_landing })}
                                    variant={f.show_on_landing ? "default" : "outline"}
                                    size="sm"
                                    className="w-full sm:w-auto h-8 text-[11px] font-bold tracking-wider uppercase shrink-0 rounded-xl"
                                >
                                    {f.show_on_landing ? "Showing on Landing" : "Show on Landing"}
                                </Button>
                            </div>

                            {!f.consent_to_show && f.show_on_landing && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[11px] p-2.5 rounded-xl flex items-center gap-2 font-medium">
                                    <span>Warning: User has not given consent to show this feedback publicly.</span>
                                </div>
                            )}

                            {/* Curation Details Form */}
                            <div className="border-t border-border/50 pt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Display Name</label>
                                    <Input
                                        defaultValue={f.author_name || ''}
                                        id={`name-${f.id}`}
                                        placeholder="e.g. David K."
                                        className="h-8 text-xs bg-muted/65 rounded-lg border-border"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Display Position</label>
                                    <Input
                                        defaultValue={f.author_position || ''}
                                        id={`pos-${f.id}`}
                                        placeholder="e.g. Founder"
                                        className="h-8 text-xs bg-muted/65 rounded-lg border-border"
                                    />
                                </div>
                                <div className="space-y-1 font-sans">
                                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Rating</label>
                                    <select
                                        defaultValue={f.rating || 5}
                                        id={`rating-${f.id}`}
                                        className="h-8 w-full text-xs bg-muted/65 border border-input rounded-lg px-2 focus:outline-none"
                                    >
                                        {[5, 4, 3, 2, 1].map((r) => (
                                            <option key={r} value={r}>{r} Stars</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2 items-center justify-between">
                                    <div className="flex items-center gap-1.5 h-8">
                                        <input
                                            type="checkbox"
                                            defaultChecked={f.consent_to_show}
                                            id={`consent-${f.id}`}
                                            className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-primary accent-primary cursor-pointer"
                                        />
                                        <label htmlFor={`consent-${f.id}`} className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider cursor-pointer">
                                            Consent
                                        </label>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            const nameVal = (document.getElementById(`name-${f.id}`) as HTMLInputElement)?.value;
                                            const posVal = (document.getElementById(`pos-${f.id}`) as HTMLInputElement)?.value;
                                            const ratingVal = parseInt((document.getElementById(`rating-${f.id}`) as HTMLSelectElement)?.value || '5');
                                            const consentVal = (document.getElementById(`consent-${f.id}`) as HTMLInputElement)?.checked;
                                            updateFeedback.mutate({
                                                id: f.id,
                                                author_name: nameVal || null,
                                                author_position: posVal || null,
                                                rating: ratingVal,
                                                consent_to_show: consentVal
                                            });
                                        }}
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 rounded-lg text-[10px] font-bold tracking-wider uppercase shrink-0"
                                    >
                                        Update Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(feedbacks ?? []).filter(f => f.category === 'About Legacy Life Builder').length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground">No user feedbacks received yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Updates Tab ──────────────────────────────────────────────────────
const UpdatesTab: React.FC = () => {
    const [updates, setUpdates] = useState<AppUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [version, setVersion] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const fetchUpdates = async () => {
        setLoading(true);
        try {
            const data = await AppUpdateService.getAllUpdates();
            setUpdates(data);
        } catch (e) {
            console.error("Failed to load updates:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUpdates();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!version.trim() || !title.trim() || !description.trim()) {
            toast.error("Please fill all update fields.");
            return;
        }

        setSaving(true);
        try {
            await AppUpdateService.createUpdate(version.trim(), title.trim(), description.trim());
            toast.success("Release update published successfully!");
            setVersion('');
            setTitle('');
            setDescription('');
            fetchUpdates();
        } catch (err: any) {
            toast.error("Failed to publish update: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this release update?")) return;
        try {
            await AppUpdateService.deleteUpdate(id);
            toast.success("Release update deleted");
            fetchUpdates();
        } catch (err: any) {
            toast.error("Failed to delete update: " + err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Publish Update Form */}
                <div className="lg:col-span-1 bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Publish New Update</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Announce a new release to all active users instantly.</p>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Version Number</label>
                            <Input
                                value={version}
                                onChange={e => setVersion(e.target.value)}
                                placeholder="e.g. v1.2.0"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Release Title</label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Satisfying Goal Completion & System Wins"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Release Notes / Description (Pointwise)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Separate bullet points with newlines:&#10;- Added golden particles&#10;- Added system wins Insights"
                                rows={6}
                                className="w-full bg-zinc-900 border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none font-sans"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                            <span>{saving ? 'Publishing...' : 'Publish Update'}</span>
                        </Button>
                    </form>
                </div>

                {/* Published Updates List */}
                <div className="lg:col-span-2 bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Published Updates & Changelogs</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Manage existing updates sent to users.</p>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-20 bg-muted/40 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : updates.length > 0 ? (
                        <div className="space-y-4">
                            {updates.map((up) => (
                                <div key={up.id} className="p-4 rounded-xl border border-border bg-glass relative group flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-2 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                                                {up.version}
                                            </span>
                                            <h4 className="text-sm font-black text-foreground truncate">{up.title}</h4>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-semibold">
                                            Released: {new Date(up.release_date).toLocaleString()}
                                        </p>
                                        <div className="space-y-1 pl-1">
                                            {up.description.split('\n').filter(Boolean).map((line, idx) => (
                                                <div key={idx} className="text-xs text-muted-foreground flex gap-1.5 items-start leading-relaxed">
                                                    <span className="text-primary mt-1 select-none font-bold text-[9px]">•</span>
                                                    <span>{line}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => handleDelete(up.id)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent shrink-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-xs text-muted-foreground">
                            No release updates published yet. Publish one on the left panel!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Admin Page Shell ─────────────────────────────────────────────────
const AdminPageInner: React.FC = () => {
    const [tab, setTab] = useState<Tab>('dashboard');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Top bar */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/today')} className="h-8 w-8 rounded-lg">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-primary/15 flex items-center justify-center">
                                <Eye className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="text-sm font-black tracking-wide">Admin</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab nav */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4">
                <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
                    {TAB_ITEMS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                                tab === t.key
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {t.icon}
                            <span className="hidden sm:inline">{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
                {tab === 'dashboard' && <DashboardTab />}
                {tab === 'intelligence' && <ProductIntelligenceTab />}
                {tab === 'feedbacks' && <FeedbacksTab />}
                {tab === 'users' && <UsersTab />}
                {tab === 'mails' && <MailsTab />}
                {tab === 'landing' && <LandingTab />}
                {tab === 'updates' && <UpdatesTab />}
            </div>
        </div>
    );
};

export const AdminPage: React.FC = () => (
    <AdminGuard>
        <AdminPageInner />
    </AdminGuard>
);
