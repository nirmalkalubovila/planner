import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AuthLayout, AuthHeader, AuthError } from '@/components/ui/auth-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-components';
import { Text } from '@/components/ui/typography';
import { ArrowLeft, Mail } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    if (sent) {
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
                            description={`We've sent a password reset link to ${email}. Click the link in the email to reset your password.`}
                        />
                        <Text variant="small">Didn't receive the email? Check your spam folder or try again.</Text>
                        <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
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
                    <AuthHeader
                        title="Forgot your password?"
                        description="Enter your email address and we'll send you a link to reset your password."
                    />

                    <AuthError message={error} />

                    <form onSubmit={handleReset} className="space-y-4">
                        <FormField label="Email" icon={<Mail className="w-3 h-3" />}>
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </FormField>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Sending...' : 'Send reset link'}
                        </Button>
                    </form>

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
