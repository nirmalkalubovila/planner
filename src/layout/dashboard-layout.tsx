import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { DashboardSidebar } from './dashboard-sidebar';
import { MobileNav } from './mobile-nav';

export const DashboardLayout: React.FC = () => {
    return (
        <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
            <Header />
            <div className="flex flex-1 overflow-hidden relative pb-16 md:pb-0">
                <div className="hidden md:flex">
                    <DashboardSidebar />
                </div>
                <main className="flex-1 overflow-y-auto w-full custom-scrollbar flex flex-col relative">
                    <Outlet />
                </main>
                <MobileNav />
            </div>
        </div>
    );
};
