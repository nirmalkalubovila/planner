import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListTodo, Target, CalendarDays, BarChart2, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';

const navigation = [
    { name: 'Today Tasks', href: '/', icon: Home },
    { name: 'Week Planner', href: '/planner', icon: CalendarDays },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Habits', href: '/habits', icon: ListTodo },
    { name: 'Statistics', href: '/statistics', icon: BarChart2 },
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
            "flex h-full flex-col border-r bg-card text-card-foreground transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Collapse Toggle Button */}
            <div className={cn(
                "flex items-center p-4 border-b",
                isCollapsed ? "justify-center" : "justify-between"
            )}>
                {!isCollapsed && <span className="font-black text-xs uppercase tracking-widest text-primary opacity-80">Menu</span>}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-xl hover:bg-accent transition-all duration-200"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
                {navigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        title={isCollapsed ? item.name : ""}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 group relative",
                                isActive 
                                    ? "bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]" 
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                                isCollapsed ? "justify-center" : "justify-start"
                            )
                        }
                    >
                        <item.icon 
                            size={22} 
                            className={cn(
                                "shrink-0 transition-transform duration-200 group-hover:scale-110",
                                isCollapsed ? "" : "mr-1"
                            )} 
                        />
                        
                        {!isCollapsed && (
                            <span className="text-[13px] font-bold tracking-tight animate-in fade-in slide-in-from-left-2 duration-300">
                                {item.name}
                            </span>
                        )}

                        {/* Active Indicator */}
                        <NavLink 
                            to={item.href} 
                            className={({ isActive }) => cn(
                                "absolute left-0 w-1 bg-primary rounded-r-full transition-all duration-300",
                                isActive ? "h-6 opacity-100" : "h-0 opacity-0"
                            )} 
                        />
                    </NavLink>
                ))}
            </div>

            {/* Bottom Section (Optional: can add profile/logout here or footer) */}
            <div className="p-4 border-t opacity-40 hover:opacity-100 transition-opacity">
                 <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                    <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                    {!isCollapsed && <div className="h-2 w-20 bg-muted rounded animate-pulse" />}
                 </div>
            </div>
        </div>
    );
};
