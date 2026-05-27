import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { AuthLayout } from '@/components/ui/auth-layout';
import { Card, CardContent } from '@/components/ui/card';
import { LoginForm } from './forms/login-form';
import { OtpVerification } from './components/otp-verification';

export const LoginPage: React.FC = () => {
    const [showOtp, setShowOtp] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');

    const handleRequireOtp = (email: string) => {
        setOtpEmail(email);
        setShowOtp(true);
    };

    const handleSuccess = () => {
        // Force a full page load so AuthProvider re-initializes with the new session
        window.location.href = '/';
    };

    if (showOtp) {
        return (
            <OtpVerification
                context="login"
                email={otpEmail}
                onSuccess={handleSuccess}
                onBack={() => { setShowOtp(false); setOtpEmail(''); }}
            />
        );
    }

    return (
        <AuthLayout>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between w-full px-1">
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                        LEGACY LIFE BUILDER
                    </span>
                    <Link
                        to="/?bypass=true"
                        className="text-[10px] font-bold text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-accent hover:text-foreground transition-all duration-200"
                    >
                        What is Legacy Life Builder?
                    </Link>
                </div>
                <Card>
                    <CardContent className="p-6 md:p-8 space-y-5">
                        <LoginForm
                            onSuccess={handleSuccess}
                            onRequireOtp={handleRequireOtp}
                        />
                    </CardContent>
                </Card>
            </div>
        </AuthLayout>
    );
};
