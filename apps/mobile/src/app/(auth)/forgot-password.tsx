import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { supabase } from '@llb/api';

import { AuthError, AuthHeader, AuthLayout } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/typography';
import { WEB_BASE_URL } from '@/lib/web-links';

const MUTED_ICON_COLOR = '#a1a1aa';

/** Sends the reset link to the WEB reset-password page, not a mobile deep
 * link: apps/mobile has no (auth)/reset-password screen and no Universal
 * Links/App Links set up yet (that's later infra — associated domains, an
 * AASA file served with the right content-type). Mirrors the plan's
 * documented fallback: one email template, degrades gracefully to web when
 * the app can't intercept it. */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentEmail, setSentEmail] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setError('');
    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${WEB_BASE_URL}/reset-password`,
    });
    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setSentEmail(email.trim());
    }
  };

  if (sentEmail) {
    return (
      <AuthLayout>
        <Card>
          <CardContent className="gap-5 items-center">
            <View className="h-12 w-12 rounded-full bg-primary/10 items-center justify-center">
              <Mail size={24} color="#e4e4e7" />
            </View>
            <View className="items-center gap-1">
              <Text className="text-2xl font-bold text-foreground text-center">
                Check your email
              </Text>
              <Text variant="muted" className="text-center">
                We&apos;ve sent a password reset link to {sentEmail}. Click the link in the email to
                reset your password.
              </Text>
            </View>
            <Text variant="small" className="text-center">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </Text>
            <Button variant="outline" onPress={() => setSentEmail('')} className="w-full">
              Try again
            </Button>
            <Button variant="ghost" onPress={() => router.replace('/login')} className="w-full">
              <View className="flex-row items-center gap-2">
                <ArrowLeft size={16} color="#e4e4e7" />
                <Text className="text-foreground font-medium">Back to login</Text>
              </View>
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <AuthLayout>
        <Card>
          <CardContent className="gap-5">
            <AuthHeader
              title="Forgot your password?"
              description="Enter your email address and we'll send you a link to reset your password."
            />

            {!!error && <AuthError message={error} />}

            <View className="gap-4">
              <FormField label="Email" icon={<Mail size={12} color={MUTED_ICON_COLOR} />}>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                />
              </FormField>

              <Button onPress={handleSubmit} loading={submitting}>
                Send reset link
              </Button>
            </View>

            <Button variant="ghost" onPress={() => router.replace('/login')}>
              <View className="flex-row items-center gap-2">
                <ArrowLeft size={16} color="#e4e4e7" />
                <Text className="text-foreground font-medium">Back to login</Text>
              </View>
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    </KeyboardAvoidingView>
  );
}
