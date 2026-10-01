import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';
import { isProfileIncomplete } from '@/features/auth/complete-profile-modal';
import { supabase } from '@/lib/supabaseClient';
import { hasPendingGoal, savePendingGoal } from './pending-goal';

/**
 * After signup + onboarding, sends a visitor who typed a goal on the landing page to the goals page,
 * where the New Goal form opens pre-filled. Waits until the onboarding modals are out of the way.
 */
export const PendingGoalRedirect: React.FC = () => {
    const { user } = useAuth();
    const { profile, isLoading } = useUserProfile(user);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    // A goal that came with the account (signup finished in another browser) becomes the pending goal here
    useEffect(() => {
        const carried = user?.user_metadata?.pending_goal;
        if (typeof carried === 'string' && carried.trim()) {
            if (!hasPendingGoal()) savePendingGoal(carried, Number(user?.user_metadata?.pending_goal_months) || undefined);
            void supabase.auth.updateUser({ data: { pending_goal: null, pending_goal_months: null } });
        }
    }, [user]);

    useEffect(() => {
        if (!user || isLoading || !profile?.isPersonalized || isProfileIncomplete(profile)) return;
        if (pathname !== '/goals' && hasPendingGoal()) navigate('/goals', { replace: true });
    }, [user, isLoading, profile, pathname, navigate]);

    return null;
};
