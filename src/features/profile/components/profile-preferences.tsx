import React from 'react';
import { format } from 'date-fns';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { SimpleTimePicker } from '@/components/ui/simple-time-picker';
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfilePreferencesProps {
    user: any;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    loading: boolean;
    onSave: () => void;
    formData: {
        fullName: string;
        setFullName: (val: string) => void;
        dob: string;
        setDob: (val: string) => void;
        sleepStart: string;
        setSleepStart: (val: string) => void;
        sleepDuration: string;
        setSleepDuration: (val: string) => void;
        weekStart: string;
        setWeekStart: (val: string) => void;
        planDay: string;
        setPlanDay: (val: string) => void;
        planStartTime: string;
        setPlanStartTime: (val: string) => void;
        planEndTime: string;
        setPlanEndTime: (val: string) => void;
        primaryLifeFocus: string;
        setPrimaryLifeFocus: (val: string) => void;
        currentProfession: string;
        setCurrentProfession: (val: string) => void;
        energyPeakTime: string;
        setEnergyPeakTime: (val: string) => void;
        focusAbility: string;
        setFocusAbility: (val: string) => void;
        taskShiftingAbility: string;
        setTaskShiftingAbility: (val: string) => void;
    };
}

const labelClass = "text-xs font-semibold text-muted-foreground ml-0.5";

export const ProfilePreferences: React.FC<ProfilePreferencesProps> = ({
    user, isEditing, setIsEditing, loading, onSave, formData
}) => {
    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Planner Preferences</h3>
                {!isEditing && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="h-8 px-3 rounded-lg text-xs text-muted-foreground hover:text-primary"
                    >
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                    </Button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Full Name</label>
                            <Input value={formData.fullName} onChange={(e) => formData.setFullName(e.target.value)} className="h-10 rounded-xl bg-muted border-border" />
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Date of Birth</label>
                            <CustomDatePicker
                                selected={formData.dob ? new Date(formData.dob) : null}
                                onChange={(date) => formData.setDob(date ? format(date, 'yyyy-MM-dd') : '')}
                                placeholderText="Select date"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Sleep Start Time</label>
                            <SimpleTimePicker value={formData.sleepStart} onChange={formData.setSleepStart} />
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Sleep Duration (hours)</label>
                            <Input type="number" min="1" max="24" value={formData.sleepDuration} onChange={(e) => formData.setSleepDuration(e.target.value)} className="h-10 rounded-xl bg-muted border-border" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Week Starts On</label>
                            <Select value={formData.weekStart} onValueChange={formData.setWeekStart}>
                                <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                                <SelectContent>
                                    {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => (
                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Planning Day</label>
                            <Select value={formData.planDay} onValueChange={formData.setPlanDay}>
                                <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                                <SelectContent>
                                    {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => (
                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Planning Start Time</label>
                            <SimpleTimePicker value={formData.planStartTime} onChange={formData.setPlanStartTime} />
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Planning End Time</label>
                            <SimpleTimePicker value={formData.planEndTime} onChange={formData.setPlanEndTime} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Primary Life Focus</label>
                            <Input value={formData.primaryLifeFocus} onChange={(e) => formData.setPrimaryLifeFocus(e.target.value)} placeholder="e.g., Career, Health" className="h-10 rounded-xl bg-muted border-border" />
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Profession / Status</label>
                            <Input value={formData.currentProfession} onChange={(e) => formData.setCurrentProfession(e.target.value)} placeholder="e.g., Engineer, Student" className="h-10 rounded-xl bg-muted border-border" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-border">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Energy Peak</label>
                            <Select value={formData.energyPeakTime} onValueChange={formData.setEnergyPeakTime}>
                                <SelectTrigger><SelectValue placeholder="Select peak" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Morning">Morning</SelectItem>
                                    <SelectItem value="Afternoon">Afternoon</SelectItem>
                                    <SelectItem value="Evening">Evening</SelectItem>
                                    <SelectItem value="Night">Night</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Focus Ability</label>
                            <Select value={formData.focusAbility} onValueChange={formData.setFocusAbility}>
                                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="very low">Very Low</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="very high">Very High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Task Switching</label>
                            <Select value={formData.taskShiftingAbility} onValueChange={formData.setTaskShiftingAbility}>
                                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="very low">Very Low</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="very high">Very High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button onClick={onSave} disabled={loading} className="flex-1 h-10 rounded-xl font-semibold">
                            <Check className="h-4 w-4 mr-1.5" /> Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading} className="flex-1 h-10 rounded-xl font-semibold border-border">
                            <X className="h-4 w-4 mr-1.5" /> Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-5">
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Sleep</p>
                            <p className="text-sm font-medium">{user.user_metadata?.sleepStart || '22:00'} ({user.user_metadata?.sleepDuration || '8'}h)</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Week Start</p>
                            <p className="text-sm font-medium">{user.user_metadata?.weekStart || 'Monday'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Planning</p>
                            <p className="text-sm font-medium">{user.user_metadata?.planDay || 'Sunday'} {user.user_metadata?.planStartTime || '21:00'} - {user.user_metadata?.planEndTime || '22:00'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Focus</p>
                            <p className="text-sm font-medium">{user.user_metadata?.primaryLifeFocus || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Profession</p>
                            <p className="text-sm font-medium">{user.user_metadata?.currentProfession || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Energy Peak</p>
                            <p className="text-sm font-medium">{user.user_metadata?.energyPeakTime || 'Morning'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Focus Level</p>
                            <p className="text-sm font-medium capitalize">{user.user_metadata?.focusAbility || 'Normal'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Task Switching</p>
                            <p className="text-sm font-medium capitalize">{user.user_metadata?.taskShiftingAbility || 'Normal'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
