import React, { useState } from 'react';

import { AuthLayout } from '@/components/ui/auth-layout';
import { Card, CardContent } from '@/components/ui/card';
import { SignupForm } from './forms/signup-form';
import { OtpVerification } from './components/otp-verification';

export const SignupPage: React.FC = () => {
    const [showOtp, setShowOtp] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');

    const handleRequireOtp = (email: string) => {
        setOtpEmail(email);
        setShowOtp(true);
    };

    const handleSuccess = () => {
        // Force a full page load so AuthProvider re-initializes with the new session
        window.location.href = '/personalize';
    };

    if (showOtp) {
        return (
            <OtpVerification
                context="signup"
                email={otpEmail}
                onSuccess={handleSuccess}
                onBack={() => { setShowOtp(false); setOtpEmail(''); }}
            />
        );
    }

    return (
        <AuthLayout>
            <Card>
                <CardContent className="p-6 md:p-8 space-y-5">
                    <SignupForm
                        onSuccess={handleSuccess}
                        onRequireOtp={handleRequireOtp}
                    />
                </CardContent>
            </Card>
        </AuthLayout>
    );
};
