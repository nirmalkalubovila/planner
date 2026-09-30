import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';
import { AuthError } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-components';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Text } from '@/components/ui/typography';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { SimpleTimePicker } from '@/components/ui/simple-time-picker';
import { User, Sparkles, Clock, Target, Briefcase, Zap, CalendarDays, Moon, AlertTriangle } from 'lucide-react';

interface PersonalizeFormProps {
    onSuccess: () => void;
    onSkip?: () => void;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 col-span-full mb-1 mt-3 first:mt-0">
        {children}
    </h4>
);

export const PersonalizeForm: React.FC<PersonalizeFormProps> = ({ onSuccess }) => {
    const { user } = useAuth();
    const { saveProfile } = useUserProfile(user);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Google sign-ins arrive with name/photo in user_metadata; prefill and persist them
    // so OAuth users end up with the same user_profiles row as email sign-ups.
    const meta = user?.user_metadata ?? {};
    const [fullName, setFullName] = useState<string>(meta.full_name || meta.name || '');
    const [marketingOptIn, setMarketingOptIn] = useState(false);
    const oauthAvatar: string = meta.avatar_url || meta.picture || '';

    const [sleepStart, setSleepStart] = useState('');
    const [sleepDuration, setSleepDuration] = useState('');
    const [weekStart, setWeekStart] = useState('Monday');
    const [planDay, setPlanDay] = useState('Sunday');
    const [planStartTime, setPlanStartTime] = useState('');
    const [planEndTime, setPlanEndTime] = useState('');
    const [primaryLifeFocus, setPrimaryLifeFocus] = useState('');
    const [currentProfession, setCurrentProfession] = useState('');
    const [energyPeakTime, setEnergyPeakTime] = useState('Morning');
    const [focusAbility, setFocusAbility] = useState('Normal');
    const [taskShiftingAbility, setTaskShiftingAbility] = useState('Normal');
    const [dob, setDob] = useState<Date | null>(() => {
        const existingDob = user?.user_metadata?.dob;
        return existingDob ? new Date(existingDob) : null;
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const finalSleepStart = sleepStart || '22:00';
        const finalSleepDuration = sleepDuration || '8';
        const finalPlanStartTime = planStartTime || '21:00';
        const finalPlanEndTime = planEndTime || '22:00';
        const finalPrimaryFocus = primaryLifeFocus || 'Career';
        const finalProfession = currentProfession || 'Software Engineer';
        if (!fullName.trim()) {
            setError('Please enter your full name.');
            setLoading(false);
            return;
        }
        if (!dob) {
            setError('Please enter your date of birth.');
            setLoading(false);
            return;
        }
        const finalDob = dob;

        if (user) {
            await saveProfile({
                fullName: fullName.trim(),
                ...(user.email ? { email: user.email } : {}),
                marketingOptIn,
                ...(oauthAvatar ? { avatarUrl: oauthAvatar } : {}),
                sleepStart: finalSleepStart,
                sleepDuration: finalSleepDuration,
                weekStart,
                planDay,
                planStartTime: finalPlanStartTime,
                planEndTime: finalPlanEndTime,
                primaryLifeFocus: finalPrimaryFocus,
                currentProfession: finalProfession,
                energyPeakTime,
                focusAbility,
                taskShiftingAbility,
                isPersonalized: true,
                dob: format(finalDob, 'yyyy-MM-dd'),
            });
            const { error: updateError } = await supabase.auth.updateUser({
                data: { isPersonalized: true }
            });
            if (updateError) {
                setError(updateError.message);
                setLoading(false);
                return;
            }
        }
        setLoading(false);
        onSuccess();
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15 shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <Text variant="small" className="text-amber-400/80">
                    <strong className="text-amber-400">Don&apos;t skip this.</strong> AI needs these to schedule around your sleep, energy peaks, and focus.
                </Text>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/30 p-3 sm:p-4">
                <AuthError message={error} />

                <form onSubmit={handleSave} className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        <SectionLabel>About you</SectionLabel>
                        <FormField label="Full name" required icon={<User className="w-3 h-3" />}>
                            <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="h-9 text-sm" />
                        </FormField>

                        <SectionLabel>Sleep & Rest</SectionLabel>
                        <FormField label="Sleep start" icon={<Moon className="w-3 h-3" />}>
                            <SimpleTimePicker value={sleepStart} onChange={setSleepStart} />
                        </FormField>
                        <FormField label="Duration (hrs)" icon={<Clock className="w-3 h-3" />}>
                            <Input type="number" min="1" max="24" value={sleepDuration} onChange={(e) => setSleepDuration(e.target.value)} placeholder="8" className="h-9 text-sm" />
                        </FormField>
                        <FormField label="Date of birth" required icon={<CalendarDays className="w-3 h-3" />}>
                            <CustomDatePicker selected={dob} onChange={(date) => setDob(date)} placeholderText="Select" />
                        </FormField>
                        <FormField label="Week starts" icon={<CalendarDays className="w-3 h-3" />}>
                            <Select value={weekStart} onValueChange={setWeekStart}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <SectionLabel>Weekly planning</SectionLabel>
                        <FormField label="Plan day" icon={<CalendarDays className="w-3 h-3" />}>
                            <Select value={planDay} onValueChange={setPlanDay}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField label="Plan start" icon={<Clock className="w-3 h-3" />}>
                            <SimpleTimePicker value={planStartTime} onChange={setPlanStartTime} />
                        </FormField>
                        <FormField label="Plan end" icon={<Clock className="w-3 h-3" />}>
                            <SimpleTimePicker value={planEndTime} onChange={setPlanEndTime} />
                        </FormField>

                        <SectionLabel>Life & focus</SectionLabel>
                        <FormField label="Primary focus" icon={<Target className="w-3 h-3" />}>
                            <Input type="text" value={primaryLifeFocus} onChange={(e) => setPrimaryLifeFocus(e.target.value)} placeholder="Career" className="h-9 text-sm" />
                        </FormField>
                        <FormField label="Profession" icon={<Briefcase className="w-3 h-3" />}>
                            <Input type="text" value={currentProfession} onChange={(e) => setCurrentProfession(e.target.value)} placeholder="Software Engineer" className="h-9 text-sm" />
                        </FormField>
                        <FormField label="Energy peak" icon={<Zap className="w-3 h-3" />}>
                            <Select value={energyPeakTime} onValueChange={setEnergyPeakTime}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Morning">Morning</SelectItem>
                                    <SelectItem value="Afternoon">Afternoon</SelectItem>
                                    <SelectItem value="Evening">Evening</SelectItem>
                                    <SelectItem value="Night">Night</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>

                        <SectionLabel>Cognitive style</SectionLabel>
                        <FormField label="Focus ability" icon={<Zap className="w-3 h-3" />}>
                            <Select value={focusAbility} onValueChange={setFocusAbility}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField label="Task shifting" icon={<Zap className="w-3 h-3" />}>
                            <Select value={taskShiftingAbility} onValueChange={setTaskShiftingAbility}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Fast">Fast</SelectItem>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="Slow">Slow</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>

                    <label className="flex items-start gap-2 text-xs text-muted-foreground pt-2 cursor-pointer">
                        <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="mt-0.5" />
                        <span>Email me planning tips, product updates and offers. You can unsubscribe anytime.</span>
                    </label>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-border mt-3">
                        <span className="order-2 sm:order-1" />
                        <Button type="submit" className="w-full sm:w-auto sm:min-w-[200px] h-9 text-sm font-semibold order-1 sm:order-2" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5" /> Launch My Planner
                                </span>
                            )}
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 text-center">
                        You can update these anytime in profile settings.
                    </p>
                </form>
            </div>
        </div>
    );
};
