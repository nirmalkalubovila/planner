import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { supabase } from '@llb/api';

import { OtpVerification } from '@/components/auth/otp-verification';
import { AuthDivider, AuthError, AuthHeader, AuthLayout } from '@/components/ui/auth-layout';
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

const MUTED_ICON_COLOR = '#a1a1aa';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignup = async () => {
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

  const handleAppleSignup = async () => {
    setError('');
    try {
      await signInWithApple();
    } catch (err: any) {
      if (!isAppleSignInCancellation(err)) {
        setError(err?.message || 'Apple sign-in failed.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (!data.session) {
      // Supabase returns a session-less "success" with no error and an empty
      // identities[] for an email that already has a confirmed account —
      // deliberately, to avoid leaking which emails are registered. Without
      // this check we'd send the user to an OTP screen that will never
      // receive a code, since signUp() doesn't email one for that case.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('An account with this email already exists. Try logging in instead.');
        return;
      }
      // Email confirmation required — signUp already sent the code.
      setOtpEmail(email.trim());
    }
    // Else: session created (email confirmations disabled on this project) —
    // (auth)/_layout.tsx redirects once AuthProvider picks it up.
  };

  if (otpEmail) {
    return (
      <OtpVerification
        context="signup"
        email={otpEmail}
        onSuccess={() => {}}
        onBack={() => setOtpEmail(null)}
      />
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <AuthLayout>
        <Card>
          <CardContent className="gap-5">
            <AuthHeader
              title="Create an Account"
              description="Sign up below to start tracking your goals and habits."
            />

            {!!error && <AuthError message={error} />}

            <View className="gap-4">
              <FormField label="Full Name" icon={<User size={12} color={MUTED_ICON_COLOR} />}>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="John Doe"
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </FormField>

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
                    placeholder="Create a password"
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
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

              <FormField label="Confirm Password" icon={<Lock size={12} color={MUTED_ICON_COLOR} />}>
                <Input
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                />
              </FormField>

              <Button onPress={handleSubmit} loading={submitting}>
                Create account
              </Button>
            </View>

            <AuthDivider />
            <GoogleButton
              label={googleLoading ? 'Signing in...' : 'Sign up with Google'}
              onPress={handleGoogleSignup}
              disabled={googleLoading}
            />
            <AppleSignInButton onPress={handleAppleSignup} buttonType="SIGN_UP" />

            <Text variant="muted" className="text-center">
              Already have an account?{' '}
              <Text className="text-primary font-medium" onPress={() => router.replace('/login')}>
                Log in
              </Text>
            </Text>
            <LegalLinksInline />
          </CardContent>
        </Card>
      </AuthLayout>
    </KeyboardAvoidingView>
  );
}
