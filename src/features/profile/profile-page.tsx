import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/api/services/profile-service';
import { ProfileInfo } from './components/profile-info';
import { ProfilePreferences } from './components/profile-preferences';
import { ProfileSecurity } from './components/profile-security';
import { NotificationPreferencesSection } from './notification-preferences';
import { InstallAppSection } from './install-app-section';
import { FeedbackSection } from './feedback-section';
import { cn } from '@/lib/utils';

export const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const { profile, saveProfile, isSaving } = useUserProfile(user);

    const [isEditingPrefs, setIsEditingPrefs] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [sleepStart, setSleepStart] = useState('');
    const [sleepDuration, setSleepDuration] = useState('');
    const [weekStart, setWeekStart] = useState('');
    const [planDay, setPlanDay] = useState('');
    const [planStartTime, setPlanStartTime] = useState('');
    const [planEndTime, setPlanEndTime] = useState('');
    const [primaryLifeFocus, setPrimaryLifeFocus] = useState('');
    const [currentProfession, setCurrentProfession] = useState('');
    const [energyPeakTime, setEnergyPeakTime] = useState('');
    const [focusAbility, setFocusAbility] = useState('');
    const [taskShiftingAbility, setTaskShiftingAbility] = useState('');

    useEffect(() => {
        if (profile && !isEditingPrefs && !isEditingProfile) {
            setFullName(profile.fullName || '');
            setDob(profile.dob || '');
            setSleepStart(profile.sleepStart || '22:00');
            setSleepDuration(profile.sleepDuration || '8');
            setWeekStart(profile.weekStart || 'Monday');
            setPlanDay(profile.planDay || 'Sunday');
            setPlanStartTime(profile.planStartTime || '21:00');
            setPlanEndTime(profile.planEndTime || '22:00');
            setPrimaryLifeFocus(profile.primaryLifeFocus || '');
            setCurrentProfession(profile.currentProfession || '');
            setEnergyPeakTime(profile.energyPeakTime || 'Morning');
            setFocusAbility(profile.focusAbility || 'normal');
            setTaskShiftingAbility(profile.taskShiftingAbility || 'normal');
        }
    }, [profile, isEditingPrefs, isEditingProfile]);

    const handleSaveProfile = async () => {
        try {
            await saveProfile({
                fullName,
                dob,
                sleepStart,
                sleepDuration,
                weekStart,
                planDay,
                planStartTime,
                planEndTime,
                primaryLifeFocus,
                currentProfession,
                energyPeakTime,
                focusAbility,
                taskShiftingAbility,
            });
            setIsEditingProfile(false);
            toast.success('Profile updated successfully!');
        } catch {
            // Error handled by mutation
        }
    };

    const handleSavePrefs = async () => {
        try {
            await saveProfile({
                fullName,
                dob,
                sleepStart,
                sleepDuration,
                weekStart,
                planDay,
                planStartTime,
                planEndTime,
                primaryLifeFocus,
                currentProfession,
                energyPeakTime,
                focusAbility,
                taskShiftingAbility,
            });
            setIsEditingPrefs(false);
            toast.success('Preferences updated successfully!');
        } catch {
            // Error handled by mutation
        }
    };

    const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'contact' | 'info'>('profile');

    if (!user) return null;

    const formData = {
        fullName, setFullName,
        dob, setDob,
        sleepStart, setSleepStart,
        sleepDuration, setSleepDuration,
        weekStart, setWeekStart,
        planDay, setPlanDay,
        planStartTime, setPlanStartTime,
        planEndTime, setPlanEndTime,
        primaryLifeFocus, setPrimaryLifeFocus,
        currentProfession, setCurrentProfession,
        energyPeakTime, setEnergyPeakTime,
        focusAbility, setFocusAbility,
        taskShiftingAbility, setTaskShiftingAbility,
    };

    const tabs = [
        { id: 'profile', label: 'Profile & Security' },
        { id: 'preferences', label: 'Planner Preferences' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'contact', label: 'Contact Us' },
        { id: 'info', label: 'Guide & Install' },
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
                        <ProfilePreferences
                            user={user}
                            profile={profile}
                            isEditing={isEditingPrefs}
                            setIsEditing={setIsEditingPrefs}
                            loading={isSaving}
                            onSave={handleSavePrefs}
                            formData={formData}
                        />
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="w-full animate-in fade-in duration-200">
                        <NotificationPreferencesSection />
                    </div>
                )}

                {activeTab === 'contact' && (
                    <div className="w-full animate-in fade-in duration-200">
                        <FeedbackSection />
                    </div>
                )}

                {activeTab === 'info' && (
                    <div className="w-full animate-in fade-in duration-200">
                        <InstallAppSection />
                    </div>
                )}
            </div>
        </div>
    );
};
