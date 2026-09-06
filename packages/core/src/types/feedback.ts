export const FEEDBACK_CATEGORIES = [
  'Bug Report',
  'Feature Request',
  'About Legacy Life Builder',
  'Other',
] as const;

export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number];

export const FEEDBACK_STATUSES = ['open', 'reviewed', 'resolved'] as const;
export type FeedbackStatus = typeof FEEDBACK_STATUSES[number];
