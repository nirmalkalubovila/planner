import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  BookmarkPlus,
  ChevronDown,
  Cloud,
  Compass,
  Copy,
  Eraser,
  FolderHeart,
  Layers,
  Loader2,
  PanelRightOpen,
  Plus,
  Redo2,
  RotateCcw,
  Target,
  Undo2,
} from 'lucide-react-native';
import { CustomTask } from '@llb/core';
import { type PlannerTool } from '@/features/planner/hooks/use-planner-handlers';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { StandardDialog } from '@/components/common/standard-dialog';
import { cn } from '@/lib/cn';

interface PlannerToolbarProps {
  selectedTool: PlannerTool;
  setSelectedTool: (val: PlannerTool) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
  onCreateCustomTask: (task?: CustomTask) => void;
  libraryTasks: CustomTask[];
  missedTasks: CustomTask[];
  onGoalToolClick: () => void;
  onOpenSundayFocus: () => void;
  sundayFocusCount: number;
}

const TOOL_TINT: Record<string, string> = {
  erase: 'bg-destructive/15 border border-destructive/30',
  duplicate: 'bg-amber-500/15 border border-amber-500/30',
  goal: 'bg-primary/15 border border-primary/30',
};

/** RN port of apps/web/.../planner-toolbar.tsx's own MOBILE layout (that
 * file's lines 344-490): collapsed by default to a floating round button,
 * expanding into a floating bottom bar of tools with a chevron to collapse
 * again. Same grouping and default-collapsed behaviour.
 *
 * Web's Hand tool is absent by design: it exists only to arm HTML5
 * `draggable` on cells, whereas here a long-press already lifts a block,
 * so the button would be a mode switch for something that needs no mode. */
export const PlannerToolbar: React.FC<PlannerToolbarProps> = ({
  selectedTool,
  setSelectedTool,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  saveStatus,
  onCreateCustomTask,
  libraryTasks,
  missedTasks,
  onGoalToolClick,
  onOpenSundayFocus,
  sundayFocusCount,
}) => {
  // Shrunk by default for a cleaner landing — same default as web.
  const [isCollapsed, setIsCollapsed] = React.useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false);

  const renderTaskRow = (task: CustomTask, onPress: () => void, tintClassName: string) => (
    <Pressable
      key={task.id}
      onPress={onPress}
      className={cn('flex-row items-center justify-between p-3 rounded-xl border border-border mb-2', tintClassName)}
    >
      <View className="flex-1 min-w-0 mr-2">
        <Text className="text-sm font-semibold" numberOfLines={1}>
          {task.name}
        </Text>
        {!!task.description && (
          <Text variant="tiny" numberOfLines={1} className="mt-0.5">
            {task.description}
          </Text>
        )}
      </View>
      <Text variant="tiny" className="font-mono bg-muted px-2 py-1 rounded-md">
        {task.isReminder ? task.startTime : `${task.startTime}-${task.endTime}`}
      </Text>
    </Pressable>
  );

  return (
    <>
      {/* 1) Collapsed: a single floating trigger, right-aligned and
             vertically centred — exactly web's collapsed mobile state. */}
      {isCollapsed && (
        <Pressable
          onPress={() => setIsCollapsed(false)}
          style={{ position: 'absolute', right: 12, top: '45%' }}
          className="h-12 w-12 rounded-full bg-primary border border-border items-center justify-center shadow-2xl z-50"
        >
          <PanelRightOpen size={20} color="#0a0a0a" />
        </Pressable>
      )}

      {/* 2) Expanded: the floating bottom bar. */}
      {!isCollapsed && (
        <View
          style={{ position: 'absolute', bottom: 12, left: 8, right: 8 }}
          className="rounded-2xl bg-card border border-border shadow-2xl z-50 overflow-hidden"
        >
          <View className="flex-row items-center px-2 py-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1" contentContainerClassName="items-center gap-1 pr-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn('rounded-xl h-10 w-10', selectedTool === 'erase' && TOOL_TINT.erase)}
                onPress={() => setSelectedTool(selectedTool === 'erase' ? null : 'erase')}
              >
                <Eraser size={18} color={selectedTool === 'erase' ? '#ef4444' : '#a1a1aa'} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn('rounded-xl h-10 w-10', selectedTool === 'duplicate' && TOOL_TINT.duplicate)}
                onPress={() => setSelectedTool(selectedTool === 'duplicate' ? null : 'duplicate')}
              >
                <Copy size={18} color={selectedTool === 'duplicate' ? '#f59e0b' : '#a1a1aa'} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn('rounded-xl h-10 w-10', selectedTool === 'goal' && TOOL_TINT.goal)}
                onPress={() => {
                  if (selectedTool === 'goal') setSelectedTool(null);
                  else {
                    setSelectedTool('goal');
                    onGoalToolClick();
                  }
                }}
              >
                <Target size={18} color="#e4e4e7" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" onPress={() => onCreateCustomTask()}>
                <Plus size={22} strokeWidth={2.5} color="#e4e4e7" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 relative" onPress={onOpenSundayFocus}>
                <Compass size={18} color={sundayFocusCount >= 3 ? '#34d399' : '#a1a1aa'} />
                {sundayFocusCount > 0 && (
                  <View className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] items-center justify-center rounded-full bg-muted border border-border px-1">
                    <Text style={{ fontSize: 9, includeFontPadding: false }} className="font-bold font-mono">
                      {sundayFocusCount}
                    </Text>
                  </View>
                )}
              </Button>
            </ScrollView>

            <View className="w-px h-8 bg-border mx-1" />

            <View className="flex-row items-center">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onPress={() => setIsLibraryOpen(true)}>
                <FolderHeart size={18} color="#a1a1aa" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onPress={onUndo} disabled={!canUndo}>
                <Undo2 size={18} color="#a1a1aa" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onPress={onRedo} disabled={!canRedo}>
                <Redo2 size={18} color="#a1a1aa" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onPress={onClear}>
                <RotateCcw size={18} color="#ef4444" />
              </Button>
            </View>

            <View className="w-px h-8 bg-border mx-1" />

            <Pressable
              onPress={() => setIsCollapsed(true)}
              className="h-10 w-10 rounded-full border border-border bg-background/50 items-center justify-center"
            >
              <ChevronDown size={20} color="#a1a1aa" />
            </Pressable>
          </View>

          <View className="flex-row items-center justify-center gap-1.5 py-1 border-t border-border/50">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 size={11} color="#ef4444" />
                <Text style={{ fontSize: 10, includeFontPadding: false }} className="text-red-500 font-bold uppercase">
                  Syncing...
                </Text>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Cloud size={11} color="#34d399" />
                <Text style={{ fontSize: 10, includeFontPadding: false }} className="text-emerald-500 font-bold uppercase">
                  Plan Saved
                </Text>
              </>
            ) : (
              <>
                <Cloud size={11} color="#71717a" />
                <Text style={{ fontSize: 10, includeFontPadding: false }} className="text-muted-foreground font-bold uppercase">
                  Pending
                </Text>
              </>
            )}
          </View>
        </View>
      )}

      <StandardDialog isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} title="Task Library & Backlog" icon={FolderHeart}>
        <View className="p-4">
          <View className="flex-row items-center gap-2 mb-2">
            <BookmarkPlus size={14} color="#34d399" />
            <Text variant="tiny" className="uppercase font-bold text-emerald-400">
              Saved Templates ({libraryTasks.length})
            </Text>
          </View>
          {libraryTasks.length === 0 ? (
            <Text variant="small" className="italic mb-4">
              No saved tasks available
            </Text>
          ) : (
            libraryTasks.map(t =>
              renderTaskRow(
                t,
                () => {
                  onCreateCustomTask(t);
                  setIsLibraryOpen(false);
                },
                'bg-emerald-500/5'
              )
            )
          )}

          <View className="flex-row items-center gap-2 mb-2 mt-4">
            <Layers size={14} color="#fb923c" />
            <Text variant="tiny" className="uppercase font-bold text-orange-400">
              Backlog Tasks ({missedTasks.length})
            </Text>
          </View>
          {missedTasks.length === 0 ? (
            <Text variant="small" className="italic">
              No backlog items
            </Text>
          ) : (
            missedTasks.map(t =>
              renderTaskRow(
                t,
                () => {
                  onCreateCustomTask(t);
                  setIsLibraryOpen(false);
                },
                'bg-orange-500/5'
              )
            )
          )}
        </View>
      </StandardDialog>
    </>
  );
};
