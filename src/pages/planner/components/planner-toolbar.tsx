import React from 'react';
import { ChevronLeft, ChevronRight, Eraser, Target, Sparkles, Save, RotateCcw, Plus, Library, Check, Undo2, Redo2, Copy, Lightbulb, BookmarkPlus, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeekUtils } from '@/utils/week-utils';
import { CustomTask } from '@/types/global-types';
import { cn } from '@/lib/utils';

interface PlannerToolbarProps {
    currentWeek: string;
    setCurrentWeek: (val: string) => void;
    selectedTool: 'erase' | 'goal' | 'duplicate' | null;
    setSelectedTool: (val: 'erase' | 'goal' | 'duplicate' | null) => void;
    onClear: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onSave: () => void;
    onCreateCustomTask: (task?: CustomTask) => void;
    libraryTasks: CustomTask[];
    missedTasks: CustomTask[];
    previewPlan: any[] | null;
    onCancelPreview: () => void;
    commitPreviewPlan: () => void;
    onGoalToolClick: () => void;
    onShowTips: () => void;
}

export const PlannerToolbar: React.FC<PlannerToolbarProps> = ({
    currentWeek, setCurrentWeek,
    selectedTool, setSelectedTool,
    onClear, onUndo, onRedo, canUndo, canRedo, onSave,
    onCreateCustomTask,
    libraryTasks, missedTasks,
    previewPlan, onCancelPreview, commitPreviewPlan,
    onGoalToolClick,
    onShowTips
}) => {

    const renderLibraryItems = (tasks: CustomTask[], title: string, color: string, icon: React.ReactNode) => (
        <div className="flex items-center gap-2 border-r border-border pr-2 shrink-0">
            <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-tighter font-bold shadow-sm", color)}>
                {icon} {title}
            </div>
            <div className="flex items-center gap-1.5 max-w-[200px] overflow-x-auto hide-scrollbar">
                {tasks.length === 0 ? (
                    <span className="text-[8px] text-muted-foreground italic truncate">Empty</span>
                ) : (
                    tasks.map(task => (
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
                            className={cn("px-1.5 py-0.5 border rounded text-[9px] font-bold cursor-grab active:cursor-grabbing hover:scale-105 transition-all shrink-0 shadow-sm", color)}
                            title={`Drag onto grid or click to apply`}
                        >
                            {task.name}
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="flex items-center gap-4 bg-card py-2 px-4 rounded-xl border shadow-sm w-full mb-4 relative z-50">
            {/* Scrollable Content Container */}
            <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar flex-1 pr-4">
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
                        variant={selectedTool === 'duplicate' ? 'secondary' : 'ghost'}
                        size="icon"
                        className={cn(
                            "h-8 w-8 transition-all duration-200",
                            selectedTool === 'duplicate' ? "bg-amber-500/20 text-amber-600 scale-110 shadow-sm" : "text-muted-foreground"
                        )}
                        onClick={() => setSelectedTool(selectedTool === 'duplicate' ? null : 'duplicate')}
                        title="Duplicate Tool (Stamp) - Click a task to copy, then click empty slots to paste"
                    >
                        <Copy size={16} />
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
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20 text-[10px] font-bold uppercase tracking-wider mr-1">
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
                            className="h-8 text-xs font-semibold text-primary hover:bg-primary/10"
                            onClick={onGoalToolClick}
                        >
                            <RotateCcw size={14} className="mr-1.5" /> Re-make
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm ring-1 ring-primary/50"
                            onClick={commitPreviewPlan}
                        >
                            <Check size={14} className="mr-1.5" strokeWidth={3} /> Add this
                        </Button>
                    </div>
                )}

                {/* Libraries */}
                {renderLibraryItems(libraryTasks, "Customs", "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", <BookmarkPlus size={10} />)}
                {renderLibraryItems(missedTasks, "Missed", "bg-orange-500/10 text-orange-600 border-orange-500/20", <Layers size={10} />)}
            </div>

            {/* General Actions & Save Group */}
            <div className="flex items-center gap-2 shrink-0 ml-auto pl-4 border-l border-border relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all duration-200"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowTips();
                    }}
                    title="Planner Tips"
                >
                    <Lightbulb size={18} />
                </Button>

                <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onClear} title="Clear Grid">
                    <RotateCcw size={16} className="md:mr-2" />
                    <span className="hidden md:inline">Clear</span>
                </Button>
                <Button variant="default" size="sm" className="h-8 font-bold shadow-lg" onClick={onSave} title="Save Plan">
                    <Save size={16} className="md:mr-2" />
                    <span className="hidden md:inline">Save</span>
                </Button>
            </div>
        </div>
    );
};

