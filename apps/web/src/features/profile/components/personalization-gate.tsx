import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';
import { PersonalizationQuiz } from './personalization-quiz';
import { isProfileIncomplete, quizNotCompleted } from '../lib/personalization';

const SNOOZE_KEY = 'llb:quiz-snoozed-at';
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

const isSnoozed = (): boolean => {
    try {
        const at = Number(localStorage.getItem(SNOOZE_KEY));
        return !!at && Date.now() - at < SNOOZE_MS;
    } catch {
        return false;
    }
};

/**
 * Shows the personalization quiz to anyone who has not finished it. A new user cannot close it until the
 * essentials are saved, because the planner is not useful without them. After that, "Maybe later" hides it for
 * three days, and it returns until it is finished.
 */
export const PersonalizationGate: React.FC = () => {
    const { user } = useAuth();
    const { profile, isLoading } = useUserProfile(user);
    const [dismissed, setDismissed] = useState(isSnoozed);
    // Once the quiz has opened it stays open until the user closes it, so the finished screen is not cut short
    // when saving the last step marks the quiz as completed.
    const [started, setStarted] = useState(false);

    const essentialsMissing = isProfileIncomplete(profile);
    const due = !!user && !isLoading && !!profile && quizNotCompleted(profile) && (essentialsMissing || !dismissed);

    useEffect(() => {
        if (due) setStarted(true);
    }, [due]);

    const open = started || due;

    const handleClose = () => {
        setStarted(false);
        setDismissed(true);
        try {
            localStorage.setItem(SNOOZE_KEY, String(Date.now()));
        } catch {
            // storage unavailable: the quiz simply is not remembered as snoozed
        }
    };

    return <PersonalizationQuiz isOpen={open} onClose={handleClose} required={essentialsMissing} />;
};
