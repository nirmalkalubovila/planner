import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile, useGetGoals } from '@llb/api';
import { isProfileIncomplete } from '@/features/auth/complete-profile-modal';
import { ExecutionProfileDialog } from './execution-profile-dialog';

const SNOOZE_KEY = 'llb:execution-profile-snoozed-at';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

const isSnoozed = (): boolean => {
    try {
        const at = Number(localStorage.getItem(SNOOZE_KEY));
        return !!at && Date.now() - at < SNOOZE_MS;
    } catch {
        return false;
    }
};

/**
 * Non-blocking offer to take the Execution Profile assessment. Shows once the user has created a
 * goal, never on top of the onboarding / complete-profile modals, and is snoozed for 7 days when dismissed.
 */
export const ExecutionProfilePrompt: React.FC = () => {
    const { user } = useAuth();
    const { profile, isLoading } = useUserProfile(user);
    const { data: goals } = useGetGoals();
    const [dismissed, setDismissed] = useState(isSnoozed);

    const eligible =
        !!user && !isLoading && !!profile?.isPersonalized && !isProfileIncomplete(profile) &&
        (goals?.length ?? 0) > 0 && !profile.executionProfile?.completedAt;

    const handleClose = () => {
        setDismissed(true);
        try {
            localStorage.setItem(SNOOZE_KEY, String(Date.now()));
        } catch {
            // storage unavailable - the prompt just won't be remembered
        }
    };

    return <ExecutionProfileDialog isOpen={eligible && !dismissed} onClose={handleClose} />;
};
