// Structured answers that let the AI planner understand *how* a person operates.
// Stored as jsonb (user_profiles.execution_profile / goals."goalContext").

export type SituationStatus = 'student' | 'employed' | 'self_employed' | 'unemployed' | 'other';
export type FreeTimeBand = 'lt1' | '1to2' | '2to4' | '4plus';
export type DeepWorkBand = 'lt20' | '20to45' | '45to90' | '90plus';
export type SwitchRecoveryBand = 'immediate' | '5to15' | '15to30' | '30plus';
export type SessionStyle = 'one_long' | 'several_short';
export type EnergyPeriod = 'Morning' | 'Afternoon' | 'Evening' | 'Night';
export type WorkloadBand = 'light' | 'moderate' | 'heavy';
export type RiskPattern =
    | 'procrastination' | 'distraction' | 'perfectionism' | 'too_many_things'
    | 'motivation' | 'forgetting' | 'time_estimation' | 'task_switching'
    | 'fear_of_failure' | 'accountability' | 'burnout' | 'sleep' | 'unrealistic_planning';

export interface ExecutionProfile {
    version: number;
    situation?: { status?: SituationStatus; weekdayFree?: FreeTimeBand; weekendFree?: FreeTimeBand };
    capacity?: {
        deepWorkMin?: DeepWorkBand;
        switchRecovery?: SwitchRecoveryBand;
        sessionStyle?: SessionStyle;
        lowEnergyPeriod?: EnergyPeriod;
        maxDailyLoad?: WorkloadBand;
    };
    style?: {
        structure?: 'structured' | 'flexible';
        projectMode?: 'single' | 'multi';
        deadlineResponse?: 'deadline_driven' | 'self_driven';
    };
    risks?: { patterns?: RiskPattern[]; stopBehavior?: string };
    /** ISO timestamp set when the user finishes the assessment. */
    completedAt?: string;
}

export interface GoalContext {
    why?: string;
    successMeasure?: string;
    deadlineFlex?: 'fixed' | 'flexible';
    weeklyHours?: string;
    resources?: { budget?: 'none' | 'low' | 'medium' | 'high'; skills?: string; tools?: string; network?: string };
    priorAttempt?: { attempted?: boolean; whatTried?: string; whyStopped?: string };
}

export const EXECUTION_PROFILE_VERSION = 1;
