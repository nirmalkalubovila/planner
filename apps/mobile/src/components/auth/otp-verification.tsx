import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '@llb/api';

import { AuthError, AuthHeader, AuthLayout } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/typography';

const OTP_LENGTH = 8;
const RESEND_COOLDOWN = 60;

interface OtpVerificationProps {
  email: string;
  context: 'login' | 'signup';
  onSuccess: () => void;
  onBack: () => void;
}

/** Mirrors apps/web/src/features/auth/components/otp-verification.tsx —
 * same 8-digit flow, same supabase calls (verifyOtp type:'signup' covers
 * both contexts, matching web). onSuccess is a no-op on purpose: verifyOtp
 * creates a session, AuthProvider's onAuthStateChange picks it up, and
 * (auth)/_layout.tsx's guard redirects — no manual navigation needed. */
export function OtpVerification({ email, context, onSuccess, onBack }: OtpVerificationProps) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Only the interval is started here, not startCooldown() — that also does
  // setCooldown(RESEND_COOLDOWN), which is a redundant synchronous setState
  // on mount (useState already initialized it to exactly that) and is what
  // the React Compiler flagged. Resends still call startCooldown(), where
  // the reset genuinely is needed.
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length > 1) {
      const digits = digitsOnly.slice(0, OTP_LENGTH - index).split('');
      setOtp((prev) => {
        const next = [...prev];
        digits.forEach((d, i) => {
          if (index + i < OTP_LENGTH) next[index + i] = d;
        });
        return next;
      });
      inputRefs.current[Math.min(index + digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digitsOnly;
      return next;
    });
    if (digitsOnly && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length !== OTP_LENGTH) {
      setError(`Please enter the complete ${OTP_LENGTH}-digit code.`);
      return;
    }
    setVerifying(true);
    setError('');
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    if (verifyError) {
      setError(verifyError.message);
      setVerifying(false);
    } else {
      onSuccess();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setResendSuccess(false);
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
    if (resendError) {
      setError(resendError.message);
    } else {
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setResendSuccess(true);
      startCooldown();
      setTimeout(() => setResendSuccess(false), 4000);
    }
  };

  const canResend = cooldown === 0;

  return (
    <AuthLayout>
      <Card>
        <CardContent className="gap-5">
          <AuthHeader
            title="Verify your email"
            description={`We've sent a verification code to ${email}. Enter it below to confirm your account.`}
          />

          {!!error && <AuthError message={error} />}

          {resendSuccess && (
            <View className="flex-row items-center gap-2 p-3 rounded-md border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle2 size={16} color="#34d399" />
              <Text className="flex-1 text-sm text-emerald-400">
                A new code has been sent to your email.
              </Text>
            </View>
          )}

          <View className="flex-row justify-center gap-2">
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                value={digit}
                onChangeText={(v) => handleChange(i, v)}
                onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                autoFocus={i === 0}
                className="w-9 h-12 rounded-md border border-input bg-transparent text-center text-lg font-bold text-foreground"
                style={{ includeFontPadding: false }}
              />
            ))}
          </View>

          <Button onPress={handleVerify} loading={verifying} disabled={otp.join('').length !== OTP_LENGTH}>
            Verify & Continue
          </Button>

          <View className="items-center gap-2">
            <Text variant="small">
              Didn&apos;t receive the code?{' '}
              {canResend ? (
                <Text className="text-primary font-medium" onPress={handleResend}>
                  Resend
                </Text>
              ) : (
                <Text className="text-muted-foreground/60">Resend in {cooldown}s</Text>
              )}
            </Text>
            <Pressable onPress={onBack} className="flex-row items-center gap-1">
              <ArrowLeft size={12} color="#71717a" />
              <Text variant="tiny">Back to {context}</Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
