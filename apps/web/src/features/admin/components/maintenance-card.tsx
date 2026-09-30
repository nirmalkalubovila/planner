import React, { useState } from 'react';
import { Wrench, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { useLandingSettings, useUpdateLandingSettings } from '@/api/services/feedback-service';

/**
 * One-click maintenance switch. Takes effect immediately (no separate Save): users already in the app
 * pick it up within about a minute; the admin and the login page stay reachable.
 */
export const MaintenanceCard: React.FC = () => {
    const { data: settings, isLoading } = useLandingSettings();
    const updateSettings = useUpdateLandingSettings();
    const [confirming, setConfirming] = useState(false);

    const active = settings?.maintenance_mode ?? false;

    const apply = () => {
        updateSettings.mutate(
            { maintenance_mode: !active },
            { onSuccess: () => { try { sessionStorage.setItem('llb-maintenance-mode', String(!active)); } catch { /* ignore */ } } }
        );
        setConfirming(false);
    };

    return (
        <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${active ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card/60 border-border'}`}>
            <div className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                    <Wrench className="h-4 w-4" />
                </div>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                        Maintenance Mode
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black tracking-widest ${active ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
                            {active ? 'ON' : 'OFF'}
                        </span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                        Turn this on before upgrades or database work. Everyone except you sees a maintenance page. It applies immediately, no save needed.
                    </p>
                </div>
            </div>
            <Button
                onClick={() => setConfirming(true)}
                disabled={isLoading || updateSettings.isPending}
                variant={active ? 'default' : 'outline'}
                className="h-10 rounded-xl px-5 gap-2 shrink-0"
            >
                {updateSettings.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {active ? 'Turn maintenance OFF' : 'Turn maintenance ON'}
            </Button>

            <ConfirmationDialog
                isOpen={confirming}
                onClose={() => setConfirming(false)}
                onConfirm={apply}
                title={active ? 'End maintenance mode?' : 'Start maintenance mode?'}
                description={active ? 'The app becomes available to everyone again.' : 'All users except you will see the maintenance page until you turn it off.'}
                confirmText={active ? 'Turn off' : 'Turn on'}
                variant={active ? 'default' : 'destructive'}
            />
        </div>
    );
};
