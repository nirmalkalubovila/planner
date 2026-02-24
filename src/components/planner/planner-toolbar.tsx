import { ChevronLeft, ChevronRight, Eraser, Target, Sparkles, Save, RotateCcw, Plus, Library, Check, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeekUtils } from '@/utils/week-utils';
import { CustomTask } from '@/types/global-types';
import { cn } from '@/lib/utils';

interface PlannerToolbarProps {
    currentWeek: string;
    setCurrentWeek: (val: string) => void;
    selectedTool: 'erase' | 'goal' | null;
    setSelectedTool: (val: 'erase' | 'goal' | null) => void;
    onClear: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onSave: () => void;
    onCreateCustomTask: (task?: CustomTask) => void;
    libraryTasks: CustomTask[];
    previewPlan: any[] | null;
    onCancelPreview: () => void;
    commitPreviewPlan: () => void;
    onGoalToolClick: () => void;
}

export const PlannerToolbar: React.FC<PlannerToolbarProps> = ({
    currentWeek, setCurrentWeek,
    selectedTool, setSelectedTool,
    onClear, onUndo, onRedo, canUndo, canRedo, onSave,
    onCreateCustomTask,
    libraryTasks,
    previewPlan, onCancelPreview, commitPreviewPlan,
    onGoalToolClick
}) => {
    return (
        <div className="flex items-center gap-4 bg-card py-2 px-4 rounded-xl border shadow-sm w-full overflow-x-auto whitespace-nowrap mb-4 hide-scrollbar">

            {/* Week Nav Group */}
            <div className="flex items-center gap-2 border-r border-border pr-4 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentWeek(WeekUtils.addWeeks(currentWeek, -1))} title="Previous Week">
                    <ChevronLeft size={16} />
                </Button>
                <div className="text-center min-w-[120px]">
                    <h2 className="text-sm font-bold truncate">{WeekUtils.formatWeekDisplay(currentWeek)}</h2>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentWeek(WeekUtils.addWeeks(currentWeek, 1))} title="Next Week">
                    <ChevronRight size={16} />
                </Button>
            </div>

            {/* Tools Group */}
            <div className="flex items-center gap-1 border-r border-border pr-4 shrink-0">
                <Button
                    variant={selectedTool === 'erase' ? 'secondary' : 'ghost'}
                    size="icon"
                    className={cn(
                        "h-8 w-8 transition-all duration-200",
                        selectedTool === 'erase' ? "bg-destructive/20 text-destructive scale-110 shadow-sm" : "text-muted-foreground"
                    )}
                    onClick={() => setSelectedTool(selectedTool === 'erase' ? null : 'erase')}
                    title="Erase Tool (ESC to exit)"
                >
                    <Eraser size={16} />
                </Button>
                <Button
                    variant={selectedTool === 'goal' ? 'secondary' : 'ghost'}
                    size="icon"
                    className={cn(
                        "h-8 w-8 transition-all duration-200",
                        selectedTool === 'goal' ? "bg-primary/20 text-primary scale-110 shadow-sm" : "text-muted-foreground"
                    )}
                    onClick={() => {
                        if (selectedTool === 'goal') {
                            setSelectedTool(null);
                        } else {
                            setSelectedTool('goal');
                            onGoalToolClick();
                        }
                    }}
                    title="Goal Tool (ESC to exit)"
                >
                    <Target size={16} />
                </Button>
                <Button
                    onClick={() => onCreateCustomTask()}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:bg-primary/10"
                    title="Create Advanced Custom Task"
                >
                    <Plus size={16} />
                </Button>
            </div>

            {/* Undo/Redo Group */}
            <div className="flex items-center gap-1 border-r border-border pr-4 shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground disabled:opacity-30"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 size={16} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground disabled:opacity-30"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo2 size={16} />
                </Button>
            </div>

            {/* AI Preview Actions */}
            {previewPlan && (
                <div className="flex items-center gap-2 border-r border-border pr-4 shrink-0 animate-in slide-in-from-left-2 duration-300">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 text-blue-600 rounded-lg border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider mr-1">
                        <Sparkles size={12} className="animate-pulse" /> AI Plan Previewing
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive"
                        onClick={onCancelPreview}
                    >
                        <RotateCcw size={14} className="mr-1.5" /> Cancel
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs font-semibold text-blue-600 hover:bg-blue-600/10"
                        onClick={onGoalToolClick}
                    >
                        <RotateCcw size={14} className="mr-1.5" /> Re-make
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm ring-1 ring-blue-500/50"
                        onClick={commitPreviewPlan}
                    >
                        <Check size={14} className="mr-1.5" strokeWidth={3} /> Add this
                    </Button>
                </div>
            )}

            {/* Task Library */}
            <div className="flex items-center gap-2 border-r border-border pr-4 shrink-0">
                <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-[10px] uppercase tracking-tighter font-bold text-muted-foreground">
                    <Library size={10} /> Library
                </div>
                <div className="flex items-center gap-2 max-w-[300px] overflow-x-auto hide-scrollbar">
                    {libraryTasks.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground italic">No saved tasks yet</span>
                    ) : (
                        libraryTasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => onCreateCustomTask(task)}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('sourceNewTask', JSON.stringify({
                                        type: 'custom',
                                        name: task.name,
                                        startTime: task.startTime,
                                        endTime: task.endTime,
                                        description: task.description
                                    }));
                                }}
                                className="px-2 py-1 bg-primary/5 text-primary border border-primary/20 rounded text-[10px] font-bold cursor-pointer hover:bg-primary/10 transition-colors"
                                title={`Click to use or Drag onto grid`}
                            >
                                {task.name}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* General Actions & Save Group */}
            <div className="flex items-center gap-2 shrink-0 ml-auto pl-4 border-l border-border">
                <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onClear} title="Clear Grid">
                    <RotateCcw size={16} className="md:mr-2" />
                    <span className="hidden md:inline">Clear</span>
                </Button>
                <Button variant="default" size="sm" className="h-8" onClick={onSave} title="Save Plan">
                    <Save size={16} className="md:mr-2" />
                    <span className="hidden md:inline">Save</span>
                </Button>
            </div>

        </div>
    );
};
