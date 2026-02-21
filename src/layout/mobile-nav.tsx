import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListTodo, Target, CalendarDays, Settings } from 'lucide-react';
import { cn } from "@/lib/utils";

const navigation = [
    { name: 'Today', href: '/', icon: Home },
    { name: 'Habits', href: '/habits', icon: ListTodo },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Planner', href: '/planner', icon: CalendarDays },
    { name: 'Profile', href: '/profile', icon: Settings },
];

export const MobileNav: React.FC = () => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-bottom">
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
                        <item.icon size={20} className={cn("mb-0.5")} />
                        <span className="sr-only sm:not-sr-only sm:text-[10px]">{item.name}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    );
};
