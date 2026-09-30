import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';
import { isProfileIncomplete } from '@/features/auth/complete-profile-modal';
import { hasPendingGoal } from './pending-goal';

/**
 * After signup + onboarding, sends a visitor who typed a goal on the landing page to the goals page,
 * where the New Goal form opens pre-filled. Waits until the onboarding modals are out of the way.
 */
export const PendingGoalRedirect: React.FC = () => {
    const { user } = useAuth();
    const { profile, isLoading } = useUserProfile(user);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        if (!user || isLoading || !profile?.isPersonalized || isProfileIncomplete(profile)) return;
        if (pathname !== '/goals' && hasPendingGoal()) navigate('/goals', { replace: true });
    }, [user, isLoading, profile, pathname, navigate]);

    return null;
};
