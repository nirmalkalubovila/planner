import React, { useState } from 'react';
import { UserRound, Star } from 'lucide-react';
import { DEEP_WORK_LABELS, SWITCH_LABELS, FREE_TIME_LABELS, getSituationStatuses, situationSummary, type ExecutionProfile } from '@llb/core';
import { StandardDialog } from '@/components/common/standard-dialog';
import { useAdminUserDetail, type AdminUserDetail } from '@/api/services/feedback-service';

type Section = 'overview' | 'goals' | 'habits' | 'planner' | 'tasks' | 'feedback';

interface UserDetailDialogProps {
    userId: string | null;
    name?: string | null;
    email?: string | null;
    onClose: () => void;
}

const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

const ageOf = (dob?: string | null) => {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
    return age;
};

// Goals store "Current State" / "Ultimate Goal" / "Strict Constraints" packed into name / purpose
function unpackGoal(name?: string, purpose?: string) {
    const n = name ?? '';
    const cs = n.match(/Current State:\n([\s\S]*?)\n\nUltimate Goal:\n/);
    const ug = n.match(/Ultimate Goal:\n([\s\S]*)$/);
    const cons = (purpose ?? '').match(/Strict Constraints:\n([\s\S]*?)(\n\nDefinition of Success:|$)/);
    return {
        currentState: cs?.[1]?.trim() ?? '',
        ultimateGoal: ug?.[1]?.trim() ?? (cs ? '' : n.trim()),
        constraints: cons?.[1]?.trim() ?? (purpose ?? '').trim(),
    };
}

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div className="space-y-0.5 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
        <p className="text-sm font-medium break-words">{value === undefined || value === null || value === '' ? <span className="text-muted-foreground/50">-</span> : value}</p>
    </div>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-card/60 border border-border rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-foreground">{title}</h4>
        {children}
    </div>
);

const Empty: React.FC<{ text: string }> = ({ text }) => <div className="text-center py-10 text-sm text-muted-foreground">{text}</div>;

const OverviewSection: React.FC<{ d: AdminUserDetail }> = ({ d }) => {
    const p = d.profile ?? {};
    const ep = (p.execution_profile ?? {}) as ExecutionProfile;
    const age = ageOf(p.dob);
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card title="Account">
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Email" value={d.account?.email} />
                    <Field label="Sign-in method" value={d.account?.provider} />
                    <Field label="Joined" value={fmtDate(d.account?.created_at)} />
                    <Field label="Last sign-in" value={fmtDate(d.account?.last_sign_in_at)} />
                    <Field label="Marketing emails" value={p.marketing_opt_in ? 'Opted in' : 'Not opted in'} />
                    <Field label="Subscription" value={p.subscription_status} />
                </div>
            </Card>

            <Card title="Profile">
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Date of birth" value={p.dob ? `${p.dob}${age !== null ? ` (${age})` : ''}` : undefined} />
                    <Field label="Profession" value={p.current_profession} />
                    <Field label="Primary focus" value={p.primary_life_focus} />
                    <Field label="Energy peak" value={p.energy_peak_time} />
                    <Field label="Focus ability" value={p.focus_ability} />
                    <Field label="Task shifting" value={p.task_shifting_ability} />
                    <Field label="Sleep" value={p.sleep_start ? `${p.sleep_start} for ${p.sleep_duration ?? '?'}h` : undefined} />
                    <Field label="Free hours / day" value={p.daily_free_hours} />
                    <Field label="Week starts" value={p.week_start} />
                    <Field label="Planning" value={p.plan_day ? `${p.plan_day} ${p.plan_start_time ?? ''}-${p.plan_end_time ?? ''}` : undefined} />
                    <div className="col-span-2"><Field label="Biggest challenge" value={p.biggest_challenge} /></div>
                </div>
            </Card>

            <Card title="Execution Profile">
                {ep.completedAt ? (
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Situation" value={situationSummary(getSituationStatuses(ep)) || undefined} />
                        <Field label="Deep work" value={ep.capacity?.deepWorkMin ? DEEP_WORK_LABELS[ep.capacity.deepWorkMin] : undefined} />
                        <Field label="Switch recovery" value={ep.capacity?.switchRecovery ? SWITCH_LABELS[ep.capacity.switchRecovery] : undefined} />
                        <Field label="Weekday free" value={ep.situation?.weekdayFree ? FREE_TIME_LABELS[ep.situation.weekdayFree] : undefined} />
                        <Field label="Weekend free" value={ep.situation?.weekendFree ? FREE_TIME_LABELS[ep.situation.weekendFree] : undefined} />
                        <Field label="Schedule" value={ep.style?.structure} />
                        <Field label="Low energy" value={ep.capacity?.lowEnergyPeriod} />
                        <Field label="Daily load" value={ep.capacity?.maxDailyLoad} />
                        <div className="col-span-2"><Field label="Failure patterns" value={ep.risks?.patterns?.map((x) => x.replace(/_/g, ' ')).join(', ')} /></div>
                        <div className="col-span-2"><Field label="When they stop a goal" value={ep.risks?.stopBehavior} /></div>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">Assessment not completed yet.</p>
                )}
            </Card>

            <Card title="Usage">
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Goals" value={d.goals.length} />
                    <Field label="Habits" value={d.habits.length} />
                    <Field label="Weeks planned" value={d.counts.week_plans_total} />
                    <Field label="Days with completed tasks" value={d.counts.completed_days_total} />
                    <Field label="Vault notes (count only)" value={d.counts.vault_notes} />
                    <Field label="Push devices" value={d.counts.push_devices} />
                </div>
            </Card>
        </div>
    );
};

const GoalsSection: React.FC<{ goals: AdminUserDetail['goals'] }> = ({ goals }) => {
    if (goals.length === 0) return <Empty text="No goals yet" />;
    return (
        <div className="space-y-4">
            {goals.map((g) => {
                const u = unpackGoal(g.name, g.purpose);
                const milestones: { completed?: boolean }[] = Array.isArray(g.milestones) ? g.milestones : [];
                const done = milestones.filter((m) => m.completed).length;
                const pct = milestones.length ? Math.round((done / milestones.length) * 100) : 0;
                const plans: unknown[] = Array.isArray(g.plans) ? g.plans : [];
                const ctx = (g.goalContext ?? null) as Record<string, any> | null;
                return (
                    <Card key={g.id} title={g.title || u.ultimateGoal.slice(0, 60) || 'Untitled goal'}>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
                            <span>{g.goalType} goal</span>
                            <span>{g.startDate} to {g.endDate}</span>
                            <span>{plans.length} plan phase{plans.length === 1 ? '' : 's'}</span>
                            {g.bucket && <span className="capitalize">{g.bucket} bucket</span>}
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                            <Field label="Where they are" value={u.currentState} />
                            <Field label="Target" value={u.ultimateGoal} />
                            <Field label="Limits" value={u.constraints} />
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                <span>Milestones</span>
                                <span>{done}/{milestones.length} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                        </div>
                        {ctx && (
                            <div className="grid gap-3 md:grid-cols-3 pt-2 border-t border-border/50">
                                <Field label="Why it matters" value={ctx.why} />
                                <Field label="Success measure" value={ctx.successMeasure} />
                                <Field label="Deadline" value={ctx.deadlineFlex} />
                                <Field label="Weekly hours" value={ctx.weeklyHours} />
                                <Field label="Budget" value={ctx.resources?.budget} />
                                <Field label="Skills" value={ctx.resources?.skills} />
                                {ctx.priorAttempt?.attempted && <div className="md:col-span-3"><Field label="Previous attempt" value={`${ctx.priorAttempt.whatTried ?? ''} - stopped: ${ctx.priorAttempt.whyStopped ?? ''}`} /></div>}
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
    );
};

const HabitsSection: React.FC<{ habits: AdminUserDetail['habits'] }> = ({ habits }) => {
    if (habits.length === 0) return <Empty text="No habits yet" />;
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {habits.map((h) => (
                <Card key={h.id} title={h.name}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Time" value={`${h.startTime}-${h.endTime}`} />
                        <Field label="Days" value={Array.isArray(h.daysOfWeek) ? h.daysOfWeek.join(', ') : undefined} />
                        <Field label="From" value={h.startDate} />
                        <Field label="Until" value={h.endDate} />
                        <div className="col-span-2"><Field label="Purpose" value={h.purpose} /></div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

const PlannerSection: React.FC<{ d: AdminUserDetail }> = ({ d }) => (
    <div className="space-y-4">
        <Card title={`Weeks planned (last ${d.week_plans.length})`}>
            {d.week_plans.length === 0 ? <p className="text-xs text-muted-foreground">No weekly plans yet.</p> : (
                <div className="space-y-2">
                    {d.week_plans.map((w) => {
                        const ba = (w.bucket_actions ?? {}) as Record<string, any>;
                        const priorities = ['p1', 'p2', 'p3'].map((k) => ba[k]?.text).filter(Boolean) as string[];
                        return (
                            <div key={w.week} className="bg-muted/20 border border-border/40 rounded-xl px-3 py-2 text-xs">
                                <div className="flex justify-between gap-3 font-semibold">
                                    <span>{w.week}</span>
                                    <span className="text-muted-foreground">{w.slots} planned slots</span>
                                </div>
                                {priorities.length > 0 && <p className="text-muted-foreground mt-1">Big 3: {priorities.join(' | ')}</p>}
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
        <Card title={`Days with completed tasks (latest ${d.completed_days.length})`}>
            {d.completed_days.length === 0 ? <p className="text-xs text-muted-foreground">Nothing completed yet.</p> : (
                <div className="flex flex-wrap gap-1.5">
                    {d.completed_days.map((c) => (
                        <span key={c.day} className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md">{c.day} ({c.count})</span>
                    ))}
                </div>
            )}
        </Card>
    </div>
);

const TaskList: React.FC<{ title: string; items: AdminUserDetail['custom_tasks'] }> = ({ title, items }) => (
    <Card title={`${title} (${items.length})`}>
        {items.length === 0 ? <p className="text-xs text-muted-foreground">None.</p> : (
            <div className="space-y-1.5">
                {items.map((t) => (
                    <div key={t.id} className="flex justify-between gap-3 text-xs bg-muted/20 border border-border/40 rounded-lg px-3 py-1.5">
                        <span className="font-semibold truncate">{t.name}</span>
                        <span className="text-muted-foreground shrink-0">{t.startTime}-{t.endTime}</span>
                    </div>
                ))}
            </div>
        )}
    </Card>
);

const FeedbackSection: React.FC<{ feedbacks: AdminUserDetail['feedbacks'] }> = ({ feedbacks }) => {
    if (feedbacks.length === 0) return <Empty text="No feedback from this user" />;
    return (
        <div className="space-y-3">
            {feedbacks.map((f) => (
                <Card key={f.id} title={f.subject}>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                        {typeof f.rating === 'number' && <span className="flex items-center gap-1 text-amber-400 font-bold"><Star className="h-3 w-3 fill-amber-400" />{f.rating}/5</span>}
                        <span>{f.category}</span>
                        <span>{fmtDate(f.created_at)}</span>
                        <span className="capitalize">{f.status}</span>
                        {f.show_on_landing && <span className="text-emerald-500 font-bold">On landing page</span>}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{f.message}</p>
                </Card>
            ))}
        </div>
    );
};

/** Full drill-down for one user. Data comes from the admin-only get_admin_user_detail RPC (vault content is never included). */
export const UserDetailDialog: React.FC<UserDetailDialogProps> = ({ userId, name, email, onClose }) => {
    const { data, isLoading, error } = useAdminUserDetail(userId);
    const [section, setSection] = useState<Section>('overview');

    const tabs: { key: Section; label: string }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'goals', label: `Goals${data ? ` (${data.goals.length})` : ''}` },
        { key: 'habits', label: `Habits${data ? ` (${data.habits.length})` : ''}` },
        { key: 'planner', label: 'Planner' },
        { key: 'tasks', label: 'Tasks' },
        { key: 'feedback', label: `Feedback${data ? ` (${data.feedbacks.length})` : ''}` },
    ];

    return (
        <StandardDialog
            isOpen={!!userId}
            onClose={() => { setSection('overview'); onClose(); }}
            title={name || 'User'}
            subtitle={email || undefined}
            icon={UserRound}
            maxWidth="6xl"
        >
            <div className="p-4 sm:p-6 space-y-5">
                <div className="flex flex-wrap gap-1.5">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setSection(t.key)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${section === t.key ? 'bg-primary/15 text-primary border-primary/30' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {isLoading && <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-card/60 border border-border animate-pulse" />)}</div>}
                {error && <Empty text={`Could not load this user: ${(error as Error).message}`} />}
                {data && (
                    <>
                        {section === 'overview' && <OverviewSection d={data} />}
                        {section === 'goals' && <GoalsSection goals={data.goals} />}
                        {section === 'habits' && <HabitsSection habits={data.habits} />}
                        {section === 'planner' && <PlannerSection d={data} />}
                        {section === 'tasks' && (
                            <div className="grid gap-4 md:grid-cols-2">
                                <TaskList title="Custom tasks" items={data.custom_tasks} />
                                <TaskList title="Missed tasks" items={data.missed_tasks} />
                            </div>
                        )}
                        {section === 'feedback' && <FeedbackSection feedbacks={data.feedbacks} />}
                    </>
                )}
            </div>
        </StandardDialog>
    );
};
