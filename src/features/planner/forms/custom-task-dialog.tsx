import React, { useState } from 'react';
import { X, Clock, Calendar, Check, Library, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCreateCustomTask } from '@/api/services/custom-task-service';
import { timeToMinutes, minutesToTime } from '@/utils/time-utils';
import { SimpleTimePicker } from '@/components/ui/simple-time-picker';
import { CUSTOM_TASK_COLORS } from '@/utils/color-utils';

interface CustomTaskDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: {
        name: string;
        description: string;
        startTime: string;
        endTime: string;
        daysOfWeek: string[];
        color?: string;
        saveToLibrary: boolean;
    }) => void;
    onDelete?: (id: string) => void;
    initialData?: {
        id?: string;
        name: string;
        description?: string;
        startTime: string;
        endTime: string;
        daysOfWeek: string[];
        color?: string;
    } | null;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const CustomTaskDialog: React.FC<CustomTaskDialogProps> = ({ isOpen, onClose, onConfirm, onDelete, initialData }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [durationPacks, setDurationPacks] = useState(2);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [color, setColor] = useState(CUSTOM_TASK_COLORS[0]);
    const [saveToLibrary, setSaveToLibrary] = useState(false);

    const endTime = minutesToTime(timeToMinutes(startTime) + durationPacks * 30);

    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name || '');
                setDescription(initialData.description || '');
                setStartTime(initialData.startTime || '09:00');

                // Calculate packs from endTime
                const startMin = timeToMinutes(initialData.startTime || '09:00');
                const endMin = timeToMinutes(initialData.endTime || '10:00');
                const diff = endMin < startMin ? (endMin + 1440 - startMin) : (endMin - startMin);
                const packs = Math.max(1, Math.round(diff / 30));

                setDurationPacks(packs);
                setSelectedDays(initialData.daysOfWeek || []);
                setColor(initialData.color || CUSTOM_TASK_COLORS[0]);
                setSaveToLibrary(false);
            } else {
                setName('');
                setDescription('');
                setStartTime('09:00');
                setDurationPacks(2);
                setSelectedDays([]);
                setColor(CUSTOM_TASK_COLORS[0]);
                setSaveToLibrary(false);
            }
        }
    }, [isOpen, initialData]);

    const createLibraryTask = useCreateCustomTask();

    if (!isOpen) return null;

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleConfirm = () => {
        if (!name) return;

        onConfirm({
            name,
            description,
            startTime,
            endTime,
            daysOfWeek: selectedDays,
            color,
            saveToLibrary
        });

        if (saveToLibrary) {
            createLibraryTask.mutate({
                name,
                description,
                startTime,
                endTime,
                daysOfWeek: selectedDays,
                color
            } as any); // Ignoring type issue here for color if API model needs update
        }

        setName('');
        setDescription('');
        setSelectedDays([]);
        setSaveToLibrary(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border shadow-2xl rounded-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-muted/20">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Library size={20} />
                        </div>
                        <h2 className="text-xl font-bold">Create Custom Task</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                        <X size={18} />
                    </Button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Task Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Deep Work Session"
                            className="text-base h-11"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 text-sm">Description (Optional)</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief details..."
                            className="h-10"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                                <Clock size={12} /> Start Time
                            </label>
                            <SimpleTimePicker
                                value={startTime}
                                onChange={(value: string) => setStartTime(value)}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                                <Clock size={12} /> Duration (30-min packs)
                            </label>
                            <Input
                                type="number"
                                min="1"
                                value={durationPacks}
                                onChange={(e) => setDurationPacks(parseInt(e.target.value) || 1)}
                                className="h-10"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1 text-right">
                                Ends at: <span className="font-bold text-primary">{endTime}</span>
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                            <Calendar size={12} /> Target Days
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SHORT_DAYS.map((day, idx) => {
                                const fullDayName = DAYS[idx];
                                const isSelected = selectedDays.includes(fullDayName);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(fullDayName)}
                                        className={cn(
                                            "h-9 px-3 rounded-md text-xs font-bold transition-all border",
                                            isSelected
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                : "bg-background text-muted-foreground border-border hover:border-primary/50"
                                        )}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Task Color</label>
                        <div className="flex gap-2.5">
                            {CUSTOM_TASK_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={cn(
                                        "w-8 h-8 rounded-full shadow-sm border-2 transition-transform hover:scale-110",
                                        color === c ? "border-foreground scale-110" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer select-none group border border-transparent hover:border-primary/20 transition-all"
                        onClick={() => setSaveToLibrary(!saveToLibrary)}
                    >
                        <div className={cn(
                            "w-5 h-5 rounded flex items-center justify-center transition-all",
                            saveToLibrary ? "bg-primary text-primary-foreground" : "bg-card border border-border group-hover:border-primary/50"
                        )}>
                            {saveToLibrary && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">Save to Library</span>
                            <span className="text-[10px] text-muted-foreground leading-none">Keep this task template for future quick scheduling</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-muted/10 flex items-center justify-between gap-3">
                    {initialData?.id && onDelete ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => {
                                if (initialData.id) {
                                    onDelete(initialData.id);
                                    onClose();
                                }
                            }}
                            title="Remove from Library"
                        >
                            <Trash2 size={20} />
                        </Button>
                    ) : (
                        <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl h-11">
                            Cancel
                        </Button>
                    )}

                    <div className="flex gap-3 flex-1">
                        {initialData?.id && onDelete && (
                            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-11">
                                Cancel
                            </Button>
                        )}
                        <Button
                            disabled={!name}
                            onClick={handleConfirm}
                            className="flex-1 rounded-xl h-11 shadow-lg shadow-primary/20"
                        >
                            Add to Planner
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};