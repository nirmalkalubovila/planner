import React, { useState } from 'react';
import { MessageSquareQuote, Star } from 'lucide-react';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TestimonialCard } from '@/features/(public)/components/TestimonialCard';
import { useAdminCreateTestimonial, useAdminUpdateFeedback, type Feedback } from '@/api/services/feedback-service';

interface TestimonialDialogProps {
    isOpen: boolean;
    onClose: () => void;
    /** Existing feedback to edit; omit to create a new testimonial. */
    feedback?: Feedback | null;
}

const labelClass = 'text-[10px] font-bold text-muted-foreground uppercase tracking-wider';
const TEXTAREA_CLASS = 'flex min-h-[110px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none';

/**
 * Create or edit a testimonial. The right-hand preview is the real landing-page card, so what the
 * admin sees is exactly what visitors get. Saving with "Show on landing page" ticked publishes it immediately.
 */
export const TestimonialDialog: React.FC<TestimonialDialogProps> = (props) => {
    // Remount the form whenever the target changes so its state re-seeds from the feedback.
    return props.isOpen ? <TestimonialForm key={props.feedback?.id ?? 'new'} {...props} /> : null;
};

const TestimonialForm: React.FC<TestimonialDialogProps> = ({ isOpen, onClose, feedback }) => {
    const create = useAdminCreateTestimonial();
    const update = useAdminUpdateFeedback();
    const editing = !!feedback;

    const [subject, setSubject] = useState(feedback?.subject ?? '');
    const [message, setMessage] = useState(feedback?.message ?? '');
    const [name, setName] = useState(feedback?.author_name ?? '');
    const [role, setRole] = useState(feedback?.author_position ?? '');
    const [rating, setRating] = useState(feedback?.rating ?? 5);
    const [tag, setTag] = useState(feedback?.tag ?? '');
    const [avatarUrl, setAvatarUrl] = useState(feedback?.avatar_url ?? '');
    const [verified, setVerified] = useState(feedback?.is_verified ?? true);
    const [onLanding, setOnLanding] = useState(feedback?.show_on_landing ?? true);

    const valid = subject.trim() && message.trim() && name.trim();
    const saving = create.isPending || update.isPending;

    const handleSave = async () => {
        if (!valid) return;
        try {
            if (editing && feedback) {
                await update.mutateAsync({
                    id: feedback.id,
                    subject: subject.trim(),
                    message: message.trim(),
                    author_name: name.trim(),
                    author_position: role.trim(),
                    rating,
                    tag: tag.trim() || null,
                    avatar_url: avatarUrl.trim() || null,
                    is_verified: verified,
                    show_on_landing: onLanding,
                    // Publishing an edited review implies the admin has confirmed it can be shown
                    ...(onLanding ? { consent_to_show: true } : {}),
                });
            } else {
                await create.mutateAsync({
                    subject: subject.trim(),
                    message: message.trim(),
                    author_name: name.trim(),
                    author_position: role.trim(),
                    rating,
                    tag: tag.trim() || null,
                    avatar_url: avatarUrl.trim() || null,
                    is_verified: verified,
                    show_on_landing: onLanding,
                });
            }
            onClose();
        } catch {
            // Error toast is shown by the mutation
        }
    };

    return (
        <StandardDialog
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? 'Edit Testimonial' : 'Add Testimonial'}
            subtitle="Live preview matches the landing page"
            icon={MessageSquareQuote}
            maxWidth="6xl"
            closeOnBackdrop={false}
        >
            <div className="p-4 sm:p-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className={labelClass}>Headline</label>
                        <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} placeholder="One line that sums it up" className="h-10 rounded-xl bg-muted border-border" />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Message</label>
                        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} className={TEXTAREA_CLASS} placeholder="What they said" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Display name</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="e.g. Kanishka P." className="h-10 rounded-xl bg-muted border-border" />
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Role / company</label>
                            <Input value={role} onChange={(e) => setRole(e.target.value)} maxLength={60} placeholder="e.g. CEO | Export Manufacturing" className="h-10 rounded-xl bg-muted border-border" />
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Highlight tag (optional, gold card)</label>
                            <Input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={24} placeholder="e.g. APEX 360" className="h-10 rounded-xl bg-muted border-border" />
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Photo URL (optional)</label>
                            <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="h-10 rounded-xl bg-muted border-border" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Rating</label>
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} stars`}>
                                    <Star className={`h-5 w-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700 hover:text-zinc-500'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="h-4 w-4 accent-primary" />
                            Show VERIFIED badge
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                            <input type="checkbox" checked={onLanding} onChange={(e) => setOnLanding(e.target.checked)} className="h-4 w-4 accent-primary" />
                            Show on landing page
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={onClose} disabled={saving} className="h-9 text-xs">Cancel</Button>
                        <Button onClick={handleSave} disabled={!valid || saving} className="h-9 text-xs font-semibold">
                            {saving ? 'Saving...' : editing ? 'Save changes' : 'Add testimonial'}
                        </Button>
                    </div>
                </div>

                <div className="rounded-2xl bg-black p-4 overflow-x-auto">
                    <p className={`${labelClass} mb-3`}>Landing preview</p>
                    <TestimonialCard
                        className="!w-full sm:!w-full"
                        testimonial={{
                            subject: subject || 'Your headline',
                            message: message || 'The testimonial message appears here.',
                            rating,
                            author_name: name || 'Display name',
                            author_position: role || 'Role',
                            tag: tag.trim() || null,
                            avatar_url: avatarUrl.trim() || null,
                            is_verified: verified,
                        }}
                    />
                </div>
            </div>
        </StandardDialog>
    );
};
