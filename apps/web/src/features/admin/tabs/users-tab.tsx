import React, { useState } from 'react';
import { Clock, Search, Check, Loader2, Zap, Calendar, Target, Activity, Download, Users, UserPlus, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@llb/core';
import { UserDetailDialog } from '../components/user-detail-dialog';
import { StatCard } from '../components/stat-card';
import { useAdminUsersActivity, useAdminUserProfileExtras, exportUsersToExcel, getUserEngagementTier, TIER_META, type EngagementTier } from '@/api/services/feedback-service';


export const UsersTab: React.FC = () => {
    const { data: users, isLoading } = useAdminUsersActivity();
    const { data: extras } = useAdminUserProfileExtras();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterTier, setFilterTier] = useState<'all' | EngagementTier | 'new'>('all');
    const [sortMode, setSortMode] = useState<'engaged' | 'attention'>('engaged');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const count = await exportUsersToExcel();
            toast.success(`Exported ${count} users`);
        } catch (err) {
            toast.error('Export failed: ' + (err instanceof Error ? err.message : 'unknown error'));
        } finally {
            setIsExporting(false);
        }
    };

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

    const extraById = new Map((extras ?? []).map((x) => [x.user_id, x]));
    const total = processedUsers.length;
    const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : '0%');
    const active7 = processedUsers.filter((u) => u.daysSinceActive <= 7).length;
    const new7 = processedUsers.filter((u) => u.isNew).length;
    const personalized = processedUsers.filter((u) => u.is_personalized).length;
    const optedIn = (extras ?? []).filter((x) => x.marketing_opt_in).length;
    const assessed = (extras ?? []).filter((x) => !!x.execution_profile?.completedAt).length;
    const selected = processedUsers.find((u) => u.user_id === selectedId);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <StatCard label="Total users" value={total} icon={<Users className="h-4 w-4 text-primary" />} />
                <StatCard label="Active (7d)" value={active7} icon={<Activity className="h-4 w-4 text-emerald-400" />} accent="bg-emerald-500/10" />
                <StatCard label="New (7d)" value={new7} icon={<UserPlus className="h-4 w-4 text-blue-400" />} accent="bg-blue-500/10" />
                <StatCard label="Personalized" value={pct(personalized)} icon={<Target className="h-4 w-4 text-violet-400" />} accent="bg-violet-500/10" />
                <StatCard label="Marketing opt-in" value={pct(optedIn)} icon={<Mail className="h-4 w-4 text-amber-400" />} accent="bg-amber-500/10" />
                <StatCard label="Assessment done" value={pct(assessed)} icon={<Zap className="h-4 w-4 text-pink-400" />} accent="bg-pink-500/10" />
            </div>

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
                    <Button onClick={handleExport} disabled={isExporting} variant="outline" className="h-10 rounded-xl gap-1.5">
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Export Excel
                    </Button>
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
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedId(u.user_id)}
                                onKeyDown={(e) => { if (e.key === 'Enter') setSelectedId(u.user_id); }}
                                className={`bg-card/60 backdrop-blur-sm border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:border-primary/30 cursor-pointer relative overflow-hidden group ${
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
                                            {extraById.get(u.user_id)?.marketing_opt_in && (
                                                <span className="text-[8px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">Opted in</span>
                                            )}
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

            <UserDetailDialog
                userId={selectedId}
                name={selected?.full_name}
                email={selected?.email}
                onClose={() => setSelectedId(null)}
            />
        </div>
    );
};

