import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListTodo, Target, CalendarDays, Settings } from 'lucide-react';
import { cn } from "@/lib/utils";

const navigation = [
    { name: 'Today', href: '/', icon: Home },
    { name: 'Habits', href: '/habits', icon: ListTodo },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Week Planner', href: '/planner', icon: CalendarDays },
];

export const DashboardSidebar: React.FC = () => {
    return (
        <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {navigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )
                        }
                    >
                        <item.icon size={18} />
                        {item.name}
                    </NavLink>
                ))}
            </div>

            <div className="p-4 border-t">
                <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                        cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                        )
                    }
                >
                    <Settings size={18} />
                    Profile
                </NavLink>
            </div>
        </div>
    );
};
