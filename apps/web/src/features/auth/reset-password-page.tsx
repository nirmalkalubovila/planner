import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AuthLayout, AuthHeader } from '@/components/ui/auth-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AiLoading } from '@/components/ui/ai-loading';
import { CheckCircle } from 'lucide-react';
import { ResetPasswordForm } from './forms/reset-password-form';

export const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
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

    const handleSuccess = () => {
        setSuccess(true);
        setTimeout(() => navigate('/'), 3000);
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
                    <ResetPasswordForm onSuccess={handleSuccess} />
                </CardContent>
            </Card>
        </AuthLayout>
    );
};
