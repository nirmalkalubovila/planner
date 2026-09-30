// One place for the link to the Legacy Life site, so moving to the final domain is a one-line change.
export const LEGACY_LIFE_URL = 'https://my-site-tawny-alpha.vercel.app/legacy-life';

/** A link into the Legacy Life page: `anchor` is the section id to land on (for example "step-03"), `content` names the insight. */
export const legacyLink = (medium: string, anchor?: string, content?: string) =>
    `${LEGACY_LIFE_URL}?utm_source=legacy_life_builder&utm_medium=${medium}${content ? `&utm_content=${content}` : ''}${anchor ? `#${anchor}` : ''}`;

export interface LegacyInsight {
    id: string;
    /** The idea in a few words. */
    title: string;
    /** The knowledge itself: two or three short sentences. */
    body: string;
    /** One thing to do this week that uses it. */
    action: string;
    /** Picture that carries the idea (files in /public/landing/insights). */
    image: string;
    /** The section of the Legacy Life page that teaches this in full. */
    anchor: string;
}

// Drawn from The Legacy Life (nine steps and six pillars). Each popup shows the next one, so every visit
// teaches something new. Plain knowledge for working with direction, not a pitch.
export const LEGACY_INSIGHTS: LegacyInsight[] = [
    {
        id: 'dependence-ownership',
        title: 'Dependence vs ownership',
        body: 'The real divide is not employee vs entrepreneur. It is whether your life depends on one employer, one salary or one platform, or on things you own.',
        action: 'Write what your income depends on. Pick one thing you could own instead.',
        image: '/landing/insights/dependence.jpg',
        anchor: 'step-01',
    },
    {
        id: 'runway',
        title: 'Runway beats bravado',
        body: 'Running out of cash before an idea is proven ends more new builds than a lack of skill. A safety income buys time to build properly.',
        action: 'Count how many months of expenses you could cover today. That number is your runway.',
        image: '/landing/insights/runway.jpg',
        anchor: 'step-02',
    },
    {
        id: 'personal-system',
        title: 'Fix the foundation first',
        body: 'Time, energy, money and health are the inputs to everything else. Without them in order, a brand or a business resets every few months.',
        action: 'Choose the weakest of time, energy or money and improve only that this week.',
        image: '/landing/insights/foundation.jpg',
        anchor: 'step-03',
    },
    {
        id: 'six-pillars',
        title: 'Six pillars, one life',
        body: 'A Legacy Life is freedom, ownership, purpose, health, relationships and impact working together. Freedom is the foundation that makes the rest possible.',
        action: 'Score each pillar from 1 to 10. Put one planner block on the lowest one.',
        image: '/landing/insights/pillars.jpg',
        anchor: 'pillars',
    },
    {
        id: 'purpose',
        title: 'Purpose gives freedom a direction',
        body: 'Freedom and ownership only give you options. A clear reason why turns them into a direction, so big decisions feel coherent.',
        action: 'Write your why for your main goal in one sentence. Keep it where you plan.',
        image: '/landing/insights/purpose.jpg',
        anchor: 'pillars',
    },
    {
        id: 'brand-order',
        title: 'Earn trust before you sell',
        body: 'A personal brand is built in order: clarity, proof, presence and consistent publishing. Monetising comes last.',
        action: 'Publish one piece of real proof of your work this week.',
        image: '/landing/insights/brand.jpg',
        anchor: 'step-05',
    },
    {
        id: 'platform-rule',
        title: 'Followers are rented. Lists are owned.',
        body: 'Use one platform to be discovered, one to go deep, and one channel you own, such as an email list or a website.',
        action: 'Name your owned channel. If you do not have one, start it today.',
        image: '/landing/insights/channels.jpg',
        anchor: 'step-05',
    },
    {
        id: 'review-loop',
        title: 'What you review, you improve',
        body: 'A system gets better through feedback: a weekly review, then monthly, quarterly and yearly. Without review, effort repeats without learning.',
        action: 'Take 15 minutes this weekend to ask what worked and what to change.',
        image: '/landing/insights/review.jpg',
        anchor: 'step-03',
    },
    {
        id: 'health-engine',
        title: 'Health is the engine',
        body: 'Stamina and resilience decide whether you can sustain performance for decades, not just a few intense years. Research links 55+ hour work weeks to much higher stroke and heart risk (WHO/ILO).',
        action: 'Protect one recovery block in your planner and treat it like a meeting.',
        image: '/landing/insights/health.jpg',
        anchor: 'pillars',
    },
    {
        id: 'time-independence',
        title: 'Test it by stepping away',
        body: 'Independence is proven, not claimed: a day away, then three, seven, fourteen and thirty. Every failure becomes a task to fix, not a reason to take control back.',
        action: 'Take one day off this week. Note what needed you, and turn it into a task.',
        image: '/landing/insights/independence.jpg',
        anchor: 'step-08',
    },
];

// ─── Schedule: closing brings it back in a week, "don't show again" ends it for good ───

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface InsightState {
    forever: boolean;
    next: number; // epoch ms: not before this time
    seen: number; // how many insights have been shown, so the next one is always new
}

const keyFor = (userId: string) => `llb_legacy_insight_${userId}`;

export function readInsightState(userId: string): InsightState {
    try {
        const raw = localStorage.getItem(keyFor(userId));
        if (raw) return { forever: false, next: 0, seen: 0, ...JSON.parse(raw) };
    } catch {
        /* storage unavailable: behave as a first visit */
    }
    return { forever: false, next: 0, seen: 0 };
}

export function writeInsightState(userId: string, state: InsightState) {
    try {
        localStorage.setItem(keyFor(userId), JSON.stringify(state));
    } catch {
        /* the popup still closes for this session */
    }
}

export const isInsightDue = (state: InsightState, now = Date.now()) => !state.forever && now >= state.next;

/** Closing shows the next insight in a week; "don't show again" stops them. */
export function closeInsight(userId: string, state: InsightState, dontShowAgain: boolean): InsightState {
    const next: InsightState = { forever: dontShowAgain, next: Date.now() + WEEK_MS, seen: state.seen + 1 };
    writeInsightState(userId, next);
    return next;
}
