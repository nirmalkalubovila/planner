import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListTodo, Target, CalendarDays, BarChart2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';

const navigation = [
    { name: 'Today Tasks', href: '/', icon: Home, label: 'Execution' },
    { name: 'Habits', href: '/habits', icon: ListTodo, label: 'Consistency' },
    { name: 'Goals', href: '/goals', icon: Target, label: 'Vision' },
    { name: 'Planner', href: '/planner', icon: CalendarDays, label: 'Strategy' },
    { name: 'Statistics', href: '/statistics', icon: BarChart2, label: 'Insights' },
];

export const DashboardSidebar: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    }, [isCollapsed]);

    return (
        <div className={cn(
            "flex h-full flex-col border-r border-white/5 bg-background text-foreground transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] relative z-50",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Header / Brand area placeholder */}
            <div className={cn(
                "flex items-center h-16 px-6",
                isCollapsed ? "justify-center" : "justify-between"
            )}>
                {!isCollapsed && (
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 select-none">
                        Navigation
                    </span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-white/5 text-white/30 hover:text-white transition-all duration-300"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
                </Button>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                {navigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all duration-500 group relative overflow-hidden",
                                isActive
                                    ? "bg-white/[0.03] text-primary shadow-sm"
                                    : "text-white/40 hover:text-white hover:bg-white/[0.02]",
                                isCollapsed ? "justify-center" : "justify-start"
                            )
                        }
                    >
                        {/* Dynamic Active Glow / Background effect */}
                        <NavLink
                            to={item.href}
                            className={({ isActive }) => cn(
                                "absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent transition-opacity duration-500 pointer-events-none",
                                isActive ? "opacity-100" : "opacity-0"
                            )}
                        />

                        <item.icon
                            size={14}
                            strokeWidth={isActiveIcon(item.href) ? 2.5 : 1.5}
                            className={cn(
                                "shrink-0 transition-all duration-500 group-hover:scale-110 relative z-10",
                                isCollapsed ? "" : ""
                            )}
                        />

                        {!isCollapsed && (
                            <div className="flex flex-col items-start relative z-10 animate-in fade-in slide-in-from-left-2 duration-500">
                                <span className="text-[12px] font-bold tracking-tight leading-none mb-1">
                                    {item.name}
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-60 transition-opacity">
                                    {item.label}
                                </span>
                            </div>
                        )}

                        {/* Active Vertical Notch */}
                        <NavLink
                            to={item.href}
                            className={({ isActive }) => cn(
                                "absolute left-0 w-[3px] bg-primary rounded-r-full transition-all duration-500 ease-out",
                                isActive ? "h-6 opacity-100" : "h-0 opacity-0"
                            )}
                        />
                    </NavLink>
                ))}
            </nav>

            {/* Support / Bottom links */}
            <div className="p-6 mt-auto">
                <div className={cn(
                    "flex items-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 transition-all duration-500",
                    isCollapsed ? "justify-center" : "gap-4"
                )}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-white/80">System Online</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Operational</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper to determine active state inside the loop if NavLink isActive is tricky for the icon props
// But standard isActive in className usually suffices. Using a small helper for prop clarity.
const isActiveIcon = (href: string) => window.location.pathname === href;
