import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AuthHeader, AuthError } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-components';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface ResetPasswordFormProps {
    onSuccess: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
        } else {
            onSuccess();
        }
        setLoading(false);
    };

    return (
        <div className="space-y-5">
            <AuthHeader
                title="Set new password"
                description="Enter your new password below. Make sure it's at least 6 characters."
            />

            <AuthError message={error} />

            <form onSubmit={handleReset} className="space-y-4">
                <FormField label="New Password" icon={<Lock className="w-3 h-3" />}>
                    <div className="relative">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </FormField>

                <FormField label="Confirm New Password" icon={<Lock className="w-3 h-3" />}>
                    <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </FormField>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Updating...' : 'Update password'}
                </Button>
            </form>
        </div>
    );
};
