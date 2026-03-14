import React, { useState } from 'react';
import { KeyRound, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface ProfileSecurityProps {
    user: any;
}

export const ProfileSecurity: React.FC<ProfileSecurityProps> = ({ user }) => {
    // Email change
    const [newEmail, setNewEmail] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);

    // Password change
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleEmailChange = async () => {
        if (!newEmail || newEmail === user.email) {
            toast.error('Please enter a different email address.');
            return;
        }

        setEmailLoading(true);
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        setEmailLoading(false);

        if (!error) {
            toast.success('Confirmation email sent to both old and new addresses. Please verify to complete the change.');
            setNewEmail('');
        } else {
            toast.error(error.message);
        }
    };

    const handlePasswordChange = async () => {
        if (!newPassword) {
            toast.error('Please enter a new password.');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        setPasswordLoading(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        setPasswordLoading(false);

        if (!error) {
            toast.success('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            toast.error(error.message);
        }
    };

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-xl space-y-8">
            <h3 className="text-base font-bold">Account Security</h3>

            {/* Email Change */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Change Email
                </div>
                <p className="text-xs text-muted-foreground/60">
                    Current: <span className="text-foreground font-medium">{user.email}</span>
                </p>
                <div className="flex gap-3">
                    <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="New email address"
                        className="h-10 rounded-xl bg-white/[0.02] border-white/5 flex-1"
                    />
                    <Button
                        onClick={handleEmailChange}
                        disabled={emailLoading || !newEmail}
                        variant="outline"
                        className="h-10 rounded-xl px-5 font-semibold border-white/10 shrink-0"
                    >
                        {emailLoading ? 'Sending...' : 'Update Email'}
                    </Button>
                </div>
            </div>

            {/* Password Change */}
            <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                    Change Password
                </div>
                <div className="space-y-3 max-w-md">
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="h-10 rounded-xl bg-white/[0.02] border-white/5 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <Input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="h-10 rounded-xl bg-white/[0.02] border-white/5"
                    />
                    <Button
                        onClick={handlePasswordChange}
                        disabled={passwordLoading || !newPassword || !confirmPassword}
                        className="h-10 rounded-xl font-semibold w-full md:w-auto px-6"
                    >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
