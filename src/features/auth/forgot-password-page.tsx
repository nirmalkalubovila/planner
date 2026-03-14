import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout, AuthHeader } from '@/components/ui/auth-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { ArrowLeft, Mail } from 'lucide-react';
import { ForgotPasswordForm } from './forms/forgot-password-form';

export const ForgotPasswordPage: React.FC = () => {
    const [sentEmail, setSentEmail] = useState('');

    if (sentEmail) {
        return (
            <AuthLayout>
                <Card>
                    <CardContent className="p-6 md:p-8 space-y-5 text-center">
                        <AuthHeader
                            icon={
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Mail className="h-6 w-6 text-primary" />
                                </div>
                            }
                            title="Check your email"
                            description={`We've sent a password reset link to ${sentEmail}. Click the link in the email to reset your password.`}
                        />
                        <Text variant="small">Didn't receive the email? Check your spam folder or try again.</Text>
                        <Button variant="outline" className="w-full" onClick={() => setSentEmail('')}>
                            Try again
                        </Button>
                        <Link to="/login">
                            <Button variant="ghost" className="w-full">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <Card>
                <CardContent className="p-6 md:p-8 space-y-5">
                    <ForgotPasswordForm onSuccess={(email) => setSentEmail(email)} />

                    <Link to="/login">
                        <Button variant="ghost" className="w-full">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </AuthLayout>
    );
};
