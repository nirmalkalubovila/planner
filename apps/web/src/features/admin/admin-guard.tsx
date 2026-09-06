import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { isAdminEmail } from './admin-constants';

/**
 * Route guard that only allows admin emails through.
 * Non-admins are silently redirected to /today.
 */
export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!user || !isAdminEmail(user.email)) {
        return <Navigate to="/today" replace />;
    }

    return <>{children}</>;
};
