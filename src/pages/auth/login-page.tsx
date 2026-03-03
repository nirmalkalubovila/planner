import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/ui/auth-layout';
import { Card, CardContent } from '@/components/ui/card';
import { LoginForm } from './forms/login-form';
import { OtpVerification } from './components/otp-verification';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [showOtp, setShowOtp] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');

    const handleRequireOtp = (email: string) => {
        setOtpEmail(email);
        setShowOtp(true);
    };

    const handleSuccess = () => {
        navigate('/');
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
            <Card>
                <CardContent className="p-6 md:p-8 space-y-5">
                    <LoginForm
                        onSuccess={handleSuccess}
                        onRequireOtp={handleRequireOtp}
                    />
                </CardContent>
            </Card>
        </AuthLayout>
    );
};
