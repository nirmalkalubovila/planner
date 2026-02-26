import React from 'react';
import { useReflectionStore } from './reflection-store';
import { Button } from '@/components/ui/button';
import { useCreateCustomTask } from '@/api/services/custom-task-service';
import { useCreateMissedTask } from '@/api/services/missed-task-service';
import { ArrowLeft, ArrowRight, Library, Trash2, CalendarX2, CheckCircle2, BookmarkPlus, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

export const StepMissed: React.FC<{ onSkip: () => void, onPrev: () => void }> = ({ onSkip, onPrev }) => {
    const { missedTasks, removeMissedTask } = useReflectionStore();
    const createCustomTask = useCreateCustomTask();
    const createMissedTask = useCreateMissedTask();

    const handleAdd = async (task: any, libraryType: 'custom' | 'missed') => {
        try {
            const taskData = {
                name: task.name,
                startTime: "09:00", 
                endTime: "10:00",
                daysOfWeek: []
            };

            if (libraryType === 'custom') {
                await createCustomTask.mutateAsync(taskData);
            } else {
                await createMissedTask.mutateAsync(taskData);
            }
            removeMissedTask(task.id);
        } catch (error) {
            console.error(error);
        }
    };

    const handleFinish = async () => {
        // Record that user has done reflection for this week to prevent loop
        const now = new Date().toISOString();
        await supabase.auth.updateUser({
            data: {
                lastReflectionDate: now
            }
        });
        onSkip(); // will navigate to planner and reset store
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-2xl mx-auto">
            <div className="space-y-4 text-center">
                <div className="inline-block p-4 bg-orange-500/20 rounded-full text-orange-500 mb-2 shadow-inner">
                    <CalendarX2 size={40} />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Missed Tasks</h2>
                <p className="text-muted-foreground w-full">
                    These are the tasks you left on the table. Move them to your libraries to plan them next week, or delete them.
                </p>
            </div>

            <Card className="w-full bg-card/40 border-orange-500/20 shadow-2xl backdrop-blur-md">
                <CardContent className="p-6">
                    {missedTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                            <CheckCircle2 size={48} className="text-emerald-500 mb-2" />
                            <h3 className="text-xl font-bold text-emerald-500">All Clear!</h3>
                            <p className="text-muted-foreground">You have handled all missed tasks.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {missedTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:bg-muted/50 transition-colors group">
                                    <span className="font-semibold text-base">{task.name}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-9 hover:bg-primary/10 hover:text-primary transition-colors text-[10px] sm:text-xs"
                                            onClick={() => handleAdd(task, 'custom')}
                                            disabled={createCustomTask.isPending || createMissedTask.isPending}
                                        >
                                            <BookmarkPlus size={14} className="mr-1 sm:mr-2" /> <span className="hidden sm:inline">Add to</span> Customs
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-9 hover:bg-orange-500/10 hover:text-orange-500 transition-colors text-[10px] sm:text-xs"
                                            onClick={() => handleAdd(task, 'missed')}
                                            disabled={createCustomTask.isPending || createMissedTask.isPending}
                                        >
                                            <Layers size={14} className="mr-1 sm:mr-2" /> <span className="hidden sm:inline">Move to</span> Missed
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                            onClick={() => removeMissedTask(task.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center gap-4 pt-8 w-full justify-center">
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-2" onClick={onPrev}>
                    <ArrowLeft className="mr-2" /> Back
                </Button>
                <Button
                    size="lg"
                    className="h-14 px-8 rounded-full shadow-lg transition-transform hover:scale-105 bg-primary hover:bg-primary/90"
                    onClick={handleFinish}
                >
                    Finish Reflection & Plan <ArrowRight className="ml-2" />
                </Button>
            </div>
        </div>
    );
};

