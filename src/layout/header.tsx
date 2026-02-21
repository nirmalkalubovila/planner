import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

export const Header: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto w-full max-w-7xl flex h-14 items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-primary">Plan Maker</span>
                </div>

                <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-2 bg-accent/50 px-3 py-1 rounded-full border border-border">
                        <Clock size={16} />
                        <span>{format(time, 'EEE, MMM d, yyyy HH:mm:ss')}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};
