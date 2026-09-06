export const GOAL_COLORS = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

export const getGoalColor = (goalId: string) => {
    let hash = 0;
    for (let i = 0; i < goalId.length; i++) {
        hash = goalId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return GOAL_COLORS[Math.abs(hash) % GOAL_COLORS.length] + 'E6';
};

export const CUSTOM_TASK_COLORS = [
    "#f59e0b", "#8b5cf6", "#ec4899",
    "#0ea5e9", "#14b8a6", "#84cc16",
];
