import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AuthLayout, AuthHeader, AuthDivider, AuthError, GoogleButton } from '@/components/ui/auth-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-components';
import { Text } from '@/components/ui/typography';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { Eye, EyeOff, User, Mail, Lock, CalendarDays, ArrowLeft } from 'lucide-react';

export const SignupPage: React.FC = () => {
    const [name, setName] = useState('');
    const [dob, setDob] = useState<Date | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // OTP verification state
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
    const [verifying, setVerifying] = useState(false);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate DOB is selected
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
                    dob: dob.toISOString().split('T')[0],
                },
            },
        });

        if (error) {
            setError(error.message);
        } else {
            if (data.session) {
                // Auto-confirmed (e.g., email confirmation is disabled)
                navigate('/personalize');
            } else {
                // Email confirmation required — show OTP screen
                setShowOtp(true);
            }
        }
        setLoading(false);
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste: split across fields
            const digits = value.replace(/\D/g, '').slice(0, 8).split('');
            const newOtp = [...otp];
            digits.forEach((d, i) => {
                if (index + i < 8) newOtp[index + i] = d;
            });
            setOtp(newOtp);
            const nextIndex = Math.min(index + digits.length, 7);
            otpRefs.current[nextIndex]?.focus();
            return;
        }

        if (value && !/^\d$/.test(value)) return; // Only digits

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 7) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const token = otp.join('');
        if (token.length !== 8) {
            setError('Please enter the complete 8-digit code.');
            return;
        }

        setVerifying(true);
        setError('');

        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
        });

        if (error) {
            setError(error.message);
        } else {
            navigate('/personalize');
        }
        setVerifying(false);
    };

    const handleResendOtp = async () => {
        setError('');
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        });
        if (error) {
            setError(error.message);
        } else {
            setError(''); // Clear any previous error
            setOtp(['', '', '', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        }
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

    // ─── OTP Verification Screen ───
    if (showOtp) {
        return (
            <AuthLayout>
                <Card>
                    <CardContent className="p-6 md:p-8 space-y-5">
                        <AuthHeader
                            title="Verify your email"
                            description={`We've sent a verification code to ${email}. Enter it below to confirm your account.`}
                        />

                        <AuthError message={error} />

                        <div className="flex justify-center gap-2">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { otpRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={8}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    className="w-10 h-12 text-center text-lg font-bold rounded-md border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleVerifyOtp}
                            disabled={verifying || otp.join('').length !== 8}
                        >
                            {verifying ? 'Verifying...' : 'Verify & Continue'}
                        </Button>

                        <div className="text-center space-y-2">
                            <Text variant="small">
                                Didn't receive the code?{' '}
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    className="text-primary hover:underline font-medium"
                                >
                                    Resend
                                </button>
                            </Text>
                            <button
                                type="button"
                                onClick={() => { setShowOtp(false); setOtp(['', '', '', '', '', '', '', '']); setError(''); }}
                                className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors mx-auto"
                            >
                                <ArrowLeft className="w-3 h-3" /> Back to signup
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </AuthLayout>
        );
    }

    // ─── Signup Form ───
    return (
        <AuthLayout>
            <Card>
                <CardContent className="p-6 md:p-8 space-y-5">
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
                </CardContent>
            </Card>
        </AuthLayout>
    );
};
