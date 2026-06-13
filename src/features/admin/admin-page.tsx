import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, MessageSquare, Users, ArrowLeft,
    TrendingUp, Clock, CheckCircle2, Eye, UserPlus,
    ChevronDown, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminFeedbacks, useAdminUsers, useAdminStats, useAdminUpdateFeedbackStatus } from '@/api/services/feedback-service';
import { STATUS_COLORS, FEEDBACK_STATUSES, type FeedbackStatus } from './admin-constants';
import { AdminGuard } from './admin-guard';

type Tab = 'dashboard' | 'feedbacks' | 'users';

const TAB_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'feedbacks', label: 'Feedbacks', icon: <MessageSquare className="h-4 w-4" /> },
    { key: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-card/60 border border-border rounded-2xl p-5 h-28 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard label="Total Users" value={stats.totalUsers} icon={<Users className="h-4.5 w-4.5 text-blue-400" />} accent="bg-blue-500/10" />
                <StatCard label="New This Week" value={stats.recentUsers} icon={<UserPlus className="h-4.5 w-4.5 text-emerald-400" />} accent="bg-emerald-500/10" />
                <StatCard label="Personalized" value={stats.personalizedUsers} icon={<CheckCircle2 className="h-4.5 w-4.5 text-violet-400" />} accent="bg-violet-500/10" />
                <StatCard label="Total Feedbacks" value={stats.totalFeedbacks} icon={<MessageSquare className="h-4.5 w-4.5 text-amber-400" />} accent="bg-amber-500/10" />
                <StatCard label="Open Issues" value={stats.openCount} icon={<Clock className="h-4.5 w-4.5 text-orange-400" />} accent="bg-orange-500/10" />
                <StatCard label="Resolved" value={stats.resolvedCount} icon={<TrendingUp className="h-4.5 w-4.5 text-green-400" />} accent="bg-green-500/10" />
            </div>

            {/* Quick ratio bar */}
            {stats.totalFeedbacks > 0 && (
                <div className="bg-card/60 border border-border rounded-2xl p-4 sm:p-5">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Feedback Resolution</div>
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
                        {stats.resolvedCount > 0 && (
                            <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(stats.resolvedCount / stats.totalFeedbacks) * 100}%` }} />
                        )}
                        {stats.reviewedCount > 0 && (
                            <div className="bg-blue-500 transition-all duration-500" style={{ width: `${(stats.reviewedCount / stats.totalFeedbacks) * 100}%` }} />
                        )}
                        {stats.openCount > 0 && (
                            <div className="bg-amber-500 transition-all duration-500" style={{ width: `${(stats.openCount / stats.totalFeedbacks) * 100}%` }} />
                        )}
                    </div>
                    <div className="flex gap-4 mt-2.5">
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Resolved</span>
                        <span className="text-[10px] font-semibold text-blue-400 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Reviewed</span>
                        <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Open</span>
                    </div>
                </div>
            )}
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

    const filtered = (feedbacks ?? []).filter((f) => {
        const matchSearch = !search || f.subject.toLowerCase().includes(search.toLowerCase()) || f.message.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || f.status === filterStatus;
        return matchSearch && matchStatus;
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
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search feedbacks..."
                        className="h-10 pl-9 rounded-xl bg-muted border-border"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', ...FEEDBACK_STATUSES] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors border ${
                                filterStatus === s
                                    ? 'bg-primary/15 text-primary border-primary/30'
                                    : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                            }`}
                        >
                            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
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
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{f.category}</span>
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
    const { data: users, isLoading } = useAdminUsers();
    const [search, setSearch] = useState('');

    const filtered = (users ?? []).filter((u) => {
        if (!search) return true;
        return (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) || u.user_id.toLowerCase().includes(search.toLowerCase());
    });

    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card/60 border border-border rounded-2xl p-5 h-16 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users..."
                    className="h-10 pl-9 rounded-xl bg-muted border-border"
                />
            </div>

            <div className="text-xs text-muted-foreground font-semibold px-1">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</div>

            {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((u) => (
                        <div key={u.user_id} className="bg-card/60 border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200 hover:border-primary/10">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                                    {(u.full_name ?? '?')[0]?.toUpperCase() ?? '?'}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold truncate">{u.full_name || 'Unnamed User'}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">{u.user_id.slice(0, 12)}...</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {u.is_personalized && (
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">Setup done</span>
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                    {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
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
                {tab === 'feedbacks' && <FeedbacksTab />}
                {tab === 'users' && <UsersTab />}
            </div>
        </div>
    );
};

export const AdminPage: React.FC = () => (
    <AdminGuard>
        <AdminPageInner />
    </AdminGuard>
);
