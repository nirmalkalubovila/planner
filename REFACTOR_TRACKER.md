# Refactor Tracker

All changes are logged here with date, file, action, and reasoning.

| Date/Time | File | Action | Reasoning |
|-----------|------|--------|-----------|
| 2026-03-14 | `REFACTOR_TRACKER.md` | Created | Foundation: tracking document per directive |
| 2026-03-14 | `src/constants/scheduling.ts` | Created | Scalability: DAYS_OF_WEEK duplicated in 6 files, centralized |
| 2026-03-14 | `src/types/domain.ts` | Created (split from global-types) | Scalability: Single file mixed domain/UI/AI types |
| 2026-03-14 | `src/types/planner.ts` | Created (split from global-types) | Scalability: Separate planner types |
| 2026-03-14 | `src/types/global-types.ts` | Converted to barrel re-export | Scalability: Backward compat while types are split |
| 2026-03-14 | `src/api/helpers/auth-helpers.ts` | Created | Cleanup: Auth boilerplate duplicated 12+ times across services |
| 2026-03-14 | `src/utils/reflection-utils.ts` | Deleted | Cleanup: Entire file is dead code, never imported |
| 2026-03-14 | `src/components/ui/label.tsx` | Deleted | Cleanup: Never imported anywhere |
| 2026-03-14 | `src/components/ui/textarea.tsx` | Deleted | Cleanup: Never imported anywhere |
| 2026-03-14 | `src/components/ui/time-picker.tsx` | Deleted | Cleanup: Superseded by simple-time-picker |
| 2026-03-14 | `src/features/habits/forms/habit-definition-form.tsx` | Migrated CustomTimePicker -> SimpleTimePicker | Cleanup: Removing time-picker dependency |
| 2026-03-14 | `src/components/ui/form-components.tsx` | Removed unused FormSelect, FormSection | Cleanup: Never used outside file |
| 2026-03-14 | `src/components/ui/ai-loading.tsx` | Removed unused AiLoadingOverlay, AiInlineLoading | Cleanup: Never imported |
| 2026-03-14 | `src/utils/time.ts` | Created (canonical source) | Scalability: New file with slot helpers (timeToSlot, slotKey, slotToTime) |
| 2026-03-14 | `src/utils/week.ts` | Created (canonical source, removed isDayInWeek, formatWeekRange) | Cleanup: Dead functions removed |
| 2026-03-14 | `src/utils/color.ts` | Created (canonical source) | Scalability: Clean canonical file |
| 2026-03-14 | `src/utils/time-utils.ts` | Converted to re-export shim | Scalability: Backward compat |
| 2026-03-14 | `src/utils/week-utils.ts` | Converted to re-export shim | Scalability: Backward compat |
| 2026-03-14 | `src/utils/color-utils.ts` | Converted to re-export shim | Scalability: Backward compat |
| 2026-03-14 | `src/components/common/page-loader.tsx` | Created | Cleanup: Extracted duplicate spinner pattern |
| 2026-03-14 | `src/features/habits/habits-page.tsx` | Removed unused `supabase` import | Cleanup: Unused import |
| 2026-03-14 | `src/features/planner/components/planner-toolbar.tsx` | Removed unused ChevronDown/ChevronUp | Cleanup: Unused imports |
| 2026-03-14 | `src/features/planner/hooks/use-planner-grid.ts` | Created | Performance: Extracted sleep/plan/habit slot computation |
| 2026-03-14 | `src/features/planner/hooks/use-planner-history.ts` | Created | Scalability: Extracted undo/redo + auto-save logic |
| 2026-03-14 | `src/features/planner/hooks/use-planner-handlers.ts` | Created | Scalability: Extracted all cell/task handlers |
| 2026-03-14 | `src/features/planner/planner-page.tsx` | Rewritten to use hooks (~545 -> ~213 lines) | Scalability: Separation of concerns |
| 2026-03-14 | `src/features/today/hooks/use-today-tasks.ts` | Created | Scalability: Extracted task derivation + points logic |
| 2026-03-14 | `src/features/today/today-page.tsx` | Rewritten to use hook (~250 -> ~160 lines) | Scalability: Separation of concerns |
| 2026-03-14 | `src/features/habits/hooks/use-habit-conflicts.ts` | Created | Scalability: Extracted conflict validation logic |
| 2026-03-14 | `src/features/habits/habits-page.tsx` | Rewritten to use hook (~200 -> ~170 lines) | Scalability: Separation of concerns |
| 2026-03-14 | `src/hooks/use-time-lived.ts` | Created | Scalability: Extracted DOB age calculation from header |
| 2026-03-14 | `src/layout/header.tsx` | Refactored to use useTimeLived hook | Cleanup: Removed inline business logic |
| 2026-03-14 | `src/features/goals/hooks/use-ai-plan-generation.ts` | Created | Scalability: Extracted AI call + JSON parse + error handling |
| 2026-03-14 | `src/features/goals/goals-page.tsx` | Refactored to use AI hook | Cleanup: Removed ~60 lines of inline AI logic |
| 2026-03-14 | `src/features/today/components/daily-themes/` | Split from single 523-line file into 8 components + barrel | Scalability: Each theme is independently maintainable |
| 2026-03-14 | `src/features/today/components/daily-themes.tsx` | Deleted | Cleanup: Replaced by directory-based split |
# Refactor Tracker

All changes are logged here with date, file, action, and reasoning.

| Date/Time | File | Action | Reasoning |
|-----------|------|--------|-----------|
| 2026-03-14 | `REFACTOR_TRACKER.md` | Created | Foundation: tracking document per directive |
| 2026-03-14 | `src/constants/scheduling.ts` | Created | Scalability: DAYS_OF_WEEK duplicated in 6 files, centralized |
| 2026-03-14 | `src/types/domain.ts` | Created (split from global-types) | Scalability: Single file mixed domain/UI/AI types |
| 2026-03-14 | `src/types/planner.ts` | Created (split from global-types) | Scalability: Separate planner types |
| 2026-03-14 | `src/types/global-types.ts` | Converted to barrel re-export | Scalability: Backward compat while types are split |
| 2026-03-14 | `src/api/helpers/auth-helpers.ts` | Created | Cleanup: Auth boilerplate duplicated 12+ times across services |
| 2026-03-14 | `src/utils/reflection-utils.ts` | Deleted | Cleanup: Entire file is dead code, never imported |
| 2026-03-14 | `src/components/ui/label.tsx` | Deleted | Cleanup: Never imported anywhere |
| 2026-03-14 | `src/components/ui/textarea.tsx` | Deleted | Cleanup: Never imported anywhere |
| 2026-03-14 | `src/components/ui/time-picker.tsx` | Deleted | Cleanup: Superseded by simple-time-picker |
| 2026-03-14 | `src/features/habits/forms/habit-definition-form.tsx` | Migrated CustomTimePicker -> SimpleTimePicker | Cleanup: Removing time-picker dependency |
| 2026-03-14 | `src/components/ui/form-components.tsx` | Removed unused FormSelect, FormSection | Cleanup: Never used outside file |
| 2026-03-14 | `src/components/ui/ai-loading.tsx` | Removed unused AiLoadingOverlay, AiInlineLoading | Cleanup: Never imported |
| 2026-03-14 | `src/utils/time.ts` | Created (canonical source) | Scalability: New file with slot helpers (timeToSlot, slotKey, slotToTime) |
| 2026-03-14 | `src/utils/week.ts` | Created (canonical source, removed isDayInWeek, formatWeekRange) | Cleanup: Dead functions removed |
| 2026-03-14 | `src/utils/color.ts` | Created (canonical source) | Scalability: Clean canonical file |
| 2026-03-14 | `src/utils/time-utils.ts` | Converted to re-export shim | Scalability: Backward compat |
| 2026-03-14 | `src/utils/week-utils.ts` | Converted to re-export shim | Scalability: Backward compat |
| 2026-03-14 | `src/utils/color-utils.ts` | Converted to re-export shim | Scalability: Backward compat |
| 2026-03-14 | `src/components/common/page-loader.tsx` | Created | Cleanup: Extracted duplicate spinner pattern |
| 2026-03-14 | `src/features/habits/habits-page.tsx` | Removed unused `supabase` import | Cleanup: Unused import |
| 2026-03-14 | `src/features/planner/components/planner-toolbar.tsx` | Removed unused ChevronDown/ChevronUp | Cleanup: Unused imports |
| 2026-03-14 | `src/features/planner/hooks/use-planner-grid.ts` | Created | Performance: Extracted sleep/plan/habit slot computation |
| 2026-03-14 | `src/features/planner/hooks/use-planner-history.ts` | Created | Scalability: Extracted undo/redo + auto-save logic |
| 2026-03-14 | `src/features/planner/hooks/use-planner-handlers.ts` | Created | Scalability: Extracted all cell/task handlers |
| 2026-03-14 | `src/features/planner/planner-page.tsx` | Rewritten to use hooks (~545 -> ~213 lines) | Scalability: Separation of concerns |
| 2026-03-14 | `src/features/today/hooks/use-today-tasks.ts` | Created | Scalability: Extracted task derivation + points logic |
| 2026-03-14 | `src/features/today/today-page.tsx` | Rewritten to use hook (~250 -> ~160 lines) | Scalability: Separation of concerns |
| 2026-03-14 | `src/features/habits/hooks/use-habit-conflicts.ts` | Created | Scalability: Extracted conflict validation logic |
| 2026-03-14 | `src/features/habits/habits-page.tsx` | Rewritten to use hook (~200 -> ~170 lines) | Scalability: Separation of concerns |
| 2026-03-14 | `src/hooks/use-time-lived.ts` | Created | Scalability: Extracted DOB age calculation from header |
| 2026-03-14 | `src/layout/header.tsx` | Refactored to use useTimeLived hook | Cleanup: Removed inline business logic |
| 2026-03-14 | `src/features/goals/hooks/use-ai-plan-generation.ts` | Created | Scalability: Extracted AI call + JSON parse + error handling |
| 2026-03-14 | `src/features/goals/goals-page.tsx` | Refactored to use AI hook | Cleanup: Removed ~60 lines of inline AI logic |
| 2026-03-14 | `src/features/today/components/daily-themes/` | Split from single 523-line file into 8 components + barrel | Scalability: Each theme is independently maintainable |
| 2026-03-14 | `src/features/today/components/daily-themes.tsx` | Deleted | Cleanup: Replaced by directory-based split |
| 2026-03-14 | `src/api/services/custom-task-service.ts` | Added user_id to delete, used auth helper | Security: Delete was unscoped to user |
| 2026-03-14 | `src/api/services/missed-task-service.ts` | Added user_id to delete, used auth helper | Security: Delete was unscoped to user |
| 2026-03-14 | `src/api/services/habit-service.ts` | Migrated to shared auth helper | Cleanup: DRY auth boilerplate |
| 2026-03-14 | `src/api/services/goal-service.ts` | Migrated to shared auth helper | Cleanup: DRY auth boilerplate |
| 2026-03-14 | `src/pages/` | Renamed to `src/features/` | Scalability: Industry-standard feature-based naming |
| 2026-03-14 | `src/App.tsx` | Updated imports from pages/ to features/, use PageLoader | Scalability: Reflects new directory structure |
| 2026-03-14 | `src/components/ui/simple-time-picker.tsx` | Globally replaced native time pickers | UI Consistency: Standardized time picking interface across app |
| 2026-03-14 | `src/features/planner/components/planner-toolbar.tsx` | Separated desktop/mobile layouts | UX: Built responsive horizontal bottom toolbar for mobile |
| 2026-03-14 | `src/index.css` | Reduced horizontal scrollbar height | UX: Made custom scrollbar thinner to save vertical space |
| 2026-03-14 | `src/features/planner/components/planner-toolbar.tsx` | Reduced mobile toolbar width & added active states | UX/Touch: Made buttons scale-90 on tap for native app feel |
| 2026-03-14 | `src/features/planner/components/planner-grid.tsx` | Implemented touch Drag & Drop for grid blocks | Touch UX: Added onTouchStart/Move/End handlers for mobile |
