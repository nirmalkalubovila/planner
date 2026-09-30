import React, { useState } from 'react';
import { UserCheck, User, CalendarDays, Briefcase, Target, Zap, Moon, Clock, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile, type UserProfile } from '@llb/api';
import { StandardDialog } from '@/components/common/standard-dialog';
import { AuthError } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-components';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { Text } from '@/components/ui/typography';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleTimePicker } from '@/components/ui/simple-time-picker';
import { OptionChips } from '@/components/common/option-chips';
import { EXECUTION_PROFILE_VERSION, type SituationStatus } from '@llb/core';

// Old "Skip for now" saved this placeholder instead of a real birth date.
const PLACEHOLDER_DOB = '2002-11-23';

const cap = (v?: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Normal');

/** True for personalized users still missing details the AI planner and email marketing rely on. */
export function isProfileIncomplete(profile: Partial<UserProfile> | null | undefined): boolean {
    return !!profile?.isPersonalized &&
        (!profile.dob || profile.dob === PLACEHOLDER_DOB || !profile.fullName?.trim() ||
            !profile.currentProfession?.trim() || !profile.primaryLifeFocus?.trim() || !profile.dailyFreeHours);
}

/**
 * Blocking prompt for users whose profile lacks the details the AI planner and
 * email marketing rely on (name, age, profession, focus, free time). Stays open
 * until the required fields are filled in.
 */
export const CompleteProfileModal: React.FC = () => {
    const { user } = useAuth();
    const { profile, isLoading, saveProfile } = useUserProfile(user);

    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState<Date | null>(null);
    const [marketingOptIn, setMarketingOptIn] = useState(false);
    const [profession, setProfession] = useState('');
    const [primaryFocus, setPrimaryFocus] = useState('');
    const [energyPeak, setEnergyPeak] = useState('Morning');
    const [focusAbility, setFocusAbility] = useState('Normal');
    const [taskShifting, setTaskShifting] = useState('Normal');
    const [sleepStart, setSleepStart] = useState('22:00');
    const [sleepDuration, setSleepDuration] = useState('8');
    const [freeHours, setFreeHours] = useState('');
    const [challenge, setChallenge] = useState('');
    const [status, setStatus] = useState<SituationStatus | undefined>(undefined);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const needsCompletion = !!user && !isLoading && isProfileIncomplete(profile);

    // Prefill whatever we already know (e.g. the Google name) once the profile arrives.
    const [prefilled, setPrefilled] = useState(false);
    if (needsCompletion && !prefilled) {
        setPrefilled(true);
        setFullName(profile?.fullName || '');
        setMarketingOptIn(!!profile?.marketingOptIn);
        if (profile?.dob && profile.dob !== PLACEHOLDER_DOB) setDob(new Date(profile.dob));
        setProfession(profile?.currentProfession || '');
        setPrimaryFocus(profile?.primaryLifeFocus || '');
        setEnergyPeak(profile?.energyPeakTime || 'Morning');
        setFocusAbility(cap(profile?.focusAbility));
        setTaskShifting(profile?.taskShiftingAbility === 'high' ? 'Fast' : profile?.taskShiftingAbility === 'low' ? 'Slow' : 'Normal');
        setSleepStart(profile?.sleepStart || '22:00');
        setSleepDuration(profile?.sleepDuration || '8');
        setFreeHours(profile?.dailyFreeHours || '');
        setChallenge(profile?.biggestChallenge || '');
        setStatus(profile?.executionProfile?.situation?.status);
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim()) return setError('Please enter your full name.');
        if (!dob) return setError('Please enter your date of birth.');
        if (!profession.trim()) return setError('Please enter your profession.');
        if (!primaryFocus.trim()) return setError('Please enter your primary life focus.');
        if (!freeHours || Number(freeHours) <= 0) return setError('Please tell us how many free hours you have per day.');

        setSaving(true);
        setError('');
        try {
            await saveProfile({
                fullName: fullName.trim(),
                dob: format(dob, 'yyyy-MM-dd'),
                marketingOptIn,
                currentProfession: profession.trim(),
                primaryLifeFocus: primaryFocus.trim(),
                energyPeakTime: energyPeak,
                focusAbility,
                taskShiftingAbility: taskShifting,
                sleepStart,
                sleepDuration,
                dailyFreeHours: freeHours,
                biggestChallenge: challenge.trim(),
                ...(status ? {
                    executionProfile: {
                        ...profile?.executionProfile,
                        version: EXECUTION_PROFILE_VERSION,
                        situation: { ...profile?.executionProfile?.situation, status },
                    },
                } : {}),
                ...(user?.email ? { email: user.email } : {}),
            });
        } catch {
            setError('Could not save your details. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <StandardDialog
            isOpen={needsCompletion}
            onClose={() => {}}
            title="Complete Your Profile"
            subtitle="Helps us personalize your planner"
            icon={UserCheck}
            maxWidth="2xl"
            hideClose
            closeOnBackdrop={false}
        >
            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
                <Text variant="small" className="text-muted-foreground">
                    We&apos;re missing a few details. Add them once to keep using your planner — the AI uses them to build goal plans that fit your life.
                </Text>
                <AuthError message={error} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Full name" required icon={<User className="w-3 h-3" />}>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="h-9 text-sm" />
                    </FormField>
                    <FormField label="Date of birth" required icon={<CalendarDays className="w-3 h-3" />}>
                        <CustomDatePicker selected={dob} onChange={(d) => setDob(d)} placeholderText="Select" />
                    </FormField>
                    <FormField label="Profession" required icon={<Briefcase className="w-3 h-3" />}>
                        <Input value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Software Engineer" className="h-9 text-sm" />
                    </FormField>
                    <FormField label="Primary life focus" required icon={<Target className="w-3 h-3" />}>
                        <Input value={primaryFocus} onChange={(e) => setPrimaryFocus(e.target.value)} placeholder="Career, Health, Studies..." className="h-9 text-sm" />
                    </FormField>
                    <FormField label="Free hours per day for goals" required icon={<Clock className="w-3 h-3" />}>
                        <Input type="number" min="0.5" max="16" step="0.5" value={freeHours} onChange={(e) => setFreeHours(e.target.value)} placeholder="2" className="h-9 text-sm" />
                    </FormField>
                    <FormField label="Energy peak" icon={<Zap className="w-3 h-3" />}>
                        <Select value={energyPeak} onValueChange={setEnergyPeak}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {['Morning', 'Afternoon', 'Evening', 'Night'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormField>
                    <FormField label="Focus ability" icon={<Zap className="w-3 h-3" />}>
                        <Select value={focusAbility} onValueChange={setFocusAbility}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {['High', 'Normal', 'Low'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormField>
                    <FormField label="Task shifting" icon={<Zap className="w-3 h-3" />}>
                        <Select value={taskShifting} onValueChange={setTaskShifting}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {['Fast', 'Normal', 'Slow'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormField>
                    <FormField label="Sleep start" icon={<Moon className="w-3 h-3" />}>
                        <SimpleTimePicker value={sleepStart} onChange={setSleepStart} />
                    </FormField>
                    <FormField label="Sleep duration (hrs)" icon={<Clock className="w-3 h-3" />}>
                        <Input type="number" min="1" max="24" value={sleepDuration} onChange={(e) => setSleepDuration(e.target.value)} className="h-9 text-sm" />
                    </FormField>
                </div>

                <FormField label="Current situation (optional)" icon={<Briefcase className="w-3 h-3" />}>
                    <OptionChips
                        className="grid-cols-2 sm:grid-cols-5"
                        value={status}
                        onChange={(v) => setStatus(status === v ? undefined : v)}
                        options={[
                            { value: 'student', label: 'Student' },
                            { value: 'employed', label: 'Employed' },
                            { value: 'self_employed', label: 'Self-employed' },
                            { value: 'unemployed', label: 'Between jobs' },
                            { value: 'other', label: 'Other' },
                        ]}
                    />
                </FormField>

                <FormField label="Biggest challenge reaching your goals (optional)" icon={<Flag className="w-3 h-3" />}>
                    <Input value={challenge} onChange={(e) => setChallenge(e.target.value)} placeholder="e.g. procrastination, low energy, too many commitments" className="h-9 text-sm" />
                </FormField>

                <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="mt-0.5" />
                    <span>Email me planning tips, product updates and offers. You can unsubscribe anytime.</span>
                </label>
                <Button type="submit" className="w-full h-9 text-sm font-semibold" disabled={saving}>
                    {saving ? 'Saving...' : 'Save & continue'}
                </Button>
            </form>
        </StandardDialog>
    );
};
