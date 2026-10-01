// A deterministic "is this goal achievable in this time?" check. It runs before the AI plans anything, so a goal
// like "save LKR 500,000 in 3 months" is caught instead of being spread into a confident plan nobody can follow.
//
// These are conservative guardrails, not advice. The thresholds are constants at the top so they are easy to tune.

/** Typical monthly wage in Sri Lanka (median, 2023), the reference for money goals in LKR. */
export const LKR_TYPICAL_MONTHLY_WAGE = 43000;

/** Share of a typical wage that can be saved each month without a hardship (10-25% is the usual guidance). */
const SAVE_OK_SHARE = 0.25;
const SAVE_STRETCH_SHARE = 0.5;
/** The share used when suggesting a longer timeline for a savings goal. */
const SAVE_SUGGEST_SHARE = 0.2;

/** New income starts small and grows: compare the target monthly income with a typical wage. */
const INCOME_OK_RATIO = 0.75;
const INCOME_STRETCH_RATIO = 1.5;

/** Weight loss, kg per week: up to about 0.75 is comfortable, 1 is the upper end of what is generally safe. */
const LOSS_OK_PER_WEEK = 0.75;
const LOSS_STRETCH_PER_WEEK = 1;
const LOSS_SUGGEST_PER_WEEK = 0.5;

const WEEKS_PER_MONTH = 4.345;

export type RealismLevel = 'ok' | 'stretch' | 'unrealistic';

export interface RealismNote {
    level: RealismLevel;
    kind: 'saving' | 'income' | 'weight';
    /** One short line for a heading. */
    headline: string;
    /** What the numbers say, written as plain facts the AI and the user can both read. */
    detail: string;
    /** A timeline, in months, that makes the goal realistic. Absent when the goal is already fine. */
    suggestedMonths?: number;
}

export function goalDurationMonths(goalType: 'Week' | 'Month' | 'Year', durationValue: number): number {
    if (goalType === 'Week') return durationValue / WEEKS_PER_MONTH;
    if (goalType === 'Year') return durationValue * 12;
    return durationValue;
}

/** Turns a number of months into the goal type and length the form understands. */
export function monthsToGoalDuration(months: number): { goalType: 'Week' | 'Month' | 'Year'; durationValue: number } {
    if (months < 2) return { goalType: 'Week', durationValue: Math.max(1, Math.min(4, Math.round(months * WEEKS_PER_MONTH))) };
    if (months <= 12) return { goalType: 'Month', durationValue: Math.round(months) };
    return { goalType: 'Year', durationValue: Math.max(2, Math.min(10, Math.ceil(months / 12))) };
}

export const formatLkr = (n: number) => `LKR ${Math.round(n).toLocaleString('en-US')}`;

const UNIT: Record<string, number> = { k: 1e3, m: 1e6, mn: 1e6, million: 1e6, lakh: 1e5, lakhs: 1e5 };

/** Money amounts written in rupees: "LKR 500,000", "Rs. 100k", "500000 LKR". Returns each amount in rupees. */
export function parseLkrAmounts(text: string): number[] {
    const out: number[] = [];
    const number = '([\\d][\\d,]*(?:\\.\\d+)?)\\s*(k|mn|m|million|lakhs?)?';
    const before = new RegExp(`(?:lkr|rs\\.?|rupees?)\\s*${number}`, 'gi');
    const after = new RegExp(`${number}\\s*(?:lkr|rs\\b\\.?|rupees?)`, 'gi');
    for (const re of [before, after]) {
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
            const base = parseFloat(m[1].replace(/,/g, ''));
            if (!Number.isFinite(base)) continue;
            out.push(base * (m[2] ? UNIT[m[2].toLowerCase()] ?? 1 : 1));
        }
    }
    return out;
}

const SAVING = /\b(save|saving|savings|emergency fund|pay off|paying off|clear (?:my )?debt)\b/i;
const INCOME = /\b(earn|earning|income|revenue|make|salary)\b/i;
const MONTHLY = /(per month|a month|\/\s*month|\/\s*mo\b|monthly|each month|every month)/i;

export function assessGoalRealism(input: { text: string; months: number }): RealismNote | null {
    const text = input.text ?? '';
    const months = Math.max(input.months, 0.25);

    // Weight loss
    const loss = /\b(?:lose|losing|drop|shed|cut)\s+(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilos?|kilograms?)\b/i.exec(text);
    if (loss) {
        const kg = parseFloat(loss[1]);
        const perWeek = kg / (months * WEEKS_PER_MONTH);
        const level: RealismLevel = perWeek <= LOSS_OK_PER_WEEK ? 'ok' : perWeek <= LOSS_STRETCH_PER_WEEK ? 'stretch' : 'unrealistic';
        const safeMonths = Math.ceil(kg / (LOSS_SUGGEST_PER_WEEK * WEEKS_PER_MONTH));
        return {
            level,
            kind: 'weight',
            headline: level === 'ok' ? 'A safe pace' : 'Faster than a safe pace',
            detail:
                level === 'ok'
                    ? `Losing ${kg} kg in ${fmtMonths(months)} is about ${perWeek.toFixed(2)} kg a week, within the 0.5 to 1 kg a week that is generally considered safe.`
                    : `Losing ${kg} kg in ${fmtMonths(months)} needs about ${perWeek.toFixed(2)} kg a week. About 0.5 to 1 kg a week is generally considered safe, so around ${safeMonths} months is the honest timeline.`,
            ...(level === 'ok' ? {} : { suggestedMonths: safeMonths }),
        };
    }

    // Money, in rupees (the only currency with a local benchmark so far)
    const amounts = parseLkrAmounts(text);
    if (amounts.length === 0) return null;
    const amount = Math.max(...amounts);

    if (INCOME.test(text) && MONTHLY.test(text) && !SAVING.test(text)) {
        const ratio = amount / LKR_TYPICAL_MONTHLY_WAGE;
        let level: RealismLevel = ratio <= INCOME_OK_RATIO ? 'ok' : ratio <= INCOME_STRETCH_RATIO ? 'stretch' : 'unrealistic';
        // A short runway makes the same target harder: new income needs months to start
        if (months < 6 && level === 'ok') level = 'stretch';
        else if (months < 6 && level === 'stretch') level = 'unrealistic';
        const suggested = ratio <= INCOME_STRETCH_RATIO ? 12 : ratio <= 3 ? 24 : 36;
        return {
            level,
            kind: 'income',
            headline: level === 'ok' ? 'A reachable income goal' : 'Income takes longer to build',
            detail:
                level === 'ok'
                    ? `${formatLkr(amount)} a month is ${(ratio * 100).toFixed(0)}% of a typical monthly wage (about ${formatLkr(LKR_TYPICAL_MONTHLY_WAGE)}), so it is reachable if the first months go to setup and the first customers.`
                    : `${formatLkr(amount)} a month is ${ratio.toFixed(1)}x a typical monthly wage (about ${formatLkr(LKR_TYPICAL_MONTHLY_WAGE)}). New income starts small and grows, so ${suggested >= 24 ? `${suggested / 12} years` : `${suggested} months`} is a more honest timeline, or aim for a smaller first target.`,
            ...(level === 'ok' ? {} : { suggestedMonths: suggested }),
        };
    }

    if (SAVING.test(text)) {
        const perMonth = amount / months;
        const share = perMonth / LKR_TYPICAL_MONTHLY_WAGE;
        const level: RealismLevel = share <= SAVE_OK_SHARE ? 'ok' : share <= SAVE_STRETCH_SHARE ? 'stretch' : 'unrealistic';
        const suggested = Math.ceil(amount / (LKR_TYPICAL_MONTHLY_WAGE * SAVE_SUGGEST_SHARE));
        return {
            level,
            kind: 'saving',
            headline: level === 'ok' ? 'A realistic savings pace' : 'More than most people can save',
            detail:
                level === 'ok'
                    ? `${formatLkr(amount)} in ${fmtMonths(months)} is ${formatLkr(perMonth)} a month, about ${(share * 100).toFixed(0)}% of a typical monthly wage (${formatLkr(LKR_TYPICAL_MONTHLY_WAGE)}).`
                    : `${formatLkr(amount)} in ${fmtMonths(months)} means saving ${formatLkr(perMonth)} every month, ${(share * 100).toFixed(0)}% of a typical monthly wage (${formatLkr(LKR_TYPICAL_MONTHLY_WAGE)}). That works only with a much higher income. At about 20% of a typical wage it takes around ${suggested} months.`,
            ...(level === 'ok' ? {} : { suggestedMonths: suggested }),
        };
    }

    return null;
}

function fmtMonths(m: number) {
    if (m < 1) return `${Math.max(1, Math.round(m * WEEKS_PER_MONTH))} weeks`;
    const r = Math.round(m * 10) / 10;
    return `${r} ${r === 1 ? 'month' : 'months'}`;
}
