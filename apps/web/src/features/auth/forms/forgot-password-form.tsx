import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AuthHeader, AuthError } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-components';
import { Mail } from 'lucide-react';

interface ForgotPasswordFormProps {
    onSuccess: (email: string) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            onSuccess(email);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-5">
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
        </div>
    );
};
