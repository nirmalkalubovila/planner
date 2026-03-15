import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListTodo, Target, CalendarDays, BarChart2 } from 'lucide-react';
import { cn } from "@/lib/utils";

const navigation = [
    { name: 'Habits', href: '/habits', icon: ListTodo },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Today', href: '/', icon: Home },
    { name: 'Stats', href: '/statistics', icon: BarChart2 },
    { name: 'Planner', href: '/planner', icon: CalendarDays },
];

export const MobileNav: React.FC = () => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-bottom">
            <div className="flex items-center justify-around h-16">
                {navigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 text-xs font-medium transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )
                        }
                    >
                        <item.icon size={20} className="mb-0.5" />
                        <span className="text-[9px] sm:text-[10px]">{item.name}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    );
};
