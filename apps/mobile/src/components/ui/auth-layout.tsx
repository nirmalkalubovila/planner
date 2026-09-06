import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/cn';
import { Text, Heading } from './typography';

/* ─── Auth screen wrapper: mirrors apps/web/src/components/ui/auth-layout.tsx
   (login/signup/forgot/reset/personalize all sit inside this). Footer legal
   links are deferred — the (public) WebView screens they point to aren't
   built yet (Phase 6 is component library, not the legal-pages phase). ─── */

interface AuthLayoutProps extends ViewProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, className, ...props }) => (
  <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
    <View className={cn('flex-1 justify-center px-4 py-8', className)} {...props}>
      {children}
    </View>
  </SafeAreaView>
);

/* ─── Auth header: logo + title + description ─── */

interface AuthHeaderProps {
  title: string;
  description?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, description }) => (
  <View className="items-center mb-4 gap-1">
    <Image
      source={require('../../../assets/images/llb-logo-white.png')}
      style={{ width: 40, height: 40, marginBottom: 12 }}
      contentFit="contain"
    />
    <Heading level="h2" className="text-center">
      {title}
    </Heading>
    {description && (
      <Text variant="muted" className="text-center leading-relaxed">
        {description}
      </Text>
    )}
  </View>
);

/* ─── Auth divider: "Or continue with" line ─── */

export const AuthDivider: React.FC<{ text?: string }> = ({ text = 'Or continue with' }) => (
  <View className="flex-row items-center gap-3">
    <View className="flex-1 h-px bg-border" />
    <Text variant="tiny" className="uppercase">
      {text}
    </Text>
    <View className="flex-1 h-px bg-border" />
  </View>
);

/* ─── Auth error banner ─── */

export const AuthError: React.FC<{ message: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <View className="p-3 rounded-md bg-destructive/10">
      <Text className="text-sm text-destructive">{message}</Text>
    </View>
  );
};
