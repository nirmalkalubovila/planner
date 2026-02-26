import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Rocket } from 'lucide-react';

export const PersonalizePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Default values
    const [sleepStart, setSleepStart] = useState('22:00');
    const [sleepDuration, setSleepDuration] = useState('8');
    const [weekStart, setWeekStart] = useState('Monday');
    const [planTime, setPlanTime] = useState('Sunday 9PM - 10PM');
    const [primaryLifeFocus, setPrimaryLifeFocus] = useState('');
    const [currentProfession, setCurrentProfession] = useState('');
    const [energyPeakTime, setEnergyPeakTime] = useState('Morning');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (user) {
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    sleepStart,
                    sleepDuration,
                    weekStart,
                    planTime,
                    primaryLifeFocus,
                    currentProfession,
                    energyPeakTime,
                    isPersonalized: true,
                }
            });

            if (updateError) {
                setError(updateError.message);
                setLoading(false);
                return;
            }
        } else {
            // If they are not logged in, we can't save it to auth metadata here directly.
            // But if auto-login worked, user is here. 
            // In case there's no auth, we'll just redirect them to login or main page and hope they login.
            console.warn("User not authenticated to save personalization");
        }

        setLoading(false);
        navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Rocket className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Personalize Your Planner</CardTitle>
                    <CardDescription>
                        Set up your basic workflow so we can tailor the experience just for you.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSave} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Sleeping Time (Start)</label>
                            <Input
                                type="time"
                                value={sleepStart}
                                onChange={(e) => setSleepStart(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Sleep Duration (hours)</label>
                            <Input
                                type="number"
                                min="1"
                                max="24"
                                value={sleepDuration}
                                onChange={(e) => setSleepDuration(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">General Week Starting Date</label>
                            <select
                                value={weekStart}
                                onChange={(e) => setWeekStart(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="Monday">Monday</option>
                                <option value="Tuesday">Tuesday</option>
                                <option value="Wednesday">Wednesday</option>
                                <option value="Thursday">Thursday</option>
                                <option value="Friday">Friday</option>
                                <option value="Saturday">Saturday</option>
                                <option value="Sunday">Sunday</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Next Week Planning Time</label>
                            <select
                                value={planTime}
                                onChange={(e) => setPlanTime(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="Friday 4PM - 5PM">Friday 4PM - 5PM</option>
                                <option value="Saturday 10AM - 11AM">Saturday 10AM - 11AM</option>
                                <option value="Sunday 9AM - 10AM">Sunday 9AM - 10AM</option>
                                <option value="Sunday 8PM - 9PM">Sunday 8PM - 9PM</option>
                                <option value="Sunday 9PM - 10PM">Sunday 9PM - 10PM</option>
                                <option value="Monday 8AM - 9AM">Monday 8AM - 9AM</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Primary Life Focus</label>
                            <Input
                                type="text"
                                value={primaryLifeFocus}
                                onChange={(e) => setPrimaryLifeFocus(e.target.value)}
                                placeholder="e.g., Career, Health, Business, Academics"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Current Profession / Status</label>
                            <Input
                                type="text"
                                value={currentProfession}
                                onChange={(e) => setCurrentProfession(e.target.value)}
                                placeholder="e.g., Software Engineer, Student"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Energy Peak Time</label>
                            <select
                                value={energyPeakTime}
                                onChange={(e) => setEnergyPeakTime(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="Morning">Morning</option>
                                <option value="Afternoon">Afternoon</option>
                                <option value="Evening">Evening</option>
                                <option value="Night">Night</option>
                            </select>
                        </div>

                        <Button type="submit" className="w-full mt-4" disabled={loading}>
                            {loading ? 'Saving...' : "Let's build your legacy life"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
