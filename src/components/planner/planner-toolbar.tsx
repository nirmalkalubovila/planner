import { ChevronLeft, ChevronRight, Eraser, Target, Sparkles, Save, RotateCcw, Loader2, Plus, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeekUtils } from '@/utils/week-utils';
import { Goal, CustomTask } from '@/types/global-types';

interface PlannerToolbarProps {
    currentWeek: string;
    setCurrentWeek: (val: string) => void;
    selectedTool: 'erase' | 'goal';
    setSelectedTool: (val: 'erase' | 'goal') => void;
    selectedGoalId: string;
    setSelectedGoalId: (val: string) => void;
    activeGoalsForWeek: Goal[];
    activeGoal: Goal | undefined;
    goalStats: { title: string; allocatedSlots: number } | null;
    isGenerating: boolean;
    handleGenerateWeeklyPlan: () => void;
    onClear: () => void;
    onSave: () => void;
    onCreateCustomTask: (task?: CustomTask) => void;
    libraryTasks: CustomTask[];
}

export const PlannerToolbar: React.FC<PlannerToolbarProps> = ({
    currentWeek, setCurrentWeek,
    selectedTool, setSelectedTool,
    selectedGoalId, setSelectedGoalId,
    activeGoalsForWeek, activeGoal, goalStats,
    isGenerating, handleGenerateWeeklyPlan,
    onClear, onSave,
    onCreateCustomTask,
    libraryTasks
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
                    className="h-8 w-8"
                    onClick={() => setSelectedTool('erase')}
                    title="Erase Tool"
                >
                    <Eraser size={16} />
                </Button>
                <Button
                    variant={selectedTool === 'goal' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedTool('goal')}
                    title="Goal Tool"
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

            {/* Goal Target Group */}
            {selectedTool === 'goal' && (
                <div className="flex items-center gap-3 border-r border-border pr-4 shrink-0">
                    <select
                        value={selectedGoalId}
                        onChange={(e) => setSelectedGoalId(e.target.value)}
                        className="bg-transparent border border-border px-2 py-1.5 rounded-md text-xs w-40 truncate cursor-pointer hover:bg-accent focus:outline-none"
                        title="Select Active Goal"
                    >
                        <option value="">-- Choose Goal --</option>
                        {activeGoalsForWeek.map((g: Goal) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>

                    {goalStats && (
                        <div className="flex items-center gap-3 text-xs">
                            <span className="font-semibold text-primary" title="Time Scheduled This Week">
                                {Math.round(goalStats.allocatedSlots * 0.5 * 10) / 10}h
                            </span>
                            <Button
                                onClick={handleGenerateWeeklyPlan}
                                disabled={isGenerating || !activeGoal}
                                variant="outline"
                                size="sm"
                                className="h-8 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-blue-500/30 text-blue-600 hover:from-blue-600/20 hover:to-indigo-600/20"
                                title="AI Generate Week Plan"
                            >
                                {isGenerating ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                                {isGenerating ? '' : 'Auto-Plan'}
                            </Button>
                        </div>
                    )}
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
