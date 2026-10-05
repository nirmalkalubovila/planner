import { getSituationStatuses, type FreeTimeBand } from '@llb/core';
import type { UserProfile } from '@llb/api';

/** The birth date the old "Skip for now" button saved. It is not a real date. */
export const PLACEHOLDER_DOB = '2002-11-23';

/** True while the answers the planner cannot work without are missing. The quiz cannot be closed until they are given. */
export function isProfileIncomplete(profile: Partial<UserProfile> | null | undefined): boolean {
    if (!profile) return true;
    const hasSituation = getSituationStatuses(profile.executionProfile).length > 0 || !!profile.currentProfession?.trim();
    return !profile.dob || profile.dob === PLACEHOLDER_DOB || !profile.fullName?.trim() ||
        !hasSituation || !profile.primaryLifeFocus?.trim() || !profile.dailyFreeHours;
}

/** True until the user has finished the whole quiz. */
export const quizNotCompleted = (profile: Partial<UserProfile> | null | undefined): boolean => !profile?.executionProfile?.completedAt;

/** The weekday free-time band that matches a number of free hours (kept in step with the planner's hour budget). */
export function freeTimeBandFor(hours: number): FreeTimeBand {
    if (hours < 1) return 'lt1';
    if (hours < 2) return '1to2';
    if (hours < 4) return '2to4';
    return '4plus';
}
