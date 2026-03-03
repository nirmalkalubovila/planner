import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReflectionStore } from './reflection-store';
import { useAuth } from '@/contexts/auth-context';
import { ReflectionUtils } from '@/utils/reflection-utils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

import { StepSummary } from './step-summary';
import { StepInput } from './step-input';
import { StepAI } from './step-ai';
import { StepMissed } from './step-missed';
import { useGetWeekPlan } from '@/api/services/planner-service';
import { WeekUtils } from '@/utils/week-utils';

export const WeekReflectionDialog: React.FC = () => {
    const { isOpen, setIsOpen, step, setStep, resetStore } = useReflectionStore();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [hasChecked, setHasChecked] = useState(false);

    // Get last week's data to process it
    const lastWeek = WeekUtils.addWeeks(WeekUtils.getCurrentWeek(), -1);
    const { data: _lastWeekPlan } = useGetWeekPlan(lastWeek);

    // Auto trigger check
    useEffect(() => {
        if (!user || hasChecked) return;
        setHasChecked(true);

        // Condition 1: Older User (isPersonalized is true)
        const isPersonalized = user.user_metadata?.isPersonalized;
        if (!isPersonalized) return;

        const planDay = user.user_metadata?.planDay;
        const planStartTime = user.user_metadata?.planStartTime;
        const lastReflected = user.user_metadata?.lastReflectionDate;

        // Condition 2: Planning start time for last week passed
        if (planDay && planStartTime && ReflectionUtils.isReflectionDue(planDay, planStartTime, lastReflected)) {
            // Load and analyze data to pass into steps (we mock some for now, later enhance processing)
            useReflectionStore.getState().setSummaryData({
                taskCompletionRate: 75,
                goalSummary: "Made progress on Core Project",
                habitSummary: "Consistently hit morning routine"
            });

            // Collect missed tasks logic (simplified)
            useReflectionStore.getState().setMissedTasks([
                { id: '1', name: 'Finish UI Design', type: 'custom' },
                { id: '2', name: 'Read 20 Pages', type: 'habit' }
            ]);

            setIsOpen(true);
        }
    }, [user, hasChecked, setIsOpen]);

    if (!isOpen) return null;

    const handleSkip = () => {
        setIsOpen(false);
        resetStore();
        navigate('/planner');
    };

    const handleNext = () => setStep(step + 1);
    const handlePrev = () => setStep(Math.max(1, step - 1));

    const renderStep = () => {
        switch (step) {
            case 1: return <StepSummary onNext={handleNext} />;
            case 2: return <StepInput onNext={handleNext} onPrev={handlePrev} />;
            case 3: return <StepAI onNext={handleNext} onPrev={handlePrev} />;
            case 4: return <StepMissed onSkip={handleSkip} onPrev={handlePrev} />;
            default: return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-2xl px-4 py-8 md:p-8"
                >
                    <div className="absolute top-8 right-8 z-[110]">
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={handleSkip}>
                            Skip to Planner <X className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    <div className="w-full max-w-4xl h-full flex flex-col items-center justify-center relative">
                        {/* Progress Indicator */}
                        <div className="absolute top-4 w-full flex gap-2">
                            {[1, 2, 3, 4].map(s => (
                                <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-primary/20'}`} />
                            ))}
                        </div>

                        <div className="w-full h-full flex items-center justify-center pt-16">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full"
                                >
                                    {renderStep()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
