import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, AuthHeader } from '@/components/ui/auth-layout';
import { PersonalizeForm } from './forms/personalize-form';

export const PersonalizePage: React.FC = () => {
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate('/');
    };

    const handleSkip = () => {
        navigate('/');
    };

    return (
        <AuthLayout maxWidth="3xl" fullHeight>
            <div className="flex flex-col gap-3">
                <AuthHeader
                    icon={
                        <img src="/ai-animation-white.gif" alt="AI" className="w-12 h-12 object-contain" />
                    }
                    title="Personalize Your Planner"
                    description="Our AI uses these details to craft plans that fit your lifestyle. Takes under 2 minutes."
                />

                <PersonalizeForm
                    onSuccess={handleSuccess}
                    onSkip={handleSkip}
                />
            </div>
        </AuthLayout>
    );
};
