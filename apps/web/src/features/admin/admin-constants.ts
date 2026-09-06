/** Emails with admin panel access. Checked client-side + enforced via Supabase RLS. */
export const ADMIN_EMAILS = [
  'legacylifebuilder.konik@email.com',
] as const;

export const isAdminEmail = (email: string | undefined): boolean =>
  !!email && ADMIN_EMAILS.includes(email as typeof ADMIN_EMAILS[number]);

// Moved to @llb/core (shared with the plain feedback-submit form).
export { FEEDBACK_CATEGORIES, type FeedbackCategory, FEEDBACK_STATUSES, type FeedbackStatus } from '@llb/core';
import type { FeedbackStatus } from '@llb/core';

export const STATUS_COLORS: Record<FeedbackStatus, string> = {
  open: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  reviewed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};
