-- Offline-support phase: adds the version stamp `useSaveWeekPlan` needs to
-- detect a conflicting write instead of blindly overwriting one.
--
-- Today's save is a whole-week replace with no way to tell "nothing else
-- changed this since I last read it" from "someone else wrote to this
-- while I was offline for three days." `updated_at` plus a conditional
-- save (`.eq('updated_at', lastSeenUpdatedAt)`) is what makes that
-- distinguishable — a conditional save affecting zero rows means a
-- conflict occurred, at which point the client three-way-merges instead
-- of overwriting (see packages/core/src/sync/merge-grid-state.ts).
--
-- Purely additive: a new nullable-then-backfilled column plus a trigger.
-- No existing column, constraint, or RLS policy changes.

alter table week_plans
  add column if not exists updated_at timestamptz not null default now();

-- Backfill so every existing row has a real timestamp rather than the
-- migration's own apply time masquerading as "just written".
update week_plans set updated_at = "createdAt" where updated_at is null;

create or replace function set_week_plans_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists week_plans_set_updated_at on week_plans;
create trigger week_plans_set_updated_at
  before update on week_plans
  for each row
  execute function set_week_plans_updated_at();

comment on column week_plans.updated_at is 'Maintained by trigger. Used as an optimistic-concurrency stamp for the offline conflict-merge flow.';
