import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Calendar, Edit2, Check, X, User } from 'lucide-react';

export const ProfilePage: React.FC = () => {
    const { user, signOut } = useAuth();

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [sleepStart, setSleepStart] = useState('');
    const [sleepDuration, setSleepDuration] = useState('');
    const [weekStart, setWeekStart] = useState('');
    const [planTime, setPlanTime] = useState('');
    const [freeTime, setFreeTime] = useState('');
    const [minTaskTime, setMinTaskTime] = useState('');
    const [maxTaskTime, setMaxTaskTime] = useState('');
    const [focusAbility, setFocusAbility] = useState('');
    const [taskShiftingAbility, setTaskShiftingAbility] = useState('');

    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || '');
            setDob(user.user_metadata?.dob || '');
            setSleepStart(user.user_metadata?.sleepStart || '22:00');
            setSleepDuration(user.user_metadata?.sleepDuration || '8');
            setWeekStart(user.user_metadata?.weekStart || 'Monday');
            setPlanTime(user.user_metadata?.planTime || 'Sunday 9PM - 10PM');
            setFreeTime(user.user_metadata?.freeTime || '2');
            setMinTaskTime(user.user_metadata?.minTaskTime || '30');
            setMaxTaskTime(user.user_metadata?.maxTaskTime || '2');
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
                planTime,
                freeTime,
                minTaskTime,
                maxTaskTime,
                focusAbility,
                taskShiftingAbility,
            }
        });

        setLoading(false);
        if (!error) {
            setIsEditing(false);
        } else {
            alert('Failed to update profile: ' + error.message);
        }
    };

    if (!user) return null;

    const initials = user.user_metadata?.full_name
        ? user.user_metadata.full_name.substring(0, 2).toUpperCase()
        : user.email?.substring(0, 2).toUpperCase() || 'U';

    return (
        <div className="flex flex-col h-full space-y-4 md:space-y-6 pb-20">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Your Profile</h1>
                <p className="text-sm md:text-base text-muted-foreground">Manage your account settings</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Your registered details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase">
                                {initials}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{user.user_metadata?.full_name || 'Anonymous User'}</h3>
                                <p className="text-sm text-muted-foreground">Account Status: Active</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>Date of Birth: {user.user_metadata?.dob || 'Not set'}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <Button onClick={signOut} variant="destructive" className="w-full sm:w-auto">
                            Sign Out
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle>Preferences</CardTitle>
                            <CardDescription>Customize your planner experience</CardDescription>
                        </div>
                        {!isEditing && (
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Full Name</label>
                                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Date of Birth</label>
                                    <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Sleeping Time (Start)</label>
                                    <Input type="time" value={sleepStart} onChange={(e) => setSleepStart(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Sleep Duration (hours)</label>
                                    <Input type="number" min="1" max="24" value={sleepDuration} onChange={(e) => setSleepDuration(e.target.value)} />
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
                                    <label className="text-sm font-medium leading-none">Expected Free Time (hours)</label>
                                    <Input type="number" min="0" max="24" value={freeTime} onChange={(e) => setFreeTime(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Minimum Task Time (minutes)</label>
                                    <Input type="number" min="1" value={minTaskTime} onChange={(e) => setMinTaskTime(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Maximum Task Time (hours)</label>
                                    <Input type="number" min="1" max="24" value={maxTaskTime} onChange={(e) => setMaxTaskTime(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Focus Ability</label>
                                    <select
                                        value={focusAbility}
                                        onChange={(e) => setFocusAbility(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="very low">Very Low</option>
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="very high">Very High</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Task Shifting Ability</label>
                                    <select
                                        value={taskShiftingAbility}
                                        onChange={(e) => setTaskShiftingAbility(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="very low">Very Low</option>
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="very high">Very High</option>
                                    </select>
                                </div>

                                <div className="flex items-center space-x-2 pt-2">
                                    <Button onClick={handleSave} disabled={loading} className="w-full">
                                        <Check className="h-4 w-4 mr-2" /> Save Changes
                                    </Button>
                                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading} className="w-full">
                                        <X className="h-4 w-4 mr-2" /> Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="text-muted-foreground">Sleeping Schedule:</div>
                                    <div className="font-medium">{user.user_metadata?.sleepStart || '22:00'} ({user.user_metadata?.sleepDuration || '8'}h)</div>

                                    <div className="text-muted-foreground">Week Starts On:</div>
                                    <div className="font-medium">{user.user_metadata?.weekStart || 'Monday'}</div>

                                    <div className="text-muted-foreground">Planning Time:</div>
                                    <div className="font-medium">{user.user_metadata?.planTime || 'Sunday 9PM - 10PM'}</div>

                                    <div className="text-muted-foreground">Est. Free Time:</div>
                                    <div className="font-medium">{user.user_metadata?.freeTime || '2'} hours/day</div>

                                    <div className="text-muted-foreground">Min Task Time:</div>
                                    <div className="font-medium">{user.user_metadata?.minTaskTime || '30'} minutes</div>

                                    <div className="text-muted-foreground">Max Task Time:</div>
                                    <div className="font-medium">{user.user_metadata?.maxTaskTime || '2'} hours</div>

                                    <div className="text-muted-foreground">Focus Ability:</div>
                                    <div className="font-medium capitalize">{user.user_metadata?.focusAbility || 'normal'}</div>

                                    <div className="text-muted-foreground">Task Shifting:</div>
                                    <div className="font-medium capitalize">{user.user_metadata?.taskShiftingAbility || 'normal'}</div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
