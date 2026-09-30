// A goal typed on the landing page before the visitor has an account. It survives signup / onboarding in
// localStorage and pre-fills the New Goal form the first time the user reaches the goals page.
const KEY = 'llb:pending-goal';

export function savePendingGoal(text: string): void {
    try {
        localStorage.setItem(KEY, text.trim().slice(0, 300));
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

/** Returns the pending goal once and clears it. */
export function takePendingGoal(): string | null {
    try {
        const value = localStorage.getItem(KEY);
        if (value) localStorage.removeItem(KEY);
        return value || null;
    } catch {
        return null;
    }
}
