import React from 'react';
import { Button } from '@/components/ui/button';
import { StandardDialog } from '@/components/common/standard-dialog';
import { cn } from '@/lib/utils';
import type { TaskItem } from '../hooks/use-today-tasks';

interface TaskDetailDialogProps {
    task: TaskItem | null;
    completed: boolean;
    onToggle: (taskId: string) => void;
    onClose: () => void;
}

const TYPE_LABEL: Record<string, string> = { goal: 'Goal', habit: 'Habit', custom: 'Task', reminder: 'Reminder' };

/**
 * The whole task, readable: the list truncates long names and descriptions, so a press-and-hold opens this.
 * It is a centred dialog on desktop and tablet and a near full-width sheet on phones (StandardDialog handles both).
 */
export const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({ task, completed, onToggle, onClose }) => {
    if (!task) return null;

    const label = task.isReminder ? TYPE_LABEL.reminder : TYPE_LABEL[task.type] ?? 'Task';
    const time = task.isReminder ? `At ${task.startTime}` : `${task.startTime} - ${task.endTime}`;

    return (
        <StandardDialog
            isOpen
            onClose={onClose}
            title={label}
            subtitle={time}
            maxWidth="lg"
            footer={
                <Button
                    onClick={() => { onToggle(task.id); onClose(); }}
                    className={cn(
                        'w-full h-11 rounded-2xl font-black uppercase tracking-wider text-xs',
                        completed && 'bg-muted text-foreground hover:bg-muted/80 border border-border',
                    )}
                >
                    {completed ? 'Mark Not Done' : 'Mark Complete'}
                </Button>
            }
        >
            <div className="space-y-3 px-5 py-4 sm:px-6">
                <h3 className="text-lg font-bold tracking-tight leading-snug break-words select-text">{task.name}</h3>
                {task.description ? (
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words select-text">{task.description}</p>
                ) : (
                    <p className="text-sm text-muted-foreground">No extra details for this one.</p>
                )}
            </div>
        </StandardDialog>
    );
};
