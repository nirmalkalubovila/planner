import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Calendar } from 'lucide-react';

export const ProfilePage: React.FC = () => {
    const { user, signOut } = useAuth();

    if (!user) return null;

    const initials = user.user_metadata?.full_name
        ? user.user_metadata.full_name.substring(0, 2).toUpperCase()
        : user.email?.substring(0, 2).toUpperCase() || 'U';

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
                <p className="text-muted-foreground">Manage your account settings</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Your registered details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase">
                                {initials}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{user.user_metadata?.full_name || 'Anonymous User'}</h3>
                                <p className="text-sm text-muted-foreground">Account Status: Active</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <Button onClick={signOut} variant="destructive" className="w-full sm:w-auto">
                            Sign Out
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>Customize your planner experience</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground italic mb-4">
                            More profile and app settings will be available here soon.
                        </p>
                        <Button variant="outline" disabled>Edit preferences (Coming Soon)</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
