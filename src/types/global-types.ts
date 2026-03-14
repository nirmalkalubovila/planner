// Barrel re-export for backward compatibility.
// New code should import from '@/types/domain' or '@/types/planner' directly.
export { Status, type GlobalRecords, type Habit, type Milestone, type AIGeneratedPlanSlot, type Goal, type CustomTask } from './domain';
export { type PlanSlot, type GridState } from './planner';
