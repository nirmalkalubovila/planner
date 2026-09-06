import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AuthLayout, AuthHeader, AuthError } from '@/components/ui/auth-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const RESEND_COOLDOWN = 60; // seconds

interface OtpVerificationProps {
    email: string;
    onSuccess: () => void;
    onBack: () => void;
    context: 'login' | 'signup';
}

export const OtpVerification: React.FC<OtpVerificationProps> = ({ email, onSuccess, onBack, context }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
    const [resendSuccess, setResendSuccess] = useState(false);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Start countdown on mount (signUp already sent the first OTP)
    const startCooldown = useCallback(() => {
        setCooldown(RESEND_COOLDOWN);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        startCooldown();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [startCooldown]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
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
        if (value && !/^\d$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
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
            setVerifying(false);
        } else {
            onSuccess();
        }
    };

    const handleResendOtp = async () => {
        if (cooldown > 0) return;
        setError('');
        setResendSuccess(false);

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        });

        if (error) {
            setError(error.message);
        } else {
            setOtp(['', '', '', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
            setResendSuccess(true);
            startCooldown();
            // Auto-hide success message after 4s
            setTimeout(() => setResendSuccess(false), 4000);
        }
    };

    const canResend = cooldown === 0;

    return (
        <AuthLayout>
            <Card>
                <CardContent className="p-6 md:p-8 space-y-5">
                    <AuthHeader
                        title="Verify your email"
                        description={`We've sent a verification code to ${email}. Enter it below to confirm your account.`}
                    />

                    <AuthError message={error} />

                    {resendSuccess && (
                        <div className="flex items-center gap-2 p-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md animate-in fade-in slide-in-from-top-1 duration-200">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            A new code has been sent to your email.
                        </div>
                    )}

                    <div className="flex justify-center gap-1.5 md:gap-2">
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
                                className="w-8 h-10 md:w-10 md:h-12 text-center text-base md:text-lg font-bold rounded-md border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
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
                            {canResend ? (
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    className="text-primary hover:underline font-medium"
                                >
                                    Resend
                                </button>
                            ) : (
                                <span className="text-muted-foreground/60">
                                    Resend in <span className="font-semibold tabular-nums text-muted-foreground">{cooldown}s</span>
                                </span>
                            )}
                        </Text>
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors mx-auto"
                        >
                            <ArrowLeft className="w-3 h-3" /> Back to {context}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </AuthLayout>
    );
};
