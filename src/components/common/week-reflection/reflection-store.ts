import { create } from 'zustand';

export interface MissedTask {
    id: string;
    name: string;
    dayIdx?: number;
    slotIdx?: number;
    goalId?: string;
    originalDate?: Date;
    type?: string;
}

interface ReflectionStore {
    isOpen: boolean;
    step: number;
    setIsOpen: (isOpen: boolean) => void;
    setStep: (step: number) => void;

    // Inputs
    goodThings: string;
    badThings: string;
    setGoodThings: (val: string) => void;
    setBadThings: (val: string) => void;

    // AI Response
    aiResponse: string;
    setAiResponse: (val: string) => void;

    // Summary Data 
    summaryData: {
        taskCompletionRate: number;
        goalSummary: string;
        habitSummary: string;
    };
    setSummaryData: (data: ReflectionStore['summaryData']) => void;

    // Missed Tasks
    missedTasks: MissedTask[];
    setMissedTasks: (tasks: MissedTask[]) => void;
    removeMissedTask: (id: string) => void;

    // Reset store
    resetStore: () => void;
}

export const useReflectionStore = create<ReflectionStore>((set) => ({
    isOpen: false,
    step: 1,
    setIsOpen: (isOpen) => set({ isOpen }),
    setStep: (step) => set({ step }),

    goodThings: '',
    badThings: '',
    setGoodThings: (val) => set({ goodThings: val }),
    setBadThings: (val) => set({ badThings: val }),

    aiResponse: '',
    setAiResponse: (val) => set({ aiResponse: val }),

    summaryData: {
        taskCompletionRate: 0,
        goalSummary: '',
        habitSummary: '',
    },
    setSummaryData: (data) => set({ summaryData: data }),

    missedTasks: [],
    setMissedTasks: (tasks) => set({ missedTasks: tasks }),
    removeMissedTask: (id) => set((state) => ({
        missedTasks: state.missedTasks.filter(t => t.id !== id)
    })),

    resetStore: () => set({
        step: 1,
        goodThings: '',
        badThings: '',
        aiResponse: '',
        missedTasks: [],
        summaryData: {
            taskCompletionRate: 0,
            goalSummary: '',
            habitSummary: '',
        }
    }),
}));
