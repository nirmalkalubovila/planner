import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eraser, Target, Sparkles, Save, RotateCcw, Plus, Check, Undo2, Redo2, Copy, Lightbulb, BookmarkPlus, Layers, ChevronDown, ChevronUp } from 'lucide-react';
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
    const [isCollapsed, setIsCollapsed] = useState(false);

    const renderLibraryItems = (tasks: CustomTask[], title: string, colorClass: string, icon: React.ReactNode) => (
        <div className="flex items-center gap-3 shrink-0">
            <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] uppercase tracking-wider font-black shadow-sm border", colorClass)}>
                {icon} {title}
            </div>
            <div className="flex items-center gap-2 max-w-[500px] overflow-x-auto hide-scrollbar py-0.5">
                {tasks.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground italic px-2">No tasks available</span>
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
                            className={cn(
                                "px-3 py-1.5 border rounded-lg text-[11px] font-bold cursor-grab active:cursor-grabbing hover:scale-105 hover:shadow-md transition-all shrink-0 bg-background/50",
                                colorClass.includes("emerald") ? "hover:border-emerald-500/50" : "hover:border-orange-500/50"
                            )}
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
        <div className={cn(
            "flex flex-col bg-card/90 backdrop-blur-xl rounded-[20px] border shadow-xl w-full relative z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
            isCollapsed ? "py-0.5 px-4 h-[40px] mb-2" : "py-4 px-6 gap-4 min-h-[140px] mb-4"
        )}>
            {/* Collapse Toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-5 w-14 rounded-t-2xl bg-muted/50 hover:bg-primary/20 border-t border-x z-[60] group border-b-transparent transition-all duration-200"
            >
                {isCollapsed ? <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" /> : <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />}
            </Button>

            {/* Row 1: Primary Controls */}
            <div className={cn(
                "flex items-center justify-between gap-4 transition-all duration-300 origin-left h-full",
                isCollapsed ? "scale-[0.92] opacity-100" : "scale-100 opacity-100"
            )}>
                <div className="flex items-center gap-6">
                    {/* Week Nav Group */}
                    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-2xl border border-border/40">
                        <Button variant="ghost" size="icon" className={cn("rounded-xl hover:bg-background shadow-sm transition-all", isCollapsed ? "h-7 w-7" : "h-9 w-9")} onClick={() => setCurrentWeek(WeekUtils.addWeeks(currentWeek, -1))} title="Previous Week">
                            <ChevronLeft size={isCollapsed ? 14 : 18} />
                        </Button>
                        <div className={cn("text-center px-2", isCollapsed ? "min-w-[100px]" : "min-w-[140px]")}>
                            <h2 className={cn("font-black tracking-tight text-foreground/90", isCollapsed ? "text-[12px]" : "text-sm")}>{WeekUtils.formatWeekDisplay(currentWeek)}</h2>
                        </div>
                        <Button variant="ghost" size="icon" className={cn("rounded-xl hover:bg-background shadow-sm transition-all", isCollapsed ? "h-7 w-7" : "h-9 w-9")} onClick={() => setCurrentWeek(WeekUtils.addWeeks(currentWeek, 1))} title="Next Week">
                            <ChevronRight size={isCollapsed ? 14 : 18} />
                        </Button>
                    </div>

                    {!isCollapsed && (
                        <>
                            {/* Tools Group */}
                            <div className="flex items-center gap-1.5 bg-muted/20 p-1 rounded-2xl border border-border/40 animate-in fade-in slide-in-from-left-2 duration-300">
                                <Button
                                    variant={selectedTool === 'erase' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className={cn(
                                        "h-9 w-9 rounded-xl transition-all duration-300",
                                        selectedTool === 'erase' ? "bg-destructive/15 text-destructive scale-110 shadow-lg ring-1 ring-destructive/30" : "text-muted-foreground hover:bg-background"
                                    )}
                                    onClick={() => setSelectedTool(selectedTool === 'erase' ? null : 'erase')}
                                    title="Erase Tool (ESC to exit)"
                                >
                                    <Eraser size={18} />
                                </Button>
                                <Button
                                    variant={selectedTool === 'goal' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className={cn(
                                        "h-9 w-9 rounded-xl transition-all duration-300",
                                        selectedTool === 'goal' ? "bg-primary/15 text-primary scale-110 shadow-lg ring-1 ring-primary/30" : "text-muted-foreground hover:bg-background"
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
                                    <Target size={18} />
                                </Button>
                                <Button
                                    variant={selectedTool === 'duplicate' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className={cn(
                                        "h-9 w-9 rounded-xl transition-all duration-300",
                                        selectedTool === 'duplicate' ? "bg-amber-500/15 text-amber-600 scale-110 shadow-lg ring-1 ring-amber-500/30" : "text-muted-foreground hover:bg-background"
                                    )}
                                    onClick={() => setSelectedTool(selectedTool === 'duplicate' ? null : 'duplicate')}
                                    title="Duplicate Tool (Stamp) - Click a task to copy, then click empty slots to paste"
                                >
                                    <Copy size={18} />
                                </Button>
                                <div className="w-px h-6 bg-border/50 mx-1" />
                                <Button
                                    onClick={() => onCreateCustomTask()}
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl text-primary hover:bg-primary/10 hover:shadow-inner transition-all"
                                    title="Create Advanced Custom Task"
                                >
                                    <Plus size={20} strokeWidth={2.5} />
                                </Button>
                            </div>

                            {/* Undo/Redo Group */}
                            <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-2xl border border-border/40 animate-in fade-in slide-in-from-left-4 duration-500">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-muted-foreground disabled:opacity-20 transition-all"
                                    onClick={onUndo}
                                    disabled={!canUndo}
                                    title="Undo (Ctrl+Z)"
                                >
                                    <Undo2 size={16} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-muted-foreground disabled:opacity-20 transition-all"
                                    onClick={onRedo}
                                    disabled={!canRedo}
                                    title="Redo (Ctrl+Y)"
                                >
                                    <Redo2 size={16} />
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* AI Preview Actions - Floating style */}
                    {previewPlan && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-2xl border border-primary/20 animate-in zoom-in-95 duration-500 shadow-sm">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest">
                                <Sparkles size={12} className="animate-pulse" /> AI Preview
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-[11px] font-bold hover:bg-destructive/10 hover:text-destructive rounded-xl"
                                onClick={onCancelPreview}
                            >
                                <RotateCcw size={14} className="mr-1.5" /> Cancel
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 text-[11px] font-black bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl"
                                onClick={commitPreviewPlan}
                            >
                                <Check size={14} className="mr-1.5" strokeWidth={3} /> Commit Plan
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                        {!isCollapsed && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all duration-300 shadow-sm border border-transparent hover:border-amber-500/20 shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShowTips();
                                }}
                                title="Planner Tips"
                            >
                                <Lightbulb size={22} />
                            </Button>
                        )}

                        {!isCollapsed && <div className="w-px bg-border/60 mx-1 h-8 shrink-0" />}

                        {!isCollapsed && (
                            <Button variant="ghost" size="sm" className="h-10 px-4 rounded-2xl font-bold text-destructive hover:bg-destructive/10 transition-all shrink-0" onClick={onClear} title="Clear Grid">
                                <RotateCcw size={16} className="mr-2" /> Clear
                            </Button>
                        )}
                        
                        <Button 
                            variant="default" 
                            size="sm" 
                            className={cn(
                                "rounded-xl font-black shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.03] active:scale-95 shrink-0 flex items-center justify-center", 
                                isCollapsed ? "h-7 px-4 text-[10px]" : "h-10 px-8 text-sm"
                            )} 
                            onClick={onSave} 
                            title="Save Plan"
                        >
                            <Save size={isCollapsed ? 13 : 18} className="mr-1.5" /> SAVE
                        </Button>
                    </div>
                </div>
            </div>

            {/* Row 2: Task Libraries */}
            {!isCollapsed && (
                <div className="flex flex-col gap-2 pt-1 border-t border-border/40 animate-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center gap-8 overflow-x-auto hide-scrollbar py-1">
                        {renderLibraryItems(libraryTasks, "Custom Library", "bg-emerald-500/5 text-emerald-600 border-emerald-500/20", <BookmarkPlus size={12} />)}
                        <div className="w-px h-8 bg-border/40 shrink-0" />
                        {renderLibraryItems(missedTasks, "Missed Backlog", "bg-orange-500/5 text-orange-600 border-orange-500/20", <Layers size={12} />)}
                    </div>
                </div>
            )}
        </div>
    );
};



