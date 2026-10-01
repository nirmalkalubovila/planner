// A goal typed on the landing page before the visitor has an account. It survives signup / onboarding in
// localStorage and pre-fills the New Goal form the first time the user reaches the goals page. When the goal
// is one of the landing examples, its realistic timeline (in months) is kept with it.
const KEY = 'llb:pending-goal';
const MONTHS_KEY = 'llb:pending-goal-months';

export function savePendingGoal(text: string, months?: number): void {
    try {
        localStorage.setItem(KEY, text.trim().slice(0, 300));
        if (months && months > 0) localStorage.setItem(MONTHS_KEY, String(months));
        else localStorage.removeItem(MONTHS_KEY);
    } catch {
        // storage unavailable - the visitor just starts with an empty form
    }
}

export function hasPendingGoal(): boolean {
    try {
        return !!localStorage.getItem(KEY);
    } catch {
        return false;
    }
}

/** Reads the pending goal without clearing it (used to carry it through signup). */
export function peekPendingGoal(): { text: string; months?: number } | null {
    try {
        const text = localStorage.getItem(KEY);
        if (!text) return null;
        const months = Number(localStorage.getItem(MONTHS_KEY));
        return { text, ...(months > 0 ? { months } : {}) };
    } catch {
        return null;
    }
}

/** Returns the pending goal once and clears it, with its timeline when it has one. */
export function takePendingGoal(): { text: string; months?: number } | null {
    const pending = peekPendingGoal();
    try {
        localStorage.removeItem(KEY);
        localStorage.removeItem(MONTHS_KEY);
    } catch {
        // nothing to clear
    }
    return pending;
}
