import React from 'react';


export const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; accent?: string }> = ({ label, value, icon, accent }) => (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-5 flex flex-col gap-3 relative overflow-hidden group transition-all duration-300 hover:border-primary/20">
        <div className={`flex items-center justify-center h-9 w-9 rounded-xl ${accent ?? 'bg-primary/10'}`}>
            {icon}
        </div>
        <div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight">{value}</div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
        </div>
        <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-primary/[0.03] group-hover:bg-primary/[0.06] transition-colors" />
    </div>
);

