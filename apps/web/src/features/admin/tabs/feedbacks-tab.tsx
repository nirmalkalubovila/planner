import React, { useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Globe, EyeOff, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import {
    useAdminFeedbacks, useAdminUpdateFeedback, useAdminDeleteFeedback, useAdminUsersActivity, type Feedback,
} from '@/api/services/feedback-service';
import { FEEDBACK_STATUSES, type FeedbackStatus } from '../admin-constants';
import { StatusDropdown } from '../components/status-dropdown';
import { TestimonialDialog } from '../components/testimonial-dialog';

type View = 'all' | 'landing' | 'pending' | 'legacy';

const REVIEW_CATEGORY = 'About Legacy Life Builder';

const VIEWS: { key: View; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'landing', label: 'On landing page' },
    { key: 'pending', label: 'Not published' },
    { key: 'legacy', label: 'Legacy (bug / idea / other)' },
];

const pill = (active: boolean) =>
    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${active ? 'bg-primary/15 text-primary border-primary/30' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`;

export const FeedbacksTab: React.FC = () => {
    const { data: feedbacks, isLoading } = useAdminFeedbacks();
    const { data: users } = useAdminUsersActivity();
    const updateFeedback = useAdminUpdateFeedback();
    const deleteFeedback = useAdminDeleteFeedback();

    const [search, setSearch] = useState('');
    const [view, setView] = useState<View>('all');
    const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');
    const [editing, setEditing] = useState<Feedback | null>(null);
    const [creating, setCreating] = useState(false);
    const [toDelete, setToDelete] = useState<Feedback | null>(null);
    const [toPublish, setToPublish] = useState<Feedback | null>(null);

    const userById = useMemo(() => new Map((users ?? []).map((u) => [u.user_id, u])), [users]);

    const counts = useMemo(() => {
        const all = feedbacks ?? [];
        return {
            all: all.length,
            landing: all.filter((f) => f.show_on_landing).length,
            pending: all.filter((f) => f.category === REVIEW_CATEGORY && !f.show_on_landing).length,
            legacy: all.filter((f) => f.category !== REVIEW_CATEGORY).length,
        } satisfies Record<View, number>;
    }, [feedbacks]);

    const filtered = (feedbacks ?? []).filter((f) => {
        const q = search.toLowerCase();
        const author = userById.get(f.user_id);
        const matchSearch = !q ||
            f.subject.toLowerCase().includes(q) ||
            f.message.toLowerCase().includes(q) ||
            (f.author_name ?? '').toLowerCase().includes(q) ||
            (author?.email ?? '').toLowerCase().includes(q);
        const matchStatus = filterStatus === 'all' || f.status === filterStatus;
        const matchView =
            view === 'all' ? true :
            view === 'landing' ? !!f.show_on_landing :
            view === 'pending' ? f.category === REVIEW_CATEGORY && !f.show_on_landing :
            f.category !== REVIEW_CATEGORY;
        return matchSearch && matchStatus && matchView;
    });

    const setLanding = (f: Feedback, show: boolean) => updateFeedback.mutate({ id: f.id, show_on_landing: show });

    const handleToggleLanding = (f: Feedback) => {
        if (f.show_on_landing) return setLanding(f, false);
        // Publishing without the author's consent needs an explicit admin decision
        if (!f.consent_to_show) return setToPublish(f);
        setLanding(f, true);
    };

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
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by headline, message, name or email..."
                        className="h-10 pl-9 rounded-xl bg-muted border-border"
                    />
                </div>
                <Button onClick={() => setCreating(true)} className="h-10 rounded-xl gap-1.5">
                    <Plus className="h-4 w-4" /> Add testimonial
                </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                    {VIEWS.map((v) => (
                        <button key={v.key} onClick={() => setView(v.key)} className={pill(view === v.key)}>
                            {v.label} <span className="opacity-60">({counts[v.key]})</span>
                        </button>
                    ))}
                </div>
                <div className="flex gap-1.5">
                    {(['all', ...FEEDBACK_STATUSES] as const).map((s) => (
                        <button key={s} onClick={() => setFilterStatus(s)} className={pill(filterStatus === s)}>
                            {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No feedbacks found</div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((f) => {
                        const author = userById.get(f.user_id);
                        return (
                            <div key={f.id} className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-5 space-y-3 transition-all duration-200 hover:border-primary/10">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                                {f.category === REVIEW_CATEGORY ? 'Review' : f.category}
                                            </span>
                                            {typeof f.rating === 'number' && f.rating > 0 && (
                                                <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <Star className="h-2.5 w-2.5 fill-amber-400" /> {f.rating}/5
                                                </span>
                                            )}
                                            {f.tag && <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">{f.tag}</span>}
                                            {f.is_verified && <span className="text-[9px] font-black uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">Verified</span>}
                                            {f.show_on_landing && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1"><Globe className="h-2.5 w-2.5" /> On landing</span>}
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${f.consent_to_show ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}`}>
                                                {f.consent_to_show ? 'Consent given' : 'No consent'}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-bold truncate">{f.subject}</h4>
                                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                            {f.author_name ? `${f.author_name}${f.author_position ? ` | ${f.author_position}` : ''}` : (author?.full_name || 'Anonymous')}
                                            {author?.email ? ` - ${author.email}` : ''}
                                        </p>
                                    </div>
                                    <StatusDropdown feedbackId={f.id} currentStatus={f.status} />
                                </div>

                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{f.message}</p>

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                    <span className="text-[10px] text-muted-foreground/60">
                                        {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {f.category === REVIEW_CATEGORY && (
                                            <Button
                                                size="sm"
                                                variant={f.show_on_landing ? 'outline' : 'default'}
                                                onClick={() => handleToggleLanding(f)}
                                                disabled={updateFeedback.isPending}
                                                className="h-8 rounded-lg text-xs gap-1.5"
                                            >
                                                {f.show_on_landing ? <><EyeOff className="h-3.5 w-3.5" /> Remove from landing</> : <><Globe className="h-3.5 w-3.5" /> Show on landing</>}
                                            </Button>
                                        )}
                                        <Button size="sm" variant="ghost" onClick={() => setEditing(f)} className="h-8 rounded-lg text-xs gap-1.5">
                                            <Pencil className="h-3.5 w-3.5" /> Edit
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => setToDelete(f)} className="h-8 w-8 text-destructive hover:bg-destructive/15" aria-label="Delete feedback">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <TestimonialDialog isOpen={creating} onClose={() => setCreating(false)} feedback={null} />
            <TestimonialDialog isOpen={!!editing} onClose={() => setEditing(null)} feedback={editing} />

            <ConfirmationDialog
                isOpen={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={() => { if (toDelete) deleteFeedback.mutate(toDelete.id); setToDelete(null); }}
                title="Delete this feedback?"
                description="This permanently removes it, including from the landing page. This cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
            <ConfirmationDialog
                isOpen={!!toPublish}
                onClose={() => setToPublish(null)}
                onConfirm={() => { if (toPublish) setLanding(toPublish, true); setToPublish(null); }}
                title="Publish without consent?"
                description="This user did not tick 'allow showcasing'. Only publish it if you have their permission."
                confirmText="Publish anyway"
            />
        </div>
    );
};
