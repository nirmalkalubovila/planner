import type { SituationStatus } from '../types/execution-profile';
import { LIFE_BUCKETS, type LifeBucket } from '../types/time';
import { getSituationStatuses } from './situation';

/**
 * How a healthy week is split between the four life buckets, as a share of the 168-hour week.
 *
 * It does not add up to 100%: eating, washing, commuting, chores and surprises need room, so the four buckets
 * together aim for about 75 to 88% and the rest is flexible time. The target is built in layers:
 * the status baseline, then an age adjustment, then guardrails that protect recovery and relationships.
 */

type Shares = Record<LifeBucket, number>;

const pts = (income: number, asset: number, recovery: number, relational: number): Shares => ({ income, asset, recovery, relational });

/** Baseline per status, in percent of the week. */
export const STATUS_BASELINES: Record<SituationStatus, Shares> = {
  student: pts(8, 24, 36, 10),
  employed: pts(24, 12, 36, 9),
  self_employed: pts(28, 15, 35, 8),
  business_owner: pts(30, 16, 34, 8),
  between_jobs: pts(12, 24, 37, 10),
  career_transition: pts(15, 22, 37, 10),
  caregiver: pts(8, 12, 36, 20),
  other: pts(18, 18, 36, 10),
};

interface AgeBand {
  /** Inclusive lower age; the last matching band wins. */
  from: number;
  shift: Shares;
}

/** Percentage-point shifts by life stage. */
const AGE_BANDS: AgeBand[] = [
  { from: 0, shift: pts(-2, 5, 0, 0) }, // up to 22: build skills, less income pressure
  { from: 23, shift: pts(1, 3, 0, 0) }, // 23 to 30: build skills and income
  { from: 31, shift: pts(1, -1, 0, 2) }, // 31 to 45: income and relationships
  { from: 46, shift: pts(-1, -3, 2, 2) }, // 46 to 60: recovery and relationships
  { from: 61, shift: pts(-6, -3, 3, 3) }, // 61 and over: recovery and relationships, less income need
];

/** Guardrails, in percent of the week. Recovery is never traded away for income or assets. */
export const BALANCE_GUARDRAILS = {
  minRecovery: 33,
  minRelational: 7,
  minBuilding: 4,
  minPlanned: 75,
  maxPlanned: 88,
} as const;

export interface BucketTargets {
  /** Share of the 168-hour week each bucket should hold (0 to 1). */
  shares: Shares;
  /** Hours per week for each bucket. */
  hours: Shares;
  /** All four buckets together (0 to 1). */
  plannedShare: number;
  /** What is left for life maintenance and flexibility (0 to 1). */
  flexShare: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function ageFromDob(dob?: string | null, now: Date = new Date()): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getFullYear() - d.getFullYear();
  const beforeBirthday = now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

/**
 * The target split for one person. With several statuses (for example student + business owner) the baselines
 * are averaged. Without a status the neutral "other" baseline is used, and without an age no adjustment is made.
 */
export function computeBucketTargets({ statuses, age }: { statuses: SituationStatus[]; age?: number | null }): BucketTargets {
  const picked = statuses.length ? statuses : (['other'] as SituationStatus[]);
  const g = BALANCE_GUARDRAILS;

  const t: Shares = { income: 0, asset: 0, recovery: 0, relational: 0 };
  for (const s of picked) for (const b of LIFE_BUCKETS) t[b] += STATUS_BASELINES[s][b] / picked.length;

  if (age !== null && age !== undefined) {
    const band = [...AGE_BANDS].reverse().find((x) => age >= x.from) ?? AGE_BANDS[0];
    for (const b of LIFE_BUCKETS) t[b] += band.shift[b];
  }

  // Guardrails: recovery and relationships first, then keep building buckets from vanishing
  t.recovery = Math.max(t.recovery, g.minRecovery);
  t.relational = Math.max(t.relational, g.minRelational);
  t.income = Math.max(t.income, g.minBuilding);
  t.asset = Math.max(t.asset, g.minBuilding);

  // Keep the planned total inside its range by scaling only the building buckets
  const total = () => t.income + t.asset + t.recovery + t.relational;
  const building = t.income + t.asset;
  const goal = total() > g.maxPlanned ? g.maxPlanned : total() < g.minPlanned ? g.minPlanned : null;
  if (goal !== null && building > 0) {
    const factor = (goal - t.recovery - t.relational) / building;
    t.income = Math.max(g.minBuilding, t.income * factor);
    t.asset = Math.max(g.minBuilding, t.asset * factor);
  }

  const shares = Object.fromEntries(LIFE_BUCKETS.map((b) => [b, round1(t[b]) / 100])) as Shares;
  const hours = Object.fromEntries(LIFE_BUCKETS.map((b) => [b, round1(shares[b] * 168)])) as Shares;
  const plannedShare = LIFE_BUCKETS.reduce((sum, b) => sum + shares[b], 0);
  return { shares, hours, plannedShare, flexShare: 1 - plannedShare };
}

/** The birth date the old "Skip for now" button saved. It is not a real age, so it is ignored. */
const PLACEHOLDER_DOB = '2002-11-23';

/** A user_profiles row (snake_case, as stored) in, that user's target split out. */
export function bucketTargetsFor(row?: { execution_profile?: unknown; dob?: string | null } | null): BucketTargets {
  const statuses = getSituationStatuses(row?.execution_profile as Parameters<typeof getSituationStatuses>[0]);
  const age = row?.dob && row.dob !== PLACEHOLDER_DOB ? ageFromDob(row.dob) : null;
  return computeBucketTargets({ statuses, age });
}
