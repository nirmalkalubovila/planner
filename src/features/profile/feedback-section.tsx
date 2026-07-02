import React, { useState, useEffect } from 'react';
import { MessageSquarePlus, Send, Bug, Lightbulb, MessageCircle, HelpCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubmitFeedback } from '@/api/services/feedback-service';
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from '@/features/admin/admin-constants';
import { useAuth } from '@/contexts/auth-context';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/api/services/profile-service';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_ICONS: Record<FeedbackCategory, React.ReactNode> = {
    'Bug Report': <Bug className="h-3.5 w-3.5" />,
    'Feature Request': <Lightbulb className="h-3.5 w-3.5" />,
    'About Legacy Life Builder': <MessageCircle className="h-3.5 w-3.5" />,
    'Other': <HelpCircle className="h-3.5 w-3.5" />,
};

export const FeedbackSection: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [category, setCategory] = useState<FeedbackCategory>('About Legacy Life Builder');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(5);
    
    // Showcase consent details states
    const [authorName, setAuthorName] = useState('');
    const [authorPosition, setAuthorPosition] = useState('');
    const [consentToShow, setConsentToShow] = useState(false);

    const { profile } = useUserProfile(user);
    const submitFeedback = useSubmitFeedback();

    useEffect(() => {
        if (profile) {
            setAuthorName(profile.fullName || '');
            setAuthorPosition(profile.currentProfession || '');
        }
    }, [profile?.fullName, profile?.currentProfession]);

    const handleSubmit = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!subject.trim() || !message.trim()) return;
        await submitFeedback.mutateAsync({
            category,
            subject: subject.trim(),
            message: message.trim(),
            rating: category === 'About Legacy Life Builder' ? rating : undefined,
            author_name: consentToShow ? authorName.trim() : null,
            author_position: consentToShow ? authorPosition.trim() : null,
            consent_to_show: consentToShow
        });
        setSubject('');
        setMessage('');
        setCategory('About Legacy Life Builder');
        setRating(5);
        setConsentToShow(false);
        if (profile) {
            setAuthorName(profile.fullName || '');
            setAuthorPosition(profile.currentProfession || '');
        }
    };

    const canSubmit = !user || (subject.trim().length > 0 && message.trim().length > 0 && !submitFeedback.isPending);

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6 space-y-5">
            <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                    <MessageSquarePlus className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <h3 className="text-base font-bold">Send Feedback</h3>
                    <p className="text-[11px] text-muted-foreground">Report bugs, request features, or share your thoughts</p>
                </div>
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
                {FEEDBACK_CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => {
                            setCategory(cat);
                            if (cat !== 'About Legacy Life Builder') {
                                setRating(5);
                            }
                        }}
                        className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border
                            ${category === cat
                                ? 'bg-primary/15 text-primary border-primary/30 shadow-sm'
                                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                            }
                        `}
                    >
                        {CATEGORY_ICONS[cat]}
                        {cat}
                    </button>
                ))}
            </div>

            {/* Star Rating - Only for About Legacy Life Builder */}
            {category === 'About Legacy Life Builder' && (
                <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-xl border border-border/55">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rate Legacy Life Builder</span>
                    <div className="flex gap-1.5 items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`h-5 w-5 cursor-pointer ${
                                        star <= rating
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-zinc-700 hover:text-zinc-500'
                                    }`}
                                />
                            </button>
                        ))}
                        <span className="ml-2 text-xs font-bold text-zinc-400 font-mono">
                            {rating} / 5
                        </span>
                    </div>
                </div>
            )}

            {/* Subject */}
            <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief subject..."
                className="h-10 rounded-xl bg-muted border-border"
                maxLength={120}
            />

            {/* Message */}
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue or share your feedback..."
                rows={4}
                maxLength={2000}
                className="flex w-full rounded-xl border border-input bg-muted px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />

            {/* Public Showcase Consent */}
            {user && (
                <div className="bg-muted/25 border border-border/60 rounded-xl p-4 space-y-3.5">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={consentToShow}
                            onChange={(e) => setConsentToShow(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary focus:ring-offset-zinc-900 accent-primary"
                        />
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-foreground">
                                Allow showcasing this feedback on the landing page
                            </span>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Share your thoughts with the community! If selected, your testimonial can be featured on our public Wall of Love.
                            </p>
                        </div>
                    </label>

                    <AnimatePresence initial={false}>
                        {consentToShow && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden space-y-3 pt-2.5 border-t border-border/40"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Display Name
                                        </label>
                                        <Input
                                            value={authorName}
                                            onChange={(e) => setAuthorName(e.target.value)}
                                            placeholder="Your public name (e.g. David K.)"
                                            className="h-9 rounded-lg bg-muted/60 border-border"
                                            maxLength={50}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Display Position
                                        </label>
                                        <Input
                                            value={authorPosition}
                                            onChange={(e) => setAuthorPosition(e.target.value)}
                                            placeholder="Your role (e.g. Builder, Founder)"
                                            className="h-9 rounded-lg bg-muted/60 border-border"
                                            maxLength={60}
                                        />
                                    </div>
                                </div>
                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-primary/80 block mb-1">
                                        Live Preview
                                    </span>
                                    <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-lg p-3 text-[11px]">
                                        <p className="text-zinc-300 italic mb-2">
                                            "{message || "Your feedback message..."}"
                                        </p>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white">
                                                {authorName || "Anonymous"}
                                            </span>
                                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
                                                {authorPosition || (category === "About Legacy Life Builder" ? "Builder" : category)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                    {message.length}/2000
                </span>
                <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="h-9 rounded-xl px-5 font-semibold gap-2"
                >
                    {!user ? (
                        <>
                            Log in to Submit Feedback
                        </>
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

