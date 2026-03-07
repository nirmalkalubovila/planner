import React, { useEffect, useState } from 'react';
import { format, intervalToDuration } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export const Header: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const dob = user?.user_metadata?.dob;
    const duration = dob ? intervalToDuration({
        start: new Date(dob),
        end: time
    }) : null;

    return (
        <header className="sticky top-0 z-[100] w-full border-b border-white/5 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="grid grid-cols-3 items-center h-16 px-4 md:px-8 max-w-7xl mx-auto">

                {/* Left: Beautiful Logo & Title (Anchored to home) */}
                <div className="flex justify-start">
                    <Link
                        to="/"
                        className="flex items-center gap-2.5 group transition-all duration-300 hover:scale-[1.02] active:scale-95"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <img
                                src="/white-logo.svg"
                                alt="Legacy Life Builder Logo"
                                className="h-9 w-9 md:h-8 md:w-8 object-contain relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                            />
                        </div>
                        <div className="hidden md:flex flex-col">
                            <span className="text-sm md:text-lg font-bold tracking-[-0.03em] leading-none uppercase bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                                Legacy Life Builder
                            </span>
                            <div className="h-[1.5px] w-0 group-hover:w-full bg-gradient-to-r from-primary/80 to-transparent transition-all duration-500 ease-out" />
                        </div>
                    </Link>
                </div>

                {/* Middle: Timer (Logo-style Text) */}
                <div className="flex flex-col items-center justify-center font-bold text-white tracking-widest leading-tight">
                    <div className="flex flex-col items-center group cursor-default">
                        <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-white/40 group-hover:text-primary transition-colors">
                            {format(time, 'yyyy, MMM dd')}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg md:text-xl font-mono">
                                {format(time, 'HH:mm:ss')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Round Profile Icon with Dropdown & Age */}
                <div className="flex justify-end items-center gap-3 md:gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 p-0 hover:bg-white/10 transition-all active:scale-95 focus:outline-none focus:ring-1 focus:ring-white/20">
                                <UserIcon size={20} className="text-white/80" />
                                {user && (
                                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-52 p-1.5 border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl" align="end">
                            <div className="px-3 py-2.5 border-b border-white/5 mb-1.5 bg-white/5 -mx-1.5 -mt-1.5 rounded-t-lg">
                                <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Signed in as</p>
                                <p className="text-xs text-white truncate max-w-full font-medium mt-1">
                                    {user?.email}
                                </p>
                            </div>
                            <div className="space-y-0.5">
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all rounded-md group"
                                >
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 group-hover:bg-primary/20 transition-colors">
                                        <Settings size={14} className="group-hover:rotate-45 transition-transform duration-500" />
                                    </div>
                                    <span className="font-medium">Settings</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-md group"
                                >
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/5 group-hover:bg-red-500/20 transition-colors">
                                        <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                    <span className="font-medium">Log out</span>
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Live Age Display */}
                    {duration && (
                        <div className="hidden sm:flex flex-col items-start min-w-[80px] group cursor-default">
                            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] text-white/30 group-hover:text-primary/60 transition-colors font-bold">
                                <Sparkles size={8} className="animate-pulse" />
                                <span>Time Lived</span>
                            </div>
                            <div className="text-[12px] md:text-sm font-black text-white/80 tabular-nums tracking-wider leading-none mt-0.5 flex items-baseline gap-1">
                                <span className="text-white">{duration.years}</span><span className="text-white/30 text-[10px] lowercase font-normal">y</span>
                                <span className="text-white">{duration.months}</span><span className="text-white/30 text-[10px] lowercase font-normal">m</span>
                                <span className="text-white">{duration.days}</span><span className="text-white/30 text-[10px] lowercase font-normal">d</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
