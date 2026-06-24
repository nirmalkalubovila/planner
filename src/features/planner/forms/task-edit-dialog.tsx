import React, { useState, useEffect } from 'react';
import { Check, Trash2, Tag, Target, FileText, Clock, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGetGoals } from '@/api/services/goal-service';
import { StandardDialog } from '@/components/common/standard-dialog';
import { SimpleTimePicker } from '@/components/ui/simple-time-picker';

interface TaskEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    onDelete: () => void;
    initialData: any;
}

export const TaskEditDialog: React.FC<TaskEditDialogProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [goalId, setGoalId] = useState('');
    const [isReminder, setIsReminder] = useState(false);
    const [time, setTime] = useState('09:00');
    const { data: goals } = useGetGoals();

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setGoalId(initialData.goalId || '');
            setIsReminder(!!initialData.isReminder);
            setTime(initialData.time || initialData.startTime || '09:00');
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        onSave({
            ...initialData,
            name,
            description,
            goalId: initialData.type === 'goal' ? goalId : undefined,
            isReminder,
            time,
        });
        onClose();
    };

    const isGoalType = initialData?.type === 'goal';
    const isHabitType = initialData?.type === 'habit';

    return (
        <StandardDialog
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit ${isReminder ? 'Reminder' : (isHabitType ? 'Habit' : (isGoalType ? 'Goal Task' : 'Custom Task'))}`}
            subtitle="Update details"
            icon={isReminder ? Clock : (isHabitType ? Repeat : (isGoalType ? Target : Tag))}
            iconClassName={cn(
                'p-2.5 rounded-xl shadow-sm',
                isReminder ? 'bg-rose-500/10 text-rose-500' : (isHabitType ? 'bg-emerald-500/10 text-emerald-500' : (isGoalType ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'))
            )}
            footer={
                <div className="flex items-center justify-between w-full">
                    {!isHabitType ? (
                        <Button
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl px-4 font-bold"
                            onClick={() => { onDelete(); }}
                        >
                            <Trash2 size={18} className="mr-2" /> Delete
                        </Button>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-3">
                        <Button variant="secondary" className="rounded-xl font-bold" onClick={onClose}>Cancel</Button>
                        <Button className="rounded-xl px-6 font-bold shadow-lg shadow-primary/10" onClick={handleSave}>
                            <Check size={18} className="mr-2" /> Save Changes
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                        <Tag size={12} /> Name / Title {isHabitType && "(Fixed)"}
                    </label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Working on..." className="text-base h-11 rounded-xl" autoFocus={!isHabitType} disabled={isHabitType} />
                </div>

                {isGoalType && !isReminder && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                            <Target size={12} /> Linked Goal
                        </label>
                        <select
                            value={goalId}
                            onChange={(e) => setGoalId(e.target.value)}
                            className="w-full h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value="">No Goal Linked</option>
                            {goals?.map(goal => (
                                <option key={goal.id} value={goal.id}>{goal.title || goal.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* When editing an existing reminder, show the time field directly (no checkbox needed) */}
                {isReminder && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                            <Clock size={12} /> Reminder Time
                        </label>
                        <SimpleTimePicker value={time} onChange={setTime} className="h-10" allowAllMinutes />
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                        <FileText size={12} /> Description (Optional)
                    </label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add notes about this task..." className="h-11 rounded-xl" autoFocus={isHabitType} />
                </div>
            </div>
        </StandardDialog>
    );
};
