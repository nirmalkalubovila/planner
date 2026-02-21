import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { DashboardSidebar } from './dashboard-sidebar';

export const DashboardLayout: React.FC = () => {
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <DashboardSidebar />
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mx-auto max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
