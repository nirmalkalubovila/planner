import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Sparkles, X, Check, ExternalLink, Star, Send, MessageSquareCheck } from 'lucide-react';
import { useLatestUpdate } from '@/hooks/use-latest-update';
import { useLandingSettings, useSubmitFeedback } from '@/api/services/feedback-service';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/api/services/profile-service';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const RATING_LABELS: Record<number, string> = {
    1: 'Needs Work',
    2: 'Fair',
    3: 'Good',
    4: 'Great',
    5: 'Exceptional',
};

export const AnnouncementBanner: React.FC = () => {
    const { data: latestUpdate } = useLatestUpdate();
    const { data: landingSettings } = useLandingSettings();
    const { user } = useAuth();
    const { profile } = useUserProfile(user);
    const submitFeedbackMutation = useSubmitFeedback();

    const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const navigate = useNavigate();

    // Feedback collector states
    const [rating, setRating] = useState<number>(5);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [feedbackNote, setFeedbackNote] = useState('');
    const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);

    useEffect(() => {
        setDismissedVersion(localStorage.getItem('dismissed_update_version'));
    }, []);

    useEffect(() => {
        if (latestUpdate?.version) {
            const hasSubmitted = localStorage.getItem(`update_feedback_submitted_${latestUpdate.version}`);
            setIsFeedbackSubmitted(Boolean(hasSubmitted));
        }
    }, [latestUpdate?.version]);

    const maintenanceMode = landingSettings?.maintenance_mode ?? false;
    const hasNewUpdate = latestUpdate && latestUpdate.version !== dismissedVersion;

    if (!maintenanceMode && !hasNewUpdate) return null;

    const handleMarkAsRead = () => {
        if (latestUpdate) {
            localStorage.setItem('dismissed_update_version', latestUpdate.version);
            setDismissedVersion(latestUpdate.version);
        }
        setModalOpen(false);
    };

    const handleFeedbackSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!latestUpdate) return;

        if (!user) {
            toast.error('Please log in to submit your rating.');
            navigate('/login');
            return;
        }

        try {
            const noteText = feedbackNote.trim();
            const message = noteText.length > 0
                ? noteText
                : `User rated Update ${latestUpdate.version} (${latestUpdate.title}) with ${rating} out of 5 stars.`;

            await submitFeedbackMutation.mutateAsync({
                category: 'About Legacy Life Builder',
                subject: `Update ${latestUpdate.version} Feedback`,
                message,
                rating,
                author_name: profile?.fullName || null,
                author_position: profile?.currentProfession || null,
                consent_to_show: false,
            });

            localStorage.setItem(`update_feedback_submitted_${latestUpdate.version}`, `${rating}`);
            setIsFeedbackSubmitted(true);
            setFeedbackNote('');
        } catch (error) {
            // Handled by mutation toast
        }
    };

    // Render Maintenance Mode Warning
    if (maintenanceMode) {
        return (
            <div className="bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-md px-4 py-2 text-center text-xs font-semibold text-amber-400 select-none relative z-50 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(245,158,11,0.06)] animate-in slide-in-from-top duration-300">
                <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                <span>System Upgrade In Progress: We are performing database optimizations. Core features remain active but some actions might experience temporary delays.</span>
            </div>
        );
    }

    // Render Normal Update Announcement
    if (!latestUpdate) return null;

    // Parse description into pointwise items
    const bulletPoints = latestUpdate.description
        ? latestUpdate.description.split('\n').map(p => p.replace(/^[-\*\s\•]+/, '').trim()).filter(Boolean)
        : [];

    const activeRating = hoverRating ?? rating;

    return (
        <>
            {/* Top Banner - Fixed Single Line */}
            <div className="bg-primary/10 border-b border-primary/20 backdrop-blur-md px-3 sm:px-4 py-2 text-xs text-foreground select-none relative z-40 flex items-center justify-between gap-3 shadow-[0_4px_12px_rgba(var(--primary-rgb,99,102,241),0.05)] animate-in slide-in-from-top duration-300 w-full h-10 overflow-hidden whitespace-nowrap">
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <span className="flex h-2 w-2 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <Sparkles size={13} className="text-primary shrink-0 animate-pulse" />
                    <span className="font-bold tracking-tight text-xs truncate">
                        Update {latestUpdate.version}: {latestUpdate.title}
                    </span>
                </div>
                
                <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="px-2.5 py-0.5 my-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-white text-black hover:bg-white/90 transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
                >
                    What's New
                </button>
            </div>

            {/* Premium Full-Screen / Modal Experience */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                        {/* Overlay - Opaque so navbar and header are completely hidden */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setModalOpen(false)}
                            className="absolute inset-0 bg-[#06080E]/98 backdrop-blur-2xl cursor-pointer"
                        />

                        {/* Modal Panel Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            className="relative w-full max-w-lg max-h-[88vh] bg-card/95 border border-border/80 backdrop-blur-xl rounded-3xl p-4 sm:p-6 shadow-2xl z-10 flex flex-col gap-3.5 sm:gap-4 overflow-hidden select-none"
                        >
                            {/* Ambient background glow */}
                            <div className="absolute -top-10 -right-10 w-44 h-44 bg-primary/10 rounded-full blur-[70px] pointer-events-none" />
                            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />

                            {/* Header */}
                            <div className="flex justify-between items-start gap-4 shrink-0 relative z-10">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">
                                        <Sparkles size={10} />
                                        <span>Release Notes</span>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground uppercase leading-tight pt-1">
                                        Version {latestUpdate.version}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="p-2 rounded-2xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border/50 shrink-0"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            {/* Title & Date Banner */}
                            <div className="p-3 sm:p-3.5 rounded-2xl bg-muted/20 border border-border/60 space-y-0.5 sm:space-y-1 shrink-0 relative z-10">
                                <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                                    {latestUpdate.title}
                                </h4>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                    Released {new Date(latestUpdate.release_date).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Scrollable Container (Notes + Feedback Collector) */}
                            <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0 relative z-10 py-1">
                                {/* Point-wise Release Notes */}
                                {bulletPoints.length > 0 ? (
                                    <div className="space-y-2">
                                        {bulletPoints.map((point, index) => (
                                            <div 
                                                key={index} 
                                                className="flex gap-2.5 items-start p-2.5 rounded-xl bg-card/60 border border-border/40 text-[11px] leading-relaxed text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
                                            >
                                                <div className="p-1 rounded-lg bg-primary/15 text-primary shrink-0 mt-0.5 border border-primary/20">
                                                    <Check size={10} strokeWidth={2.5} />
                                                </div>
                                                <span className="font-normal">{point}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line p-2">
                                        {latestUpdate.description}
                                    </p>
                                )}

                                {/* Feedback Collector Section */}
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-3 relative overflow-hidden">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                                                <Sparkles size={11} />
                                                How Does This Update Feel?
                                            </span>
                                            <p className="text-[10px] text-muted-foreground">
                                                Rate your experience and let us know your thoughts
                                            </p>
                                        </div>
                                        {isFeedbackSubmitted && (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                                                <Check size={10} />
                                                Submitted
                                            </span>
                                        )}
                                    </div>

                                    {isFeedbackSubmitted ? (
                                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-300">
                                            <MessageSquareCheck size={16} className="text-emerald-400 shrink-0" />
                                            <div className="text-[11px] leading-tight">
                                                <p className="font-bold text-foreground">Thank you for your feedback!</p>
                                                <p className="text-muted-foreground mt-0.5">Your rating helps us continue perfecting Legacy Life Builder.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Star Rating Controls */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-background/50 border border-border/50">
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setRating(star)}
                                                            onMouseEnter={() => setHoverRating(star)}
                                                            onMouseLeave={() => setHoverRating(null)}
                                                            className="p-1 rounded-lg hover:bg-muted/80 transition-transform active:scale-90 cursor-pointer"
                                                            title={`${star} out of 5 - ${RATING_LABELS[star]}`}
                                                        >
                                                            <Star
                                                                size={18}
                                                                className={`transition-colors ${
                                                                    star <= activeRating
                                                                        ? 'fill-amber-400 text-amber-400'
                                                                        : 'text-zinc-600 hover:text-zinc-400'
                                                                }`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="flex items-center gap-2 text-right">
                                                    <span className="text-[11px] font-bold text-foreground">
                                                        {RATING_LABELS[activeRating] || 'Great'}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
                                                        {activeRating} / 5
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Small Note Input */}
                                            <div className="space-y-1.5">
                                                <textarea
                                                    value={feedbackNote}
                                                    onChange={(e) => setFeedbackNote(e.target.value)}
                                                    placeholder="Add a small note or impression (optional)..."
                                                    maxLength={280}
                                                    rows={2}
                                                    className="w-full text-xs rounded-xl bg-background/60 border border-border/70 p-2.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 resize-none transition-colors"
                                                />
                                                <div className="flex items-center justify-between text-[9px] text-muted-foreground px-1">
                                                    <span>Keep it short and direct</span>
                                                    <span>{feedbackNote.length}/280</span>
                                                </div>
                                            </div>

                                            {/* Quick Submit Rating Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleFeedbackSubmit()}
                                                disabled={submitFeedbackMutation.isPending}
                                                className="w-full py-2 px-3 rounded-xl bg-muted/80 hover:bg-muted text-foreground hover:text-white border border-border/80 hover:border-primary/30 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                                            >
                                                {submitFeedbackMutation.isPending ? (
                                                    <>
                                                        <div className="h-3 w-3 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                                                        <span>Submitting...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send size={12} className="text-primary" />
                                                        <span>Submit Update Rating ({rating}/5)</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Action Area */}
                            <div className="space-y-3 shrink-0 pt-2 sm:pt-3 border-t border-border/60 relative z-10">
                                {/* Small subtle info bar */}
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 px-1">
                                    <a
                                        href="https://tiktok.com/@nirmal_kalubovila"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Follow on TikTok for updates
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => { setModalOpen(false); navigate('/profile?tab=updater'); }}
                                        className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer font-medium"
                                    >
                                        More info <ExternalLink size={9} />
                                    </button>
                                </div>

                                {/* Got it, Mark as Read Button */}
                                <button
                                    type="button"
                                    onClick={handleMarkAsRead}
                                    className="w-full py-3 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.01] hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-black/20 cursor-pointer"
                                >
                                    <Check size={14} strokeWidth={3} />
                                    <span>Got it, Mark as Read</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
