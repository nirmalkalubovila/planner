import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, MessageSquare, Users, ArrowLeft,
    TrendingUp, Clock, CheckCircle2, Eye, EyeOff, UserPlus,
    ChevronDown, Search, Mail, Settings, FileText, Check, Save, Info, Loader2, KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    useAdminFeedbacks, useAdminUsers, useAdminStats, useAdminUpdateFeedbackStatus,
    useLandingSettings, useUpdateLandingSettings, useAdminUpdateFeedback
} from '@/api/services/feedback-service';
import { STATUS_COLORS, FEEDBACK_STATUSES, type FeedbackStatus } from './admin-constants';
import { AdminGuard } from './admin-guard';
import {
    useGlobalSmtpSettings,
    useGlobalEmailTemplates
} from '@/api/services/admin-smtp-service';

type Tab = 'dashboard' | 'feedbacks' | 'users' | 'mails' | 'landing';

const TAB_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'feedbacks', label: 'Feedbacks', icon: <MessageSquare className="h-4 w-4" /> },
    { key: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
    { key: 'mails', label: 'Mails', icon: <Mail className="h-4 w-4" /> },
    { key: 'landing', label: 'Landing Config', icon: <Settings className="h-4 w-4" /> },
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
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{f.category}</span>
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
    const [newDesktopUrl, setNewDesktopUrl] = useState('');
    const [newMobileUrl, setNewMobileUrl] = useState('');

    // Sync state when settings query resolves
    React.useEffect(() => {
        if (settings) {
            setDesktopVideo(settings.desktop_video_url || '');
            setMobileVideo(settings.mobile_video_url || '');
            setDesktopGallery(settings.desktop_gallery || []);
            setMobileGallery(settings.mobile_gallery || []);
        }
    }, [settings]);

    const handleSaveSettings = () => {
        updateSettings.mutate({
            desktop_video_url: desktopVideo,
            mobile_video_url: mobileVideo,
            desktop_gallery: desktopGallery,
            mobile_gallery: mobileGallery,
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
                    {(feedbacks ?? []).map((f) => (
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
                                    <span>⚠️ Warning: User has not given consent to show this feedback publicly.</span>
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
                    {(feedbacks ?? []).length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground">No user feedbacks received yet.</div>
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
                {tab === 'feedbacks' && <FeedbacksTab />}
                {tab === 'users' && <UsersTab />}
                {tab === 'mails' && <MailsTab />}
                {tab === 'landing' && <LandingTab />}
            </div>
        </div>
    );
};

export const AdminPage: React.FC = () => (
    <AdminGuard>
        <AdminPageInner />
    </AdminGuard>
);
