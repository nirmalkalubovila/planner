import type { ExecutionProfile, SituationStatus } from '../types/execution-profile';

export interface SituationOption {
  value: SituationStatus;
  label: string;
  hint: string;
}

/** The statuses a user can pick, in display order. The single list every screen reads from. */
export const SITUATION_OPTIONS: SituationOption[] = [
  { value: 'student', label: 'Student', hint: 'School, university or professional studies' },
  { value: 'employed', label: 'Employed', hint: 'Full-time or part-time employee' },
  { value: 'self_employed', label: 'Self-employed', hint: 'Freelancer, consultant, independent professional' },
  { value: 'business_owner', label: 'Business Owner', hint: 'Running or building a business' },
  { value: 'between_jobs', label: 'Between Jobs', hint: 'Looking for work' },
  { value: 'career_transition', label: 'Career Transition', hint: 'Pausing or changing direction' },
  { value: 'caregiver', label: 'Homemaker / Caregiver', hint: 'Mainly home or caring responsibilities' },
  { value: 'other', label: 'Other', hint: 'Anything else' },
];

const LABELS = Object.fromEntries(SITUATION_OPTIONS.map((o) => [o.value, o.label])) as Record<SituationStatus, string>;

export const situationLabel = (status: SituationStatus): string => LABELS[status] ?? status;

/** "Student, Business Owner". Used wherever a short text description of the user's situation is needed. */
export const situationSummary = (statuses: SituationStatus[]): string => statuses.map(situationLabel).join(', ');

/**
 * Everything that applies to the user. Older profiles stored one `status` ('unemployed' meant between jobs),
 * so that is read as a single-item list.
 */
export function getSituationStatuses(profile?: Pick<ExecutionProfile, 'situation'> | null): SituationStatus[] {
  const situation = profile?.situation;
  if (situation?.statuses?.length) return situation.statuses;
  const legacy = situation?.status;
  if (!legacy) return [];
  return [legacy === 'unemployed' ? 'between_jobs' : legacy];
}
