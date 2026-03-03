import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AuthHeader, AuthDivider, GoogleButton } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-components';
import { Text } from '@/components/ui/typography';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

interface LoginFormProps {
    onSuccess: () => void;
    onRequireOtp: (email: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onRequireOtp }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isEmailNotConfirmed = error.toLowerCase().includes('email not confirmed');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            onSuccess();
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/` }
            });
            if (error) throw error;
        } catch (error: any) {
            setError(error.message);
        }
    };

    const handleConfirmEmail = async () => {
        setError('');
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        });
        if (error) {
            setError(error.message);
        } else {
            onRequireOtp(email);
        }
    };

    return (
        <div className="space-y-5">
            <AuthHeader
                title="Welcome Back"
                description="Log in to your account to continue planning your success."
            />

            {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                    {isEmailNotConfirmed && (
                        <>
                            {' '}
                            <button
                                type="button"
                                onClick={handleConfirmEmail}
                                className="text-primary hover:underline font-medium"
                            >
                                Confirm email →
                            </button>
                        </>
                    )}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
                <FormField label="Email" icon={<Mail className="w-3 h-3" />}>
                    <Input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </FormField>

                <FormField label="Password" icon={<Lock className="w-3 h-3" />}>
                    <div className="relative">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
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

                <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                        Forgot password?
                    </Link>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Logging in...' : 'Log in'}
                </Button>
            </form>

            <AuthDivider />
            <GoogleButton onClick={handleGoogleLogin} label="Log in with Google" />

            <Text variant="muted" className="text-center pt-2">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                    Sign up
                </Link>
            </Text>
        </div>
    );
};
