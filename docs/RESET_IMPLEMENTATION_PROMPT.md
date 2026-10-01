# One-shot implementation prompt: finish the existing Reset experience

Copy the prompt below into an implementation session in `D:\planner`. This is based on repository inspection and the public pages on 1 October 2026. The local Reset route showed a blank page during inspection while the app was changing, so its complete rendered workflow is not verified. The prompt deliberately starts with diagnosis.

---

Act as the implementation engineer for the existing Legacy Life Builder repository. Finish and verify the existing Reset experience as a reliable way to review an overloaded week and approve a realistic change. Work locally and preserve unrelated edits. Read applicable AGENTS.md and CLAUDE.md instructions first. Inspect the latest files because implementation is already in progress. Do not overwrite another contributor's work or build a second Reset system.

## Outcome

A user opens Reset, understands the week's capacity and what changed, reviews specific Keep / Move / Reduce / Remove recommendations, approves the changes, and sees the same saved plan in Planner and Today. Remove means save unfinished work for later, never silently delete it. The user can undo safely without losing later edits. No Focus page, new navigation category, subscription flow, or broad redesign is needed.

## Inspect the existing implementation

Start with:

- `apps/web/src/features/reset/reset-page.tsx`
- its `components/reset-ui.tsx`, `plan-health-card.tsx`, `what-changed.tsx`, `proposal-list.tsx`, `impact-sections.tsx`
- its `hooks/use-reset-data.ts` and labels
- `packages/core/src/utils/reset-engine.ts` and associated tests
- the missed-task service and `useDeferToMissedLibrary` / `useRestoreFromMissedLibrary`
- shared plan types, IDs, completion tracking, week versioning, weekly outcomes and scheduling utilities
- `apps/web/src/App.tsx`, navigation, Today, Planner, profile preferences and existing migrations.

Reproduce the local `/reset` blank screen if it still occurs. Inspect the actual runtime/build error and fix its cause. Do not assume old browser logs prove the cause. Continue from the existing health → proposal → complete flow where it is sound.

## Match the actual visual system

Use shared tokens and components. Inspect computed styles as well as source; report the actual effective font instead of assuming a downloaded font is globally applied.

- The current visual language uses black background, near-black cards, muted zinc borders and gold accents. Brand gold is documented as `#D2A226`, with `#e9c468` and `#8a6415` variants. Runtime primary is overridden in `apps/web/src/index.css` as HSL `43 69% 49%`. Preserve the token mechanism; do not scatter replacement hex values.
- `packages/tokens/tokens.css` defines dark background 0%, foreground 98%, card 2%, elevated 4%, muted zinc roughly `#18181b`, border roughly `#242429` and muted foreground roughly `#a1a1aa`. Preserve existing semantic colors for status.
- Inter and Outfit are loaded, but inspected general app styling inherits the default sans stack. Outfit is explicitly used for the logo; clocks/numeric details use monospace. Do not silently change typography throughout the app.
- Match page spacing: `space-y-6 pb-20 px-2 md:px-4 pt-8 sm:pt-12`, with the existing responsive adjustments where needed.
- Match page header: bottom border, `pb-6`, uppercase 14px bold label with `tracking-[0.3em]`, and the existing small gold rule.
- Existing content uses 14–16px task titles, 15px goal titles, 12px supporting UI and some 8–11px metadata. Make Reset's important instructions readable; do not reproduce tiny decorative metadata for essential decisions. Prefer 14px body copy and at least 12px secondary text in Reset.
- Match 16px-radius cards and existing spacing. Existing Reset uses a subtle gold left border and 44px-high action buttons. Keep primary interactive targets at least 44px where practical on mobile.
- Reuse Button, StandardDialog, FormField and OptionChips where appropriate. Verify dialog focus management, accessible naming, Escape behavior and focus restoration; fix what this workflow needs rather than assuming a custom portal already supplies those behaviors.
- Respect reduced motion, keyboard access and semantic status labels. Do not rely on color alone. No decorative emoji, pressure language or celebration blocking the workflow.
- Current navigation has Home, Habits, Goals, Planner, Reset and Performance/Statistics. Preserve current labels/order from source; an older screenshot contains Vault and must not override newer navigation. Desktop sidebar starts at the existing breakpoint. Mobile bottom navigation and safe-area space must remain usable.

## Product behavior

1. Default to the current week. Do not add a separate daily mode unless already implemented and useful.
2. Show scheduled work, usable capacity, remaining capacity and any overload with clear units and a short explanation. Compute capacity from actual preferences, fixed commitments, sleep/habits, completed work and the remaining time horizon. Do not count past time as available.
3. Let the user explain what changed and protect a priority goal. Treat a reason such as low energy as context, not an unexplained numerical reduction that pretends to know the user's available hours. Show or let the user adjust important assumptions.
4. Keep completed work fixed. Respect protected goals, unavailable windows and habit rules. Prevent overlap across all goals, not just within a single goal.
5. Give each recommendation its reason and exact effect. Move must show old/new day and time. Reduce must distinguish a shorter time estimate from genuinely smaller scope; require meaningful scope confirmation before presenting less time as an achievable result. Remove must clearly say the work is saved for later.
6. Show before/after totals and any unresolved overload before approval. If there is no feasible plan, say so and offer specific choices. Never claim the week is realistic merely because a write succeeded.
7. Describe goal/deadline effects conservatively. A heuristic does not prove a deadline will be met. Surface uncertainty and remaining work.
8. Do not apply changes until the user approves. Provide pending, success, empty and error states. Retrying must not duplicate work or deferred entries.

## Data integrity is required

Inspect the current defer/save and undo implementation carefully. In the inspected version, deferred entries and the week grid were written separately, and undo similarly used separate operations. Fix the possibility of partial success.

- Use a single atomic server/database operation for applying a Reset, with expected week version and a unique operation ID. Include plan changes, complete deferred-task metadata, a persisted change record and resulting version. Follow existing repository architecture. If a migration is needed, make it additive and idempotent. Do not deploy production changes without explicit authorization.
- Make retries idempotent. A duplicate operation ID must return the prior outcome rather than apply twice.
- On stale version, refresh and regenerate the preview for approval. Also protect against completions or relevant data changing during review. Ensure loading/error handling includes data needed to make reliable recommendations, including preferences/version.
- Undo must be atomic and version-aware. Revert only the operation's changes when safe; do not overwrite unrelated edits made afterwards. Explain a conflict and refresh instead of silently clobbering data.
- Preserve goal ID, task ID, dates, duration, type, notes and other task metadata when moving or saving for later.
- Audit stable task identity. The inspected plan type lacks a stable task ID and completion keys can depend on name/time. Introduce backward-compatible stable identity where needed, with safe handling for old records and all shared consumers, including mobile. Moving or renaming a task must not lose its completion association.
- Handle end-of-day values correctly. Do not clamp midnight to the last half-hour start or lose duration. Audit week/year transitions and 53-week years against the project's actual week convention.
- Keep calculation in shared pure logic where possible. AI is optional for suggesting scope; validate any output against the same constraints. Do not add AI merely to label a deterministic calculation intelligent.

## Verification

Run required repository checks and focused tests for meaningful risks:

- zero capacity, overload, no pending tasks, protected goals and completed tasks;
- overlapping work from different goals, fixed habits, partial remaining day, midnight and year/week boundaries;
- duplicate task names, legacy records, task identity after moving and completion preservation;
- stale preview, failed save, partial-write prevention, retry idempotency and undo after subsequent edits;
- honest success messaging when overload remains.

Verify the real local workflow at 375×667, 390×844, 768×1024 and 1440×900. Check long titles, keyboard navigation, focus, 200% zoom, reduced motion and any supported light theme. Ensure content is reachable above the bottom navigation, dialogs scroll correctly and no horizontal page overflow occurs. Use demo data without altering the user's real tasks. Do not claim these checks passed if authentication or another limitation prevented them.

## Finish

Deliver the working local changes, a short summary of behavior, checks performed and any remaining limitation. List migrations or setup requirements separately. Do not publish, change production data, add a Focus page, rebrand the app, or modify marketing pages as part of this implementation. If infrastructure access blocks atomic persistence, complete the local implementation and migration, clearly identify the remaining deployment step, and do not label the feature production-ready until that step is verified.
