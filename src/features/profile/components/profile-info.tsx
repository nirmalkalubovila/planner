import React from 'react';
import { Mail, Calendar, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileInfoProps {
    user: any;
    signOut: () => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ user, signOut }) => {
    const initials = user.user_metadata?.full_name
        ? user.user_metadata.full_name.substring(0, 2).toUpperCase()
        : user.email?.substring(0, 2).toUpperCase() || 'U';

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-xl">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg uppercase">
                    {initials}
                </div>
                <div>
                    <h3 className="font-bold text-lg">{user.user_metadata?.full_name || 'User'}</h3>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">DOB: {user.user_metadata?.dob || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Sign Out */}
            <Button
                onClick={signOut}
                variant="ghost"
                className="w-full h-10 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 border border-white/5 hover:border-destructive/20 transition-all"
            >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
            </Button>
        </div>
    );
};
