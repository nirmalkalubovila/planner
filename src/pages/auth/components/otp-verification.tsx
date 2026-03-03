import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AuthLayout, AuthHeader, AuthError } from '@/components/ui/auth-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { ArrowLeft } from 'lucide-react';

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
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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
        setError('');
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        });
        if (error) {
            setError(error.message);
        } else {
            setOtp(['', '', '', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        }
    };

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
