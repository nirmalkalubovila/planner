import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/api/services/profile-service';
import { PersonalizeForm } from './forms/personalize-form';
import { StandardDialog } from '@/components/common/standard-dialog';

export const PersonalizeModal: React.FC = () => {
    const { user } = useAuth();
    const { profile } = useUserProfile(user);
    const isOpen = !!user && !(profile?.isPersonalized ?? user.user_metadata?.isPersonalized);

    const handleDone = () => {
        window.location.reload();
    };

    return (
        <StandardDialog
            isOpen={isOpen}
            onClose={() => {}}
            title="Personalize Your Planner"
            subtitle="Takes under 2 minutes"
            icon={Sparkles}
            maxWidth="6xl"
            hideClose
            closeOnBackdrop={false}
            scrollable={true}
        >
            <div className="p-4 sm:p-5">
                <PersonalizeForm onSuccess={handleDone} onSkip={handleDone} />
            </div>
        </StandardDialog>
    );
};
