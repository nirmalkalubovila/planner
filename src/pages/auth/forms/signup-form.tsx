import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AuthHeader, AuthDivider, AuthError, GoogleButton } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-components';
import { Text } from '@/components/ui/typography';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { Eye, EyeOff, User, Mail, Lock, CalendarDays } from 'lucide-react';

interface SignupFormProps {
    onSuccess: () => void;
    onRequireOtp: (email: string) => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onRequireOtp }) => {
    const [name, setName] = useState('');
    const [dob, setDob] = useState<Date | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!dob) {
            setError('Please select your date of birth.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    dob: dob ? format(dob, 'yyyy-MM-dd') : null,
                },
            },
        });

        if (error) {
            setError(error.message);
        } else {
            if (data.session) {
                // Auto-confirmed session
                onSuccess();
            } else {
                // Email confirmation required — show OTP screen
                onRequireOtp(email);
            }
        }
        setLoading(false);
    };

    const handleGoogleSignup = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/personalize` }
            });
            if (error) throw error;
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <div className="space-y-5">
            <AuthHeader
                title="Create an Account"
                description="Sign up below to start tracking your goals and habits."
            />

            <AuthError message={error} />

            <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Full Name" icon={<User className="w-3 h-3" />} required>
                        <Input
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </FormField>

                    <FormField label="Date of Birth" icon={<CalendarDays className="w-3 h-3" />} required>
                        <CustomDatePicker
                            selected={dob}
                            onChange={(date) => setDob(date)}
                            placeholderText="Select your birthday"
                        />
                    </FormField>
                </div>

                <FormField label="Email" icon={<Mail className="w-3 h-3" />} required>
                    <Input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Password" icon={<Lock className="w-3 h-3" />} required>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Create a password"
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

                    <FormField label="Confirm Password" icon={<Lock className="w-3 h-3" />} required>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </FormField>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating...' : 'Create account'}
                </Button>
            </form>

            <AuthDivider />
            <GoogleButton onClick={handleGoogleSignup} />

            <Text variant="muted" className="text-center pt-2">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                    Log in
                </Link>
            </Text>
        </div>
    );
};
