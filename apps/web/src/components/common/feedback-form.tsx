import React, { useState, useEffect } from 'react';
import { Send, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useSubmitFeedback, useUserProfile } from '@llb/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FeedbackFormProps {
    /** Pre-filled headline (e.g. "Update 2.1 Feedback"). Users can still edit it. */
    defaultSubject?: string;
    /** Start with "show on landing page" ticked. */
    defaultConsent?: boolean;
    /** Tighter spacing and a shorter message box, for use inside modals. */
    compact?: boolean;
    onSubmitted?: () => void;
}

/**
 * The single feedback form used everywhere in the app. It always collects a review of the system
 * (rating + headline + message) and, with consent, a public display name and role so the admin can
 * put it on the landing page.
 */
export const FeedbackForm: React.FC<FeedbackFormProps> = ({ defaultSubject = '', defaultConsent = false, compact, onSubmitted }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { profile } = useUserProfile(user);
    const submitFeedback = useSubmitFeedback();

    const [rating, setRating] = useState(5);
    const [subject, setSubject] = useState(defaultSubject);
    const [message, setMessage] = useState('');
    const [consent, setConsent] = useState(defaultConsent);
    const [authorName, setAuthorName] = useState('');
    const [authorPosition, setAuthorPosition] = useState('');

    useEffect(() => {
        if (profile) {
            setAuthorName(profile.fullName || '');
            setAuthorPosition(profile.currentProfession || '');
        }
    }, [profile?.fullName, profile?.currentProfession]);

    const canSubmit = !user || (subject.trim().length > 0 && message.trim().length > 0 && !submitFeedback.isPending);

    const handleSubmit = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!subject.trim() || !message.trim()) return;
        await submitFeedback.mutateAsync({
            category: 'About Legacy Life Builder',
            subject: subject.trim(),
            message: message.trim(),
            rating,
            author_name: consent ? authorName.trim() : null,
            author_position: consent ? authorPosition.trim() : null,
            consent_to_show: consent,
        });
        setSubject(defaultSubject);
        setMessage('');
        setRating(5);
        setConsent(defaultConsent);
        onSubmitted?.();
    };

    return (
        <div className={compact ? 'space-y-3' : 'space-y-5'}>
            <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-xl border border-border/55">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rate Legacy Life Builder</span>
                <div className="flex gap-1.5 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} stars`} className="focus:outline-none transition-transform hover:scale-110">
                            <Star className={`h-5 w-5 cursor-pointer ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700 hover:text-zinc-500'}`} />
                        </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-zinc-400 font-mono">{rating} / 5</span>
                </div>
            </div>

            <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="A short headline for your review..."
                className="h-10 rounded-xl bg-muted border-border"
                maxLength={120}
            />

            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What do you think about the system? What helps, what is missing?"
                rows={compact ? 3 : 4}
                maxLength={2000}
                className="flex w-full rounded-xl border border-input bg-muted px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />

            {user && (
                <div className="bg-muted/25 border border-border/60 rounded-xl p-4 space-y-3.5">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary focus:ring-offset-zinc-900 accent-primary"
                        />
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-foreground">Allow showcasing this review on the landing page</span>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                If selected, your review may be featured publicly with the name and role below.
                            </p>
                        </div>
                    </label>

                    <AnimatePresence initial={false}>
                        {consent && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-hidden pt-2.5 border-t border-border/40"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Display Name</label>
                                        <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="e.g. David K." className="h-9 rounded-lg bg-muted/60 border-border" maxLength={50} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Display Role</label>
                                        <Input value={authorPosition} onChange={(e) => setAuthorPosition(e.target.value)} placeholder="e.g. Founder, Student" className="h-9 rounded-lg bg-muted/60 border-border" maxLength={60} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{message.length}/2000</span>
                <Button onClick={handleSubmit} disabled={!canSubmit} className="h-9 rounded-xl px-5 font-semibold gap-2">
                    {!user ? (
                        <>Log in to Submit Feedback</>
                    ) : submitFeedback.isPending ? (
                        <>
                            <div className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="h-3.5 w-3.5" />
                            Submit Feedback
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
