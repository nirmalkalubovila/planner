import React, { useState, useEffect } from 'react';
import { Check, Trash2, Tag, Target, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGetGoals } from '@/api/services/goal-service';
import { StandardDialog } from '@/components/common/standard-dialog';

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
    const { data: goals } = useGetGoals();

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setGoalId(initialData.goalId || '');
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        onSave({
            ...initialData,
            name,
            description,
            goalId: initialData.type === 'goal' ? goalId : undefined
        });
        onClose();
    };

    const isGoalType = initialData?.type === 'goal';

    return (
        <StandardDialog
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit ${isGoalType ? 'Goal Task' : 'Custom Task'}`}
            subtitle="Update task details"
            icon={isGoalType ? Target : Tag}
            iconClassName={cn(
                'p-2.5 rounded-xl shadow-sm',
                isGoalType ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
            )}
            footer={
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl px-4 font-bold"
                        onClick={() => { onDelete(); onClose(); }}
                    >
                        <Trash2 size={18} className="mr-2" /> Delete
                    </Button>
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
                        <Tag size={12} /> Name / Title
                    </label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Working on..." className="text-base h-11 rounded-xl" autoFocus />
                </div>

                {isGoalType && (
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

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                        <FileText size={12} /> Description (Optional)
                    </label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add notes about this task..." className="h-11 rounded-xl" />
                </div>
            </div>
        </StandardDialog>
    );
};
