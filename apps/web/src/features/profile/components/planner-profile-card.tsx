import React, { useState } from 'react';
import {
    DEEP_WORK_LABELS, FREE_TIME_LABELS,
    getSituationStatuses, situationSummary,
} from '@llb/core';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';
import { PersonalizationQuiz } from './personalization-quiz';

const readLabel = 'text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1';

const Read: React.FC<{ label: string; children: React.ReactNode; capitalize?: boolean }> = ({ label, children, capitalize }) => (
    <div>
        <p className={readLabel}>{label}</p>
        <p className={`text-sm font-medium ${capitalize ? 'capitalize' : ''}`}>{children}</p>
    </div>
);

/**
 * Everything personal (situation, time, sleep, energy, planning week, focus style) comes from the quiz, so this card
 * only shows the current answers and offers a retake for when life changes. Theme is the one setting kept separate.
 */
export const PlannerProfileCard: React.FC = () => {
    const { user } = useAuth();
    const { profile, saveProfile, isSaving } = useUserProfile(user);
    const [quizOpen, setQuizOpen] = useState(false);

    const ep = profile?.executionProfile;
    const taken = !!ep?.completedAt;
    const statuses = getSituationStatuses(ep);

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6 space-y-5 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold">Planner Profile</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground max-w-xl">
                        {taken
                            ? 'Your plans, time blocks and balance targets are built from your quiz answers. Retake it when your life changes.'
                            : 'A few honest answers make every plan fit your real life. It takes about three minutes.'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setQuizOpen(true)}
                    className="llb-btn llb-btn-auto inline-flex h-9 items-center justify-center rounded-lg bg-[#D2A226] px-4 text-xs font-extrabold text-black shadow-lg shadow-[#D2A226]/15 hover:bg-[#e9c468]"
                >
                    {taken ? 'Retake' : 'Take the quiz'}
                </button>
            </div>

            {taken && (
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-5 animate-in fade-in duration-300">
                    <Read label="Situation">{statuses.length ? situationSummary(statuses) : 'Not set'}</Read>
                    <Read label="Main focus">{profile?.primaryLifeFocus || 'Not set'}</Read>
                    <Read label="Free hours per weekday">{profile?.dailyFreeHours || 'Not set'}</Read>
                    <Read label="Weekend free time">{ep?.situation?.weekendFree ? FREE_TIME_LABELS[ep.situation.weekendFree] : '-'}</Read>
                    <Read label="Sleep">{profile?.sleepStart || '22:00'} ({profile?.sleepDuration || '8'}h)</Read>
                    <Read label="Energy peak">{profile?.energyPeakTime || 'Morning'}</Read>
                    <Read label="Planning">{profile?.planDay || 'Sunday'} {profile?.planStartTime || '21:00'} - {profile?.planEndTime || '22:00'}</Read>
                    <Read label="Week starts">{profile?.weekStart || 'Monday'}</Read>
                    <Read label="Deep work">{ep?.capacity?.deepWorkMin ? DEEP_WORK_LABELS[ep.capacity.deepWorkMin] : '-'}</Read>
                    <Read label="Schedule style" capitalize>{ep?.style?.structure ?? '-'}</Read>
                    <Read label="Biggest challenge">{profile?.biggestChallenge || 'Not set'}</Read>
                </div>
            )}

            <div className="pt-4 border-t border-border">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={!!profile?.marketingOptIn}
                        disabled={isSaving}
                        onChange={(e) => saveProfile({ marketingOptIn: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded accent-primary"
                    />
                    <span className="space-y-0.5">
                        <span className="block text-sm font-bold">Product emails</span>
                        <span className="block text-xs text-muted-foreground">Planning tips, product updates and offers. You can unsubscribe anytime.</span>
                    </span>
                </label>
            </div>

            <PersonalizationQuiz isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
        </div>
    );
};
