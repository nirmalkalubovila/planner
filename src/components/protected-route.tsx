import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';

export const ProtectedRoute: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Direct users to personalization form if they haven't completed it
    if (!user.user_metadata?.isPersonalized && window.location.pathname !== '/personalize') {
        return <Navigate to="/personalize" replace />;
    }

    return <Outlet />;
};
