import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { supabase } from '@llb/api';

import { OtpVerification } from '@/components/auth/otp-verification';
import { AuthDivider, AuthHeader, AuthLayout } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { GoogleButton } from '@/components/ui/google-button';
import { AppleSignInButton } from '@/components/ui/apple-signin-button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/typography';
import { LegalLinksInline } from '@/components/common/legal-links';
import { signInWithGoogle } from '@/features/auth/use-google-oauth';
import { signInWithApple, isAppleSignInCancellation } from '@/features/auth/use-apple-oauth';
import { WEB_BASE_URL } from '@/lib/web-links';

const MUTED_ICON_COLOR = '#a1a1aa';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isEmailNotConfirmed = error.toLowerCase().includes('email not confirmed');

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      // No manual navigation: (auth)/_layout.tsx redirects once
      // onAuthStateChange fires and AuthProvider's `user` updates.
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmEmail = async () => {
    setError('');
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    if (resendError) {
      setError(resendError.message);
    } else {
      setOtpEmail(email.trim());
    }
  };

  const handleLearnMore = () => {
    WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/?bypass=true`);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // No manual navigation: (auth)/_layout.tsx redirects once
      // onAuthStateChange fires and AuthProvider's `user` updates.
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError('');
    try {
      await signInWithApple();
    } catch (err: any) {
      if (!isAppleSignInCancellation(err)) {
        setError(err?.message || 'Apple sign-in failed.');
      }
    }
  };

  if (otpEmail) {
    return (
      <OtpVerification
        context="login"
        email={otpEmail}
        onSuccess={() => {}}
        onBack={() => setOtpEmail(null)}
      />
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <AuthLayout>
        <View className="flex-row items-center justify-between px-1 mb-4">
          <Text variant="tiny" className="font-bold uppercase tracking-widest">
            Legacy Life Builder
          </Text>
          <Pressable
            onPress={handleLearnMore}
            className="rounded-lg border border-border px-3 py-1.5 active:bg-accent"
          >
            <Text variant="tiny" className="font-bold">
              What is Legacy Life Builder?
            </Text>
          </Pressable>
        </View>
        <Card>
          <CardContent className="gap-5">
            <AuthHeader
              title="Welcome Back"
              description="Log in to your account to continue planning your success."
            />

            {!!error && (
              <View className="p-3 rounded-md bg-destructive/10">
                <Text className="text-sm text-destructive">
                  {error}
                  {isEmailNotConfirmed && (
                    <>
                      {' '}
                      <Text className="text-primary font-medium" onPress={handleConfirmEmail}>
                        Confirm email →
                      </Text>
                    </>
                  )}
                </Text>
              </View>
            )}

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

              <FormField label="Password" icon={<Lock size={12} color={MUTED_ICON_COLOR} />}>
                <View className="relative justify-center">
                  <Input
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    className="pr-10"
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    className="absolute right-3"
                    hitSlop={8}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={MUTED_ICON_COLOR} />
                    ) : (
                      <Eye size={16} color={MUTED_ICON_COLOR} />
                    )}
                  </Pressable>
                </View>
              </FormField>

              <Pressable onPress={() => router.push('/forgot-password')} className="items-end">
                <Text variant="small" className="text-primary">
                  Forgot password?
                </Text>
              </Pressable>

              <Button onPress={handleSubmit} loading={submitting}>
                Log in
              </Button>
            </View>

            <AuthDivider />
            <GoogleButton
              label={googleLoading ? 'Signing in...' : 'Log in with Google'}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
            />
            <AppleSignInButton onPress={handleAppleLogin} />

            <Text variant="muted" className="text-center">
              Don&apos;t have an account?{' '}
              <Text className="text-primary font-medium" onPress={() => router.push('/signup')}>
                Sign up
              </Text>
            </Text>
            <LegalLinksInline />
          </CardContent>
        </Card>
      </AuthLayout>
    </KeyboardAvoidingView>
  );
}
