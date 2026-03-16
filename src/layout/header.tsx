import React, { useState } from 'react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, LogOut, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/api/services/profile-service';
import { useTimeLived } from '@/hooks/use-time-lived';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export const Header: React.FC = () => {
    const { user, signOut } = useAuth();
    const { profile } = useUserProfile(user);
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);

    const { time, duration } = useTimeLived(profile?.dob || user?.user_metadata?.dob);

    const fullName: string = profile?.fullName || user?.user_metadata?.full_name || '';
    const firstName = fullName.split(' ')[0] || '';
    // Prefer user_profiles.avatar_url (persists across OAuth) over user_metadata.avatar_url (overwritten on login)
    const avatarUrl: string | null = profile?.avatarUrl || user?.user_metadata?.avatar_url || null;
    const initials = fullName
        ? fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || 'U';

    const handleLogout = async () => {
        setProfileOpen(false);
        await signOut();
        navigate('/login');
    };

    const handleSettings = () => {
        setProfileOpen(false);
        navigate('/profile');
    };

    return (
        <header className="sticky top-0 z-[100] w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="grid grid-cols-3 items-center h-12 px-2 sm:px-4 md:px-8">

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
                                className="h-9 w-9 md:h-8 md:w-8 object-contain relative z-10 drop-shadow-[0_0_8px_hsl(var(--foreground)/0.3)] invert dark:invert-0"
                            />
                        </div>
                        <div className="hidden md:flex flex-col">
                            <span className="text-sm md:text-lg font-bold tracking-[-0.03em] leading-none uppercase bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                                Legacy Life Builder
                            </span>
                            <div className="h-[1.5px] w-0 group-hover:w-full bg-gradient-to-r from-primary/80 to-transparent transition-all duration-500 ease-out" />
                        </div>
                    </Link>
                </div>

                {/* Middle: Timer (Logo-style Text) */}
                <div className="flex flex-col items-center justify-center font-bold text-foreground tracking-widest leading-tight">
                    <div className="flex flex-col items-center group cursor-default">
                        <span className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">
                            {format(time, 'yyyy, MMM dd')}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg md:text-xl font-mono">
                                {format(time, 'HH:mm:ss')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Age + Name + Avatar Dropdown */}
                <div className="flex justify-end items-center gap-2 sm:gap-3 md:gap-4">
                    <ThemeToggle />
                    {/* Live Age Display */}
                    {duration && (
                        <div className="hidden sm:flex flex-col items-end min-w-[80px] group cursor-default">
                            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] text-muted-foreground group-hover:text-primary/60 transition-colors font-bold">
                                <Sparkles size={8} className="animate-pulse" />
                                <span>{firstName ? `${firstName}'s age` : 'Age'}</span>
                            </div>
                            <div className="text-[12px] md:text-sm font-black text-foreground tabular-nums tracking-wider leading-none mt-0.5 flex items-baseline gap-1">
                                <span className="text-foreground">{duration.years}</span><span className="text-muted-foreground text-[10px] lowercase font-normal">y</span>
                                <span className="text-foreground">{duration.months}</span><span className="text-muted-foreground text-[10px] lowercase font-normal">m</span>
                                <span className="text-foreground">{duration.days}</span><span className="text-muted-foreground text-[10px] lowercase font-normal">d</span>
                            </div>
                        </div>
                    )}


                    <Popover open={profileOpen} onOpenChange={setProfileOpen}>
                        <PopoverTrigger asChild>
                            <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted p-0 hover:bg-accent transition-all active:scale-95 focus:outline-none focus:ring-1 focus:ring-ring overflow-hidden">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-xs font-bold text-foreground select-none">{initials}</span>
                                )}
                                {user && (
                                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-intent-goal" />
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-52 p-1.5 border-border bg-popover/95 backdrop-blur-xl shadow-2xl" align="end">
                            <div className="px-3 py-2.5 border-b border-border mb-1.5 bg-muted -mx-1.5 -mt-1.5 rounded-t-lg">
                                <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Signed in as</p>
                                <p className="text-xs text-foreground truncate max-w-full font-medium mt-1">
                                    {user?.email}
                                </p>
                            </div>
                            <div className="space-y-0.5">
                                <button
                                    onClick={handleSettings}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all rounded-md group"
                                >
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted group-hover:bg-primary/20 transition-colors">
                                        <Settings size={14} className="group-hover:rotate-45 transition-transform duration-500" />
                                    </div>
                                    <span className="font-medium">Settings</span>
                                </button>
                                <button
                                    type="button"
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
                </div>
            </div>
        </header>
    );
};

export default Header;
