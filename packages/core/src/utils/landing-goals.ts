/**
 * The example goals shown on the landing page. Each carries the timeline it should be planned over, so choosing
 * one opens a goal that is already set to a realistic length instead of the form's one-week default.
 *
 * Every chip must pass assessGoalRealism with its own timeline (a test enforces it). Money amounts are in LKR and
 * are set to what a typical earner can reach, because a chip that promises the impossible disappoints people.
 */
export interface GoalChip {
    text: string;
    /** How long the goal should run, in months. */
    months: number;
}

/** The four shown first, ordered by how many Sri Lankans they speak to: work, business, money, skills. */
export const PRIMARY_GOAL_CHIPS: GoalChip[] = [
    { text: 'Get a better-paying job within 6 months', months: 6 },
    { text: 'Start a side business and earn LKR 30,000 a month', months: 12 },
    { text: 'Save LKR 100,000 for an emergency fund', months: 12 },
    { text: 'Improve my English and job-ready skills', months: 6 },
];

/** Shown in groups of four when the visitor asks for more ideas. */
export const MORE_GOAL_CHIPS: GoalChip[] = [
    { text: 'Lose 10 kg and exercise 4 days a week', months: 6 },
    { text: 'Get a remote job', months: 6 },
    { text: 'Learn digital skills: design, coding or AI tools', months: 6 },
    { text: 'Start freelancing and earn LKR 25,000 a month', months: 12 },
    { text: 'Save LKR 120,000 in one year', months: 12 },
    { text: 'Get promoted into a higher-paying role', months: 12 },
    { text: 'Build a consistent workout and sleep routine', months: 3 },
    { text: 'Prepare to study or work abroad', months: 12 },
    { text: 'Finish my degree or professional qualification', months: 12 },
    { text: 'Build a personal brand and reach my first 1,000 followers', months: 6 },
    { text: 'Pay off my loan within 12 months', months: 12 },
    { text: 'Become financially independent from my parents', months: 12 },
];

export const ALL_GOAL_CHIPS: GoalChip[] = [...PRIMARY_GOAL_CHIPS, ...MORE_GOAL_CHIPS];

/** The chip a typed goal exactly matches, so its timeline can travel with it. */
export const findGoalChip = (text: string): GoalChip | undefined =>
    ALL_GOAL_CHIPS.find((c) => c.text.trim().toLowerCase() === text.trim().toLowerCase());
