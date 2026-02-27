import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/auth-context';
import { AuthLayout, AuthHeader, AuthError } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormSelect } from '@/components/ui/form-components';
import { Text, Divider } from '@/components/ui/typography';
import { Sparkles, Clock, Brain, Target, Briefcase, Zap, CalendarDays, Moon, AlertTriangle, SkipForward } from 'lucide-react';

export const PersonalizePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [sleepStart, setSleepStart] = useState('22:00');
    const [sleepDuration, setSleepDuration] = useState('8');
    const [weekStart, setWeekStart] = useState('Monday');
    const [planTime, setPlanTime] = useState('Sunday 9PM - 10PM');
    const [primaryLifeFocus, setPrimaryLifeFocus] = useState('Career');
    const [currentProfession, setCurrentProfession] = useState('Software Engineer');
    const [energyPeakTime, setEnergyPeakTime] = useState('Morning');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (user) {
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    sleepStart, sleepDuration, weekStart, planTime,
                    primaryLifeFocus, currentProfession, energyPeakTime,
                    isPersonalized: true,
                }
            });
            if (updateError) {
                setError(updateError.message);
                setLoading(false);
                return;
            }
        }
        setLoading(false);
        navigate('/');
    };

    const handleSkip = () => navigate('/');

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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <FormField label="Sleep Time" icon={<Clock className="w-3 h-3" />}>
                                <Input type="time" value={sleepStart} onChange={(e) => setSleepStart(e.target.value)} className="h-9" required />
                            </FormField>
                            <FormField label="Duration (hrs)" icon={<Moon className="w-3 h-3" />}>
                                <Input type="number" min="1" max="24" value={sleepDuration} onChange={(e) => setSleepDuration(e.target.value)} className="h-9" required />
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
                            <FormField label="Planning Time" icon={<CalendarDays className="w-3 h-3" />}>
                                <FormSelect value={planTime} onChange={(e) => setPlanTime(e.target.value)}>
                                    <option value="Friday 4PM - 5PM">Fri 4–5 PM</option>
                                    <option value="Saturday 10AM - 11AM">Sat 10–11 AM</option>
                                    <option value="Sunday 9AM - 10AM">Sun 9–10 AM</option>
                                    <option value="Sunday 8PM - 9PM">Sun 8–9 PM</option>
                                    <option value="Sunday 9PM - 10PM">Sun 9–10 PM</option>
                                    <option value="Monday 8AM - 9AM">Mon 8–9 AM</option>
                                </FormSelect>
                            </FormField>
                        </div>

                        <Divider />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <FormField label="Primary Life Focus" icon={<Target className="w-3 h-3" />}>
                                <Input type="text" value={primaryLifeFocus} onChange={(e) => setPrimaryLifeFocus(e.target.value)} placeholder="e.g., Career, Health" className="h-9" required />
                            </FormField>
                            <FormField label="Profession / Status" icon={<Briefcase className="w-3 h-3" />}>
                                <Input type="text" value={currentProfession} onChange={(e) => setCurrentProfession(e.target.value)} placeholder="e.g., Engineer, Student" className="h-9" required />
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

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors order-2 sm:order-1"
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
        </AuthLayout>
    );
};
