import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AuthLayout, AuthHeader, AuthError } from '@/components/ui/auth-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-components';
import { AiLoading } from '@/components/ui/ai-loading';
import { Eye, EyeOff, CheckCircle, Lock } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setSessionReady(true);
            }
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setSessionReady(true);
        });

        return () => subscription.unsubscribe();
    }, []);

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
            setSuccess(true);
            setTimeout(() => navigate('/'), 3000);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <AuthLayout>
                <Card>
                    <CardContent className="p-6 md:p-8 space-y-5 text-center">
                        <AuthHeader
                            icon={
                                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                </div>
                            }
                            title="Password updated!"
                            description="Your password has been reset successfully. Redirecting to your dashboard..."
                        />
                        <Button className="w-full" onClick={() => navigate('/')}>
                            Go to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </AuthLayout>
        );
    }

    if (!sessionReady) {
        return (
            <AuthLayout>
                <Card>
                    <CardContent className="p-6 md:p-8 space-y-5 text-center">
                        <AiLoading size="md" text="Verifying your reset link..." />
                        <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/forgot-password')}>
                            Request a new link
                        </Button>
                    </CardContent>
                </Card>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <Card>
                <CardContent className="p-6 md:p-8 space-y-5">
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
                </CardContent>
            </Card>
        </AuthLayout>
    );
};
