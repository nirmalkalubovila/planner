import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { ProfileInfo } from './components/profile-info';
import { ProfilePreferences } from './components/profile-preferences';
import { ProfileSecurity } from './components/profile-security';

export const ProfilePage: React.FC = () => {
    const { user, signOut } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [sleepStart, setSleepStart] = useState('');
    const [sleepDuration, setSleepDuration] = useState('');
    const [weekStart, setWeekStart] = useState('');
    const [planDay, setPlanDay] = useState('');
    const [planStartTime, setPlanStartTime] = useState('');
    const [planDurationPacks, setPlanDurationPacks] = useState('');
    const [primaryLifeFocus, setPrimaryLifeFocus] = useState('');
    const [currentProfession, setCurrentProfession] = useState('');
    const [energyPeakTime, setEnergyPeakTime] = useState('');
    const [focusAbility, setFocusAbility] = useState('');
    const [taskShiftingAbility, setTaskShiftingAbility] = useState('');

    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || '');
            setDob(user.user_metadata?.dob || '');
            setSleepStart(user.user_metadata?.sleepStart || '22:00');
            setSleepDuration(user.user_metadata?.sleepDuration || '8');
            setWeekStart(user.user_metadata?.weekStart || 'Monday');
            setPlanDay(user.user_metadata?.planDay || 'Sunday');
            setPlanStartTime(user.user_metadata?.planStartTime || '21:00');
            setPlanDurationPacks(String(user.user_metadata?.planDurationPacks || '2'));
            setPrimaryLifeFocus(user.user_metadata?.primaryLifeFocus || '');
            setCurrentProfession(user.user_metadata?.currentProfession || '');
            setEnergyPeakTime(user.user_metadata?.energyPeakTime || 'Morning');
            setFocusAbility(user.user_metadata?.focusAbility || 'normal');
            setTaskShiftingAbility(user.user_metadata?.taskShiftingAbility || 'normal');
        }
    }, [user, isEditing]);

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase.auth.updateUser({
            data: {
                full_name: fullName,
                dob,
                sleepStart,
                sleepDuration,
                weekStart,
                planDay,
                planStartTime,
                planDurationPacks: Number(planDurationPacks) || 2,
                primaryLifeFocus,
                currentProfession,
                energyPeakTime,
                focusAbility,
                taskShiftingAbility,
            }
        });

        setLoading(false);
        if (!error) {
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } else {
            toast.error('Failed to update: ' + error.message);
        }
    };

    if (!user) return null;

    const formData = {
        fullName, setFullName,
        dob, setDob,
        sleepStart, setSleepStart,
        sleepDuration, setSleepDuration,
        weekStart, setWeekStart,
        planDay, setPlanDay,
        planStartTime, setPlanStartTime,
        planDurationPacks, setPlanDurationPacks,
        primaryLifeFocus, setPrimaryLifeFocus,
        currentProfession, setCurrentProfession,
        energyPeakTime, setEnergyPeakTime,
        focusAbility, setFocusAbility,
        taskShiftingAbility, setTaskShiftingAbility,
    };

    return (
        <div className="flex flex-col w-full max-w-[1200px] mx-auto p-4 md:p-8 space-y-6 pb-20 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 items-start">
                {/* Left: Profile Info */}
                <ProfileInfo user={user} signOut={signOut} />

                {/* Right: Preferences + Security stacked */}
                <div className="space-y-6">
                    <ProfilePreferences
                        user={user}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        loading={loading}
                        onSave={handleSave}
                        formData={formData}
                    />
                    <ProfileSecurity user={user} />
                </div>
            </div>
        </div>
    );
};
