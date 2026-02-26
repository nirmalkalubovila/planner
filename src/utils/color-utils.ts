export const GOAL_COLORS = [
    "#3b82f6", // blue-500
    "#ef4444", // red-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#06b6d4", // cyan-500
    "#f97316", // orange-500
];

export const getGoalColor = (goalId: string) => {
    let hash = 0;
    for (let i = 0; i < goalId.length; i++) {
        hash = goalId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return GOAL_COLORS[Math.abs(hash) % GOAL_COLORS.length] + 'E6'; // 90% opacity hex
};

export const CUSTOM_TASK_COLORS = [
    "#f59e0b", // amber-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#0ea5e9", // sky-500
    "#14b8a6", // teal-500
    "#84cc16", // lime-500
];
