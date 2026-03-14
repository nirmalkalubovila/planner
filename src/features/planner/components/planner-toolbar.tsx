import React, { useState } from 'react';
import { Eraser, Target, RotateCcw, Plus, Check, Undo2, Redo2, Copy, BookmarkPlus, Layers, PanelRightClose, PanelRightOpen, Cloud, Loader2, ChevronDown, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomTask } from '@/types/global-types';
import { cn } from '@/lib/utils';

interface PlannerToolbarProps {
    selectedTool: 'erase' | 'goal' | 'duplicate' | 'drag' | null;
    setSelectedTool: (val: 'erase' | 'goal' | 'duplicate' | 'drag' | null) => void;
    onClear: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    saveStatus: 'idle' | 'saving' | 'saved';

    onCreateCustomTask: (task?: CustomTask) => void;
    libraryTasks: CustomTask[];
    missedTasks: CustomTask[];
    previewPlan: any[] | null;
    onCancelPreview: () => void;
    commitPreviewPlan: () => void;
    onGoalToolClick: () => void;
}

export const PlannerToolbar: React.FC<PlannerToolbarProps> = ({
    selectedTool, setSelectedTool,
    onClear, onUndo, onRedo, canUndo, canRedo, saveStatus,
    onCreateCustomTask,
    libraryTasks, missedTasks,
    previewPlan, onCancelPreview, commitPreviewPlan,
    onGoalToolClick
}) => {
    // Shrinked by default for a cleaner landing
    const [isCollapsed, setIsCollapsed] = useState(true);

    const renderLibraryItems = (tasks: CustomTask[], title: string, colorClass: string, icon: React.ReactNode) => {
        const displayTasks = tasks.slice(0, 10);
        return (
            <div className="flex flex-col gap-2 shrink-0 w-full mb-5">
                <div className={cn("flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-black shadow-sm border bg-muted/10", colorClass)}>
                    <div className="flex items-center gap-1.5">
                        {icon} {title}
                    </div>
                    <span className="bg-background/80 px-1.5 py-0.5 rounded text-[9px] opacity-80">{displayTasks.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 w-full max-h-[250px] overflow-y-auto overflow-x-hidden custom-scrollbar pb-2 pt-1 transition-all">
                    {displayTasks.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground italic px-2">No tasks available</span>
                    ) : (
                        displayTasks.map(task => (
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
                                    "px-2 py-1 border rounded-md text-[10px] font-bold cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-background/80 shadow-sm max-w-[120px] truncate text-center touch-action-none",
                                    colorClass.includes("emerald") ? "hover:border-emerald-500/80 hover:bg-emerald-500/10 text-emerald-100" : "hover:border-orange-500/80 hover:bg-orange-500/10 text-orange-100"
                                )}
                                title={`Drag onto grid or click to apply: ${task.name}`}
                            >
                                {task.name}
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* ========================================= */}
            {/* DESKTOP LAYOUT (visible on md and above)  */}
            {/* ========================================= */}
            <div className={cn(
                "hidden md:flex flex-col bg-background/95 backdrop-blur-2xl border-white/10 z-[80] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 h-full relative top-0 right-0 rounded-none border-y-0 border-r-0 border-l translate-y-0 text-foreground shadow-none",
                isCollapsed ? "w-20" : "w-64"
            )}>
                {/* Toggle Handle - matches DashboardSidebar */}
                <div className={cn(
                    "flex items-center shrink-0 w-full",
                    isCollapsed ? "h-16 px-6 justify-center" : "h-16 px-6 justify-between border-b border-white/5"
                )}>
                    {!isCollapsed && (
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 select-none">
                            Tools
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            "transition-all duration-300 shrink-0 h-8 w-8 rounded-full",
                            isCollapsed
                                ? "bg-transparent text-white/30 hover:bg-white/5 hover:text-white md:shadow-none"
                                : "hover:bg-white/5 text-white/30 hover:text-white"
                        )}
                    >
                        {isCollapsed ? <PanelRightOpen size={16} className="pointer-events-none" /> : <PanelRightClose size={16} />}
                    </Button>
                </div>

                {/* Scrollable middle section: Tools and Libraries */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    <div className={cn(
                        "flex flex-col flex-1 transition-opacity duration-300",
                        isCollapsed ? "opacity-100 items-center py-4 px-2" : "opacity-100 p-4"
                    )}>
                        
                        {/* Quick Tools */}
                        <div className={cn(
                            "flex flex-col mb-6",
                            isCollapsed ? "gap-4 w-full animate-in fade-in duration-500" : "gap-1.5 animate-in fade-in slide-in-from-right-2 duration-500 delay-75"
                        )}>
                            {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Equipped Tool</span>}
                            <div className={cn(
                                "flex",
                                isCollapsed ? "flex-col gap-3 w-full" : "flex-row flex-wrap items-center gap-2"
                            )}>

                                {/* Group 1: Modifiers (Erase, Duplicate) */}
                                <div className={cn("flex", isCollapsed ? "flex-col gap-3 mt-2 pt-5 border-t border-white/10 relative" : "flex-row items-center gap-1.5 bg-primary/5 p-1.5 rounded-xl border border-primary/20 shadow-inner flex-1 justify-center")}>
                                    <Button
                                        variant={selectedTool === 'erase' ? 'secondary' : 'ghost'}
                                        size="icon"
                                        className={cn(
                                            "rounded-xl transition-all h-9 w-9",
                                            isCollapsed && "mx-auto",
                                            selectedTool === 'erase' ? "bg-destructive/15 text-destructive ring-1 ring-destructive/30 shadow-md scale-105" : "text-muted-foreground hover:bg-muted"
                                        )}
                                        onClick={() => setSelectedTool(selectedTool === 'erase' ? null : 'erase')}
                                        title="Erase Tool"
                                    >
                                        <Eraser size={14} />
                                    </Button>
                                    <Button
                                        variant={selectedTool === 'duplicate' ? 'secondary' : 'ghost'}
                                        size="icon"
                                        className={cn(
                                            "rounded-xl transition-all h-9 w-9",
                                            isCollapsed && "mx-auto",
                                            selectedTool === 'duplicate' ? "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30 shadow-md scale-105" : "text-muted-foreground hover:bg-muted"
                                        )}
                                        onClick={() => setSelectedTool(selectedTool === 'duplicate' ? null : 'duplicate')}
                                        title="Duplicate Tool"
                                    >
                                        <Copy size={14} />
                                    </Button>
                                    <Button
                                        variant={selectedTool === 'drag' ? 'secondary' : 'ghost'}
                                        size="icon"
                                        className={cn(
                                            "rounded-xl transition-all h-9 w-9",
                                            isCollapsed && "mx-auto",
                                            selectedTool === 'drag' ? "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30 shadow-md scale-105" : "text-muted-foreground hover:bg-muted"
                                        )}
                                        onClick={() => setSelectedTool(selectedTool === 'drag' ? null : 'drag')}
                                        title="Move Tool"
                                    >
                                        <Hand size={14} />
                                    </Button>
                                </div>

                                {/* Group 2: Creators (Goal, Custom Task) */}
                                <div className={cn("flex", isCollapsed ? "flex-col gap-3 mt-2 pt-5 border-t border-white/10 relative" : "flex-row items-center gap-1.5 bg-primary/5 p-1.5 rounded-xl border border-primary/20 shadow-inner flex-1 justify-center")}>
                                    {isCollapsed && <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 bg-background/80 px-1 text-[8px] font-black text-muted-foreground/50 rounded uppercase">Add</div>}
                                    <Button
                                        variant={selectedTool === 'goal' ? 'secondary' : 'ghost'}
                                        size="icon"
                                        className={cn(
                                            "rounded-xl transition-all h-9 w-9",
                                            isCollapsed && "mx-auto",
                                            selectedTool === 'goal' ? "bg-primary/15 text-primary ring-1 ring-primary/30 shadow-md scale-105" : "text-primary/70 hover:bg-primary/10 hover:text-primary"
                                        )}
                                        onClick={() => {
                                            if (selectedTool === 'goal') {
                                                setSelectedTool(null);
                                            } else {
                                                setSelectedTool('goal');
                                                onGoalToolClick();
                                            }
                                        }}
                                        title="Goal Tool"
                                    >
                                        <Target size={14} />
                                    </Button>
                                    <Button
                                        onClick={() => onCreateCustomTask()}
                                        variant="ghost"
                                        size="icon"
                                        className={cn("rounded-xl transition-all h-9 w-9", isCollapsed && "mx-auto")}
                                        title="Add Custom Task"
                                    >
                                        <Plus size={22} strokeWidth={2.5} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* History Tools */}
                        {!isCollapsed && (
                            <div className="flex flex-col gap-1.5 mb-6 animate-in fade-in slide-in-from-right-3 duration-500 delay-100">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">History</span>
                                <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-xl border border-white/5 shadow-inner">
                                    <Button variant="ghost" className="h-8 flex-1 rounded-lg text-muted-foreground text-[10px] font-bold disabled:opacity-30 bg-background/50" onClick={onUndo} disabled={!canUndo}>
                                        <Undo2 size={14} className="mr-1.5" /> UNDO
                                    </Button>
                                    <Button variant="ghost" className="h-8 flex-1 rounded-lg text-muted-foreground text-[10px] font-bold disabled:opacity-30 bg-background/50" onClick={onRedo} disabled={!canRedo}>
                                        REDO <Redo2 size={14} className="ml-1.5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* AI Preview */}
                        {previewPlan && !isCollapsed && (
                            <div className="flex flex-col gap-2 p-3 mb-6 bg-primary/10 rounded-xl border border-primary/20 animate-in slide-in-from-right-4 duration-500">
                                <span className="text-[10px] font-black tracking-widest text-primary/80 uppercase px-1">AI Preview</span>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="ghost" className="h-8 flex-1 text-[11px] font-bold text-destructive hover:bg-destructive/10 rounded-lg" onClick={onCancelPreview}>
                                        <RotateCcw size={14} className="mr-1.5" /> Revert
                                    </Button>
                                    <Button size="sm" className="h-8 flex-1 text-[11px] font-black bg-primary text-white shadow-lg shadow-primary/20 rounded-lg" onClick={commitPreviewPlan}>
                                        <Check size={14} className="mr-1.5" strokeWidth={3} /> Commit
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Libraries */}
                        {!isCollapsed && (
                            <div className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-500 delay-150">
                                {renderLibraryItems(libraryTasks, "Library", "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", <BookmarkPlus size={12} />)}
                                {renderLibraryItems(missedTasks, "Backlog", "bg-orange-500/10 text-orange-500 border-orange-500/20", <Layers size={12} />)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer: Actions & Save Status - STATIC (outside scrollable area) */}
                <div className={cn(
                    "flex flex-col border-t border-white/5 p-3 sm:p-4 gap-3 bg-muted/10 shrink-0",
                    !isCollapsed && "animate-in slide-in-from-bottom-5 duration-500 delay-200"
                )}>
                    {isCollapsed ? (
                        <div className="flex flex-col gap-3 items-center pt-2">
                            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl text-muted-foreground disabled:opacity-30 hover:bg-muted" onClick={onUndo} disabled={!canUndo} title="Undo">
                                <Undo2 size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl text-muted-foreground disabled:opacity-30 hover:bg-muted" onClick={onRedo} disabled={!canRedo} title="Redo">
                                <Redo2 size={14} />
                            </Button>
                            <div className="w-6 h-px bg-white/10 my-1" />
                            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl text-destructive hover:bg-destructive/10" onClick={onClear} title="Clear All">
                                <RotateCcw size={14} />
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" className="w-full h-10 rounded-xl font-bold text-destructive hover:bg-destructive/10 text-[11px]" onClick={onClear}>
                            <RotateCcw size={16} className="mr-2" /> CLEAR ALL
                        </Button>
                    )}

                    <div className={cn("flex items-center justify-center gap-1.5 pt-2 border-t border-white/5 mt-1", isCollapsed ? "flex-col" : "flex-row")}>
                        {saveStatus === 'saving' ? (
                            <>
                                <Loader2 size={14} className="animate-spin text-red-500" />
                                {!isCollapsed && <span className="text-[10px] text-red-500 font-bold select-none uppercase tracking-tighter">Syncing...</span>}
                            </>
                        ) : saveStatus === 'saved' ? (
                            <>
                                <Cloud size={14} className="text-emerald-500" />
                                {!isCollapsed && <span className="text-[10px] text-emerald-500 font-bold select-none uppercase tracking-tighter">Plan Saved</span>}
                            </>
                        ) : (
                            <>
                                <Cloud size={14} className="text-red-500 opacity-50" />
                                {!isCollapsed && <span className="text-[10px] text-red-500/50 font-bold select-none uppercase tracking-tighter">Pending</span>}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ========================================= */}
            {/* MOBILE LAYOUT (visible strictly on < md)  */}
            {/* ========================================= */}
            <div className="md:hidden z-[90] absolute inset-0 pointer-events-none">
                {/* 1) Small UI trigger (Floating button) when collapsed */}
                <div 
                    className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300",
                        isCollapsed ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none"
                    )}
                >
                    <Button
                        size="icon"
                        onClick={() => setIsCollapsed(false)}
                        className="h-12 w-12 rounded-full shadow-2xl shadow-black/50 bg-primary hover:bg-primary/90 text-primary-foreground border border-white/10"
                    >
                        <PanelRightOpen size={20} className="w-5 h-5 pointer-events-none" />
                    </Button>
                </div>

                {/* 2) Expanded Horizontal Toolbar (Bottom) when NOT collapsed */}
                <div 
                    className={cn(
                        "absolute bottom-4 left-2 right-2 flex flex-row items-center justify-around p-2 rounded-2xl bg-card/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-auto",
                        isCollapsed ? "opacity-0 translate-y-20 pointer-events-none" : "opacity-100 translate-y-0"
                    )}
                >
                    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar flex-1 mr-2 pb-0.5 min-w-0 pr-2">
                        <Button
                            variant={selectedTool === 'drag' ? 'secondary' : 'ghost'}
                            size="icon"
                            className={cn(
                                "shrink-0 rounded-xl transition-all h-10 w-10 sm:h-11 sm:w-11",
                                selectedTool === 'drag' ? "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30 shadow-md scale-105" : "text-muted-foreground hover:bg-muted"
                            )}
                            onClick={() => setSelectedTool(selectedTool === 'drag' ? null : 'drag')}
                        >
                            <Hand size={18} />
                        </Button>
                        <Button
                            variant={selectedTool === 'erase' ? 'secondary' : 'ghost'}
                            size="icon"
                            className={cn(
                                "shrink-0 rounded-xl transition-all h-10 w-10 sm:h-11 sm:w-11",
                                selectedTool === 'erase' ? "bg-destructive/15 text-destructive ring-1 ring-destructive/30 shadow-md scale-105" : "text-muted-foreground hover:bg-muted"
                            )}
                            onClick={() => setSelectedTool(selectedTool === 'erase' ? null : 'erase')}
                        >
                            <Eraser size={18} />
                        </Button>
                        <Button
                            variant={selectedTool === 'duplicate' ? 'secondary' : 'ghost'}
                            size="icon"
                            className={cn(
                                "shrink-0 rounded-xl transition-all h-10 w-10 sm:h-11 sm:w-11",
                                selectedTool === 'duplicate' ? "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30 shadow-md scale-105" : "text-muted-foreground hover:bg-muted"
                            )}
                            onClick={() => setSelectedTool(selectedTool === 'duplicate' ? null : 'duplicate')}
                        >
                            <Copy size={18} />
                        </Button>
                        <Button
                            variant={selectedTool === 'goal' ? 'secondary' : 'ghost'}
                            size="icon"
                            className={cn(
                                "shrink-0 rounded-xl transition-all h-10 w-10 sm:h-11 sm:w-11",
                                selectedTool === 'goal' ? "bg-primary/15 text-primary ring-1 ring-primary/30 shadow-md scale-105" : "text-primary/70 hover:bg-primary/10 hover:text-primary"
                            )}
                            onClick={() => {
                                if (selectedTool === 'goal') setSelectedTool(null);
                                else { setSelectedTool('goal'); onGoalToolClick(); }
                            }}
                        >
                            <Target size={18} />
                        </Button>
                        <Button
                            onClick={() => onCreateCustomTask()}
                            variant="ghost"
                            size="icon"
                            className="shrink-0 rounded-xl transition-all h-10 w-10 sm:h-11 sm:w-11"
                        >
                            <Plus size={22} strokeWidth={2.5} />
                        </Button>
                    </div>

                    <div className="w-px h-8 bg-white/15 mx-1" />

                    <div className="flex items-center gap-1">
                        <div className="flex items-center justify-center w-8">
                            {saveStatus === 'saving' ? (
                                <Loader2 size={16} className="animate-spin text-red-500" />
                            ) : saveStatus === 'saved' ? (
                                <Cloud size={16} className="text-emerald-500" />
                            ) : (
                                <Cloud size={16} className="text-red-500 opacity-50" />
                            )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl text-muted-foreground disabled:opacity-30" onClick={onUndo} disabled={!canUndo}>
                            <Undo2 size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl text-muted-foreground disabled:opacity-30" onClick={onRedo} disabled={!canRedo}>
                            <Redo2 size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl text-destructive hover:bg-destructive/10" onClick={onClear}>
                            <RotateCcw size={18} />
                        </Button>
                    </div>
                
                    <div className="w-px h-8 bg-white/15 mx-1" />

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-full shrink-0 border border-white/5 bg-background/50 hover:bg-background/80 hover:text-primary"
                        onClick={() => setIsCollapsed(true)}
                    >
                        <ChevronDown size={20} />
                    </Button>
                </div>
            </div>
        </>
    );
};
