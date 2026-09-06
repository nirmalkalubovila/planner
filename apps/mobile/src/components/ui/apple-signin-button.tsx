import React from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '@/contexts/theme-context';

interface AppleSignInButtonProps {
  onPress: () => void;
  buttonType?: 'SIGN_IN' | 'CONTINUE' | 'SIGN_UP';
}

/** App Store Guideline 4.8: once Google Sign-In is offered, Apple requires
 * Sign in with Apple as an equal option — iOS only, so this renders nothing
 * on Android. Uses the native AppleAuthenticationButton rather than a
 * custom-styled Pressable, since Apple requires the official mark/wordmark
 * for this button. */
export function AppleSignInButton({ onPress, buttonType = 'SIGN_IN' }: AppleSignInButtonProps) {
  const { colorScheme } = useTheme();

  if (Platform.OS !== 'ios') return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType[buttonType]}
      buttonStyle={
        colorScheme === 'dark'
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={6}
      style={{ width: '100%', height: 40 }}
      onPress={onPress}
    />
  );
}
