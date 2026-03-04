import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Clock, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Desktop View: Left Name, Middle Grid Time, Right Profile */}
            <div className="hidden md:grid grid-cols-3 items-center h-14 px-8 w-full max-w-7xl mx-auto text-sm">

                {/* Left: System Name */}
                <div className="flex items-center justify-start gap-3">
                    <img src="/white-logo.svg" alt="Legacy Life Builder Logo" className="h-8 w-auto" />
                    <span className="text-xl font-bold tracking-tight text-primary">Legacy Life Builder</span>
                </div>

                {/* Middle: Time, Date, Year */}
                <div className="flex items-center justify-center font-medium text-muted-foreground w-full">
                    <div className="flex items-center gap-2 bg-accent/50 px-4 py-1.5 rounded-full border border-border shadow-sm">
                        <Clock size={16} className="text-primary" />
                        <span>{format(time, 'EEE, MMM d, yyyy HH:mm')}</span>
                    </div>
                </div>

                {/* Right: User Profile & Reflection */}
                <div className="flex items-center justify-end gap-3">
                    <Link to="/profile" className="flex items-center gap-2 hover:text-primary transition-colors text-muted-foreground font-medium bg-secondary/50 px-3 py-1.5 rounded-full border border-border hover:bg-secondary">
                        <UserCircle size={20} />
                        <span>Profile</span>
                    </Link>
                </div>
            </div>

            {/* Mobile View: Left Time, Right Profile */}
            <div className="flex md:hidden items-center justify-between h-14 px-4 w-full text-sm">

                {/* Left: System Name (Mobile) */}
                <div className="flex items-center gap-2">
                    <img src="/white-logo.svg" alt="Legacy Life Builder Logo" className="h-6 w-auto" />
                    <span className="text-base font-bold tracking-tight text-primary">Legacy Life Builder</span>
                </div>

                {/* Right: User Profile & Reflection */}
                <div className="flex items-center gap-2">
                    <Link to="/profile" className="flex items-center gap-2 text-primary bg-primary/10 px-3 py-1 rounded-full">
                        <UserCircle size={20} />
                        <span className="text-xs font-semibold">Profile</span>
                    </Link>
                </div>
            </div>
        </header>
    );
};
