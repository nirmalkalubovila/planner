import React, { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useSubmitFeedback, useUserProfile } from '@llb/api';
import { Button } from '@/components/ui/button';
import { OptionChips } from '@/components/common/option-chips';

// What people usually like, what problem it solved, and what to improve. Tapping a chip writes the sentence for them.
const LIKES = [
    { value: 'consistent', label: 'Keeps me consistent', phrase: 'keeps me consistent', headline: 'It keeps me consistent' },
    { value: 'plans', label: 'Plans my day for me', phrase: 'plans my day for me', headline: 'My day is planned for me' },
    { value: 'steps', label: 'Breaks big goals into steps', phrase: 'breaks big goals into clear steps', headline: 'Big goals became clear steps' },
    { value: 'oneplace', label: 'Goals and habits in one place', phrase: 'keeps my goals and habits in one place', headline: 'Everything in one place' },
    { value: 'ai', label: 'AI plan fits my life', phrase: 'builds plans that fit my life', headline: 'A plan that fits my life' },
    { value: 'finish', label: 'Makes me finish things', phrase: 'makes me finish what I start', headline: 'I finish what I start' },
] as const;

const PROBLEMS = [
    { value: 'restart', label: 'I kept starting over', phrase: 'I kept starting over' },
    { value: 'overplan', label: 'Planning took all my time', phrase: 'planning took more time than doing' },
    { value: 'unclear', label: 'I never knew what to do today', phrase: 'I never knew what to do each day' },
    { value: 'big', label: 'My goals felt too big', phrase: 'my goals felt too big to start' },
    { value: 'habits', label: 'I lost track of habits', phrase: 'I kept losing track of my habits' },
] as const;

const IMPROVE = [
    { value: 'complex', label: 'Too complicated', phrase: 'it feels too complicated' },
    { value: 'feature', label: 'Missing a feature', phrase: 'a feature I need is missing' },
    { value: 'bugs', label: 'Slow or buggy', phrase: 'it is slow or buggy' },
    { value: 'start', label: 'Unclear how to start', phrase: 'it is unclear how to start' },
    { value: 'fit', label: 'Plans did not fit me', phrase: 'the plans did not fit me' },
] as const;

const MIN_LENGTH = 15;
const MAX_LIKES = 3;

const joinPhrases = (items: string[]) =>
    items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

interface FeedbackFormProps {
    /** Kept for callers that pass a context title; the headline is now written from the chosen suggestions. */
    defaultSubject?: string;
    /** Start with "show on landing page" ticked. */
    defaultConsent?: boolean;
    /** Tighter spacing and a shorter message box, for use inside modals. */
    compact?: boolean;
    onSubmitted?: () => void;
}

/**
 * The single feedback form. Tap what you liked and what problem it fixed and the form writes a real sentence
 * for you (editable), so a good testimonial takes seconds. Happy reviews can be shown on the landing page,
 * with the name, role and, separately, the photo the user agrees to show.
 */
export const FeedbackForm: React.FC<FeedbackFormProps> = ({ defaultConsent = false, compact, onSubmitted }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { profile } = useUserProfile(user);
    const submitFeedback = useSubmitFeedback();

    const [rating, setRating] = useState(5);
    const [likes, setLikes] = useState<string[]>([]);
    const [problem, setProblem] = useState<string | undefined>();
    const [improve, setImprove] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [messageTouched, setMessageTouched] = useState(false);
    const [consent, setConsent] = useState(defaultConsent);

    const happy = rating >= 4;
    const avatarUrl = profile?.avatarUrl || '';

    // Shown publicly exactly as it is in the profile, so there is nothing to type
    const authorName = (profile?.fullName || '').trim();
    const authorPosition = (profile?.currentProfession || '').trim();
    const shownAs = [authorName || 'A Legacy Builder', authorPosition].filter(Boolean).join(', ');

    // Writes the sentence and headline from the chips until the user types their own
    const suggested = useMemo(() => {
        if (happy) {
            const liked = LIKES.filter((l) => likes.includes(l.value));
            const prob = PROBLEMS.find((p) => p.value === problem);
            const parts: string[] = [];
            if (prob) parts.push(`Before, ${prob.phrase}.`);
            if (liked.length) parts.push(`Now Legacy Life Builder ${joinPhrases(liked.map((l) => l.phrase))}.`);
            return { text: parts.join(' '), headline: liked[0]?.headline ?? 'Helped me get things done' };
        }
        const chosen = IMPROVE.filter((i) => improve.includes(i.value));
        return {
            text: chosen.length ? `What to fix: ${joinPhrases(chosen.map((c) => c.phrase))}.` : '',
            headline: 'Feedback to improve',
        };
    }, [happy, likes, problem, improve]);

    useEffect(() => {
        if (!messageTouched) setMessage(suggested.text);
    }, [suggested, messageTouched]);

    const toggleLike = (value: string) =>
        setLikes((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : cur.length >= MAX_LIKES ? cur : [...cur, value]));
    const toggleImprove = (value: string) => setImprove((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]));

    const longEnough = message.trim().length >= MIN_LENGTH;
    const canSubmit = !user || (longEnough && !submitFeedback.isPending);
    const showConsent = !!user && happy;

    const handleSubmit = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!longEnough) return;
        const publish = showConsent && consent;
        await submitFeedback.mutateAsync({
            category: 'About Legacy Life Builder',
            subject: suggested.headline,
            message: message.trim(),
            rating,
            author_name: publish ? authorName.trim() : null,
            author_position: publish ? authorPosition.trim() : null,
            consent_to_show: publish,
            avatar_url: publish && avatarUrl ? avatarUrl : null,
        });
        setLikes([]);
        setProblem(undefined);
        setImprove([]);
        setMessage('');
        setMessageTouched(false);
        setRating(5);
        setConsent(defaultConsent);
        onSubmitted?.();
    };

    const label = 'text-[10px] font-bold text-muted-foreground uppercase tracking-wider';

    return (
        <div className={compact ? 'space-y-4' : 'space-y-5'}>
            {/* 1. Rating, with an immediate, human reaction */}
            <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-xl border border-border/55">
                <span className={label}>How is Legacy Life Builder working for you?</span>
                <div className="flex gap-1.5 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} stars`} className="focus:outline-none transition-transform hover:scale-110">
                            <Star className={`h-6 w-6 cursor-pointer ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700 hover:text-zinc-500'}`} />
                        </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-zinc-400 font-mono">{rating} / 5</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    {happy ? 'Glad it is working for you. Two taps and a sentence is all it takes.' : 'Sorry it fell short. Tell us what to fix.'}
                </p>
            </div>

            {/* 2. Suggestions */}
            {happy ? (
                <>
                    <div className="space-y-2">
                        <p className={label}>What do you like most? <span className="normal-case font-medium">(pick up to {MAX_LIKES})</span></p>
                        <OptionChips
                            className="grid-cols-1 sm:grid-cols-2"
                            value={likes}
                            onChange={toggleLike}
                            options={LIKES.map((l) => ({ value: l.value, label: l.label }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <p className={label}>What problem did it fix?</p>
                        <OptionChips
                            className="grid-cols-1 sm:grid-cols-2"
                            value={problem}
                            onChange={(v) => setProblem(problem === v ? undefined : v)}
                            options={PROBLEMS.map((p) => ({ value: p.value, label: p.label }))}
                        />
                    </div>
                </>
            ) : (
                <div className="space-y-2">
                    <p className={label}>What should we improve?</p>
                    <OptionChips
                        className="grid-cols-1 sm:grid-cols-2"
                        value={improve}
                        onChange={toggleImprove}
                        options={IMPROVE.map((i) => ({ value: i.value, label: i.label }))}
                    />
                </div>
            )}

            {/* 3. The sentence: written for them, editable */}
            <div className="space-y-2">
                <p className={label}>{happy ? 'How has it helped you get things done?' : 'Anything else?'}</p>
                <textarea
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); setMessageTouched(true); }}
                    rows={compact ? 3 : 4}
                    maxLength={1000}
                    placeholder={happy ? 'Tap a suggestion above, or write it in your own words.' : 'Tell us what happened and what you expected.'}
                    className="flex w-full rounded-xl border border-input bg-muted px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className={longEnough ? '' : 'text-primary'}>{longEnough ? 'Looks good' : `A sentence or two is enough (${Math.max(0, MIN_LENGTH - message.trim().length)} more characters)`}</span>
                    <span>{message.length}/1000</span>
                </div>
            </div>

            {/* 4. Permission to feature them */}
            {showConsent && (
                <label className="flex items-start gap-3 cursor-pointer select-none bg-muted/25 border border-border/60 rounded-xl p-4">
                    <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary focus:ring-offset-zinc-900 accent-primary"
                    />
                    <div className="space-y-2 min-w-0">
                        <span className="block text-xs font-semibold text-foreground">
                            Show my review on the landing page, with my name, role{avatarUrl ? ' and photo' : ''}
                        </span>
                        <div className="flex items-center gap-2.5">
                            {avatarUrl && <img src={avatarUrl} alt="" className={`h-8 w-8 rounded-full object-cover border border-border transition ${consent ? '' : 'opacity-40 grayscale'}`} />}
                            <p className="text-[11px] text-muted-foreground leading-snug">
                                Shown as <span className="text-foreground font-semibold">{shownAs}</span>. You can ask us to remove it any time.
                            </p>
                        </div>
                    </div>
                </label>
            )}

            <div className="flex items-center justify-end">
                <Button onClick={handleSubmit} disabled={!canSubmit} className="h-10 rounded-xl px-6 font-semibold">
                    {!user ? 'Log in to send feedback' : submitFeedback.isPending ? 'Sending...' : 'Send feedback'}
                </Button>
            </div>
        </div>
    );
};
