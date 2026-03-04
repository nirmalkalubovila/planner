import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/auth-context';
import { AuthError } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormSelect } from '@/components/ui/form-components';
import { Text, Divider } from '@/components/ui/typography';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { SimpleTimePicker } from '@/components/ui/simple-time-picker';
import { Sparkles, Clock, Target, Briefcase, Zap, CalendarDays, Moon, AlertTriangle, SkipForward } from 'lucide-react';

interface PersonalizeFormProps {
    onSuccess: () => void;
    onSkip: () => void;
}

export const PersonalizeForm: React.FC<PersonalizeFormProps> = ({ onSuccess, onSkip }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [sleepStart, setSleepStart] = useState('');
    const [sleepDuration, setSleepDuration] = useState('');
    const [weekStart, setWeekStart] = useState('Monday');
    const [planDay, setPlanDay] = useState('Sunday');
    const [planStartTime, setPlanStartTime] = useState('');
    const [planDurationPacks, setPlanDurationPacks] = useState('');
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
        const finalPlanDurationPacks = planDurationPacks || '2';
        const finalPrimaryFocus = primaryLifeFocus || 'Career';
        const finalProfession = currentProfession || 'Software Engineer';
        const finalDob = dob || (user?.user_metadata?.dob ? new Date(user.user_metadata.dob) : new Date(2002, 11, 23));

        if (user) {
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    sleepStart: finalSleepStart,
                    sleepDuration: finalSleepDuration,
                    weekStart,
                    planDay,
                    planStartTime: finalPlanStartTime,
                    planDurationPacks: Number(finalPlanDurationPacks),
                    primaryLifeFocus: finalPrimaryFocus,
                    currentProfession: finalProfession,
                    energyPeakTime,
                    focusAbility,
                    taskShiftingAbility,
                    isPersonalized: true,
                    dob: format(finalDob, 'yyyy-MM-dd'),
                }
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

    const handleSkipClick = async () => {
        setLoading(true);
        if (user) {
            // Mark as personalized even if skipping, so they can access the app
            await supabase.auth.updateUser({
                data: {
                    isPersonalized: true,
                    // Set minimal defaults if needed
                    sleepStart: sleepStart || '22:00',
                    sleepDuration: sleepDuration || '8',
                    planDay: planDay || 'Sunday',
                    planStartTime: planStartTime || '21:00',
                    planDurationPacks: 2,
                    dob: user.user_metadata?.dob || '2002-11-23'
                }
            });
        }
        setLoading(false);
        onSkip();
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Importance Banner */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <Text variant="small" className="text-amber-400/80">
                    <strong className="text-amber-400">Don't skip this.</strong> Without these settings, the AI can't schedule around your sleep, energy peaks, or focus areas.
                </Text>
            </div>

            {/* Form */}
            <div className="rounded-xl border border-border/50 bg-card/30 p-4 md:p-5">
                <AuthError message={error} />

                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <FormField label="Sleep Time" icon={<Clock className="w-3 h-3" />}>
                            <SimpleTimePicker value={sleepStart} onChange={setSleepStart} />
                        </FormField>
                        <FormField label="Duration (hrs)" icon={<Moon className="w-3 h-3" />}>
                            <Input type="number" min="1" max="24" value={sleepDuration} onChange={(e) => setSleepDuration(e.target.value)} placeholder="8" className="h-9" />
                        </FormField>
                        <FormField label="Date of Birth" icon={<CalendarDays className="w-3 h-3" />}>
                            <CustomDatePicker
                                selected={dob}
                                onChange={(date) => setDob(date)}
                                placeholderText="November 23rd, 2002"
                            />
                        </FormField>
                        <FormField label="Week Starts" icon={<CalendarDays className="w-3 h-3" />}>
                            <FormSelect value={weekStart} onChange={(e) => setWeekStart(e.target.value)}>
                                <option value="Monday">Monday</option>
                                <option value="Tuesday">Tuesday</option>
                                <option value="Wednesday">Wednesday</option>
                                <option value="Thursday">Thursday</option>
                                <option value="Friday">Friday</option>
                                <option value="Saturday">Saturday</option>
                                <option value="Sunday">Sunday</option>
                            </FormSelect>
                        </FormField>
                    </div>

                    <Divider />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <FormField label="Plan Week On (Day)" icon={<CalendarDays className="w-3 h-3" />}>
                            <FormSelect value={planDay} onChange={(e) => setPlanDay(e.target.value)}>
                                <option value="Monday">Monday</option>
                                <option value="Tuesday">Tuesday</option>
                                <option value="Wednesday">Wednesday</option>
                                <option value="Thursday">Thursday</option>
                                <option value="Friday">Friday</option>
                                <option value="Saturday">Saturday</option>
                                <option value="Sunday">Sunday</option>
                            </FormSelect>
                        </FormField>
                        <FormField label="Plan Start Time" icon={<Clock className="w-3 h-3" />}>
                            <SimpleTimePicker value={planStartTime} onChange={setPlanStartTime} />
                        </FormField>
                        <FormField label="Duration (30m packs)" icon={<Clock className="w-3 h-3" />}>
                            <Input type="number" min="1" max="10" value={planDurationPacks} onChange={(e) => setPlanDurationPacks(e.target.value)} placeholder="2" className="h-9" />
                        </FormField>
                    </div>

                    <Divider />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <FormField label="Primary Life Focus" icon={<Target className="w-3 h-3" />}>
                            <Input type="text" value={primaryLifeFocus} onChange={(e) => setPrimaryLifeFocus(e.target.value)} placeholder="Career" className="h-9" />
                        </FormField>
                        <FormField label="Profession / Status" icon={<Briefcase className="w-3 h-3" />}>
                            <Input type="text" value={currentProfession} onChange={(e) => setCurrentProfession(e.target.value)} placeholder="Software Engineer" className="h-9" />
                        </FormField>
                        <FormField label="Energy Peak Time" icon={<Zap className="w-3 h-3" />}>
                            <FormSelect value={energyPeakTime} onChange={(e) => setEnergyPeakTime(e.target.value)}>
                                <option value="Morning">Morning (6AM–12PM)</option>
                                <option value="Afternoon">Afternoon (12–5PM)</option>
                                <option value="Evening">Evening (5–9PM)</option>
                                <option value="Night">Night (9PM–12AM)</option>
                            </FormSelect>
                        </FormField>
                    </div>

                    <Divider />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField label="Focus Ability" icon={<Zap className="w-3 h-3" />}>
                            <FormSelect value={focusAbility} onChange={(e) => setFocusAbility(e.target.value)}>
                                <option value="High">High (Deep focus for hours)</option>
                                <option value="Normal">Normal (Steady pace)</option>
                                <option value="Low">Low (Easily distracted)</option>
                            </FormSelect>
                        </FormField>
                        <FormField label="Task Shifting Ability" icon={<Zap className="w-3 h-3" />}>
                            <FormSelect value={taskShiftingAbility} onChange={(e) => setTaskShiftingAbility(e.target.value)}>
                                <option value="Fast">Fast (Context switch easily)</option>
                                <option value="Normal">Normal (Comfortable transition)</option>
                                <option value="Slow">Slow (Need wind-down time)</option>
                            </FormSelect>
                        </FormField>
                    </div>

                    <Divider />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                        <button
                            type="button"
                            onClick={handleSkipClick}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors order-2 sm:order-1 disabled:opacity-50"
                        >
                            <SkipForward className="w-3.5 h-3.5" /> Skip for now
                        </button>
                        <Button type="submit" className="w-full sm:w-auto sm:min-w-[240px] h-10 font-semibold order-1 sm:order-2" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> Launch My Planner
                                </span>
                            )}
                        </Button>
                    </div>
                    <Text variant="tiny" className="text-center">
                        You can always update these in your profile settings.
                    </Text>
                </form>
            </div>
        </div>
    );
};
