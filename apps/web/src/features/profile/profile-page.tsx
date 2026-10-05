import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from '@llb/core';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';
import { ProfileInfo } from './components/profile-info';
import { PlannerProfileCard } from './components/planner-profile-card';
import { AppearanceSection } from './components/appearance-section';
import { ProfileSecurity } from './components/profile-security';
import { NotificationPreferencesSection } from './notification-preferences';
import { ClaudeConnectorSection } from './claude-connector-section';
import { FeedbackSection } from './feedback-section';
import { cn } from '@/lib/utils';

export const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const { profile, saveProfile, isSaving } = useUserProfile(user);

    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Form state: name and birth date only. Everything personal is collected by the quiz.
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');

    useEffect(() => {
        if (profile && !isEditingProfile) {
            setFullName(profile.fullName || '');
            setDob(profile.dob || '');
        }
    }, [profile, isEditingProfile]);

    const handleSaveProfile = async () => {
        try {
            await saveProfile({ fullName, dob });
            setIsEditingProfile(false);
            toast.success('Profile updated successfully!');
        } catch {
            // Error handled by mutation
        }
    };

    const [searchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const validTabs = ['profile', 'preferences', 'notifications', 'ai', 'contact'] as const;
    type TabId = typeof validTabs[number];
    const initialTab: TabId = tabParam && validTabs.includes(tabParam as TabId) ? (tabParam as TabId) : 'profile';
    const [activeTab, setActiveTab] = useState<TabId>(initialTab);

    if (!user) return null;

    const tabs = [
        { id: 'profile', label: 'Profile & Security' },
        { id: 'preferences', label: 'Preferences' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'ai', label: 'AI Assistant' },
        { id: 'contact', label: 'Rate Us' },
    ];

    return (
        <div className="flex flex-col w-full max-w-[1200px] mx-auto px-2 pt-8 sm:pt-12 sm:px-4 md:px-8 space-y-6 pb-20">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-border pb-6 mb-2">
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground leading-none">Profile</h2>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-12 bg-primary/40 rounded-full" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">SETTINGS</span>
                    </div>
                </div>
            </div>

            {/* Horizontal Nav Bar */}
            <div className="flex border-b border-border overflow-x-auto no-scrollbar gap-2 sm:gap-6 pb-px shrink-0">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={cn(
                            'whitespace-nowrap pb-3 text-sm font-semibold tracking-wide border-b-2 px-1 transition-all duration-150 relative select-none',
                            isActive
                              ? 'border-primary text-primary font-bold'
                              : 'border-transparent text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Contents */}
            <div className="pt-2">
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-6 items-start animate-in fade-in duration-200">
                        <ProfileInfo
                            user={user}
                            profile={profile}
                            saveProfile={saveProfile}
                            isEditing={isEditingProfile}
                            setIsEditing={setIsEditingProfile}
                            loading={isSaving}
                            onSave={handleSaveProfile}
                            fullName={fullName}
                            setFullName={setFullName}
                            dob={dob}
                            setDob={setDob}
                        />
                        <ProfileSecurity user={user} />
                    </div>
                )}

                {activeTab === 'preferences' && (
                    <div className="w-full animate-in fade-in duration-200">
                        <AppearanceSection />
                        <div className="mt-4">
                            <PlannerProfileCard />
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="w-full animate-in fade-in duration-200">
                        <NotificationPreferencesSection />
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="w-full animate-in fade-in duration-200">
                        <ClaudeConnectorSection />
                    </div>
                )}

                {activeTab === 'contact' && (
                    <div className="w-full animate-in fade-in duration-200">
                        <FeedbackSection />
                    </div>
                )}

            </div>
        </div>
    );
};
