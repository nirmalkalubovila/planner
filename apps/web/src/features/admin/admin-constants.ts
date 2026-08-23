/** Emails with admin panel access. Checked client-side + enforced via Supabase RLS. */
export const ADMIN_EMAILS = [
  'legacylifebuilder.konik@email.com',
] as const;

export const isAdminEmail = (email: string | undefined): boolean =>
  !!email && ADMIN_EMAILS.includes(email as typeof ADMIN_EMAILS[number]);

export const FEEDBACK_CATEGORIES = [
  'Bug Report',
  'Feature Request',
  'About Legacy Life Builder',
  'Other',
] as const;

export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number];

export const FEEDBACK_STATUSES = ['open', 'reviewed', 'resolved'] as const;
export type FeedbackStatus = typeof FEEDBACK_STATUSES[number];

export const STATUS_COLORS: Record<FeedbackStatus, string> = {
  open: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  reviewed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};
