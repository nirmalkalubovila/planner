import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@llb/api';

/** Native Apple credential flow (not a browser redirect like Google's PKCE
 * round trip in use-google-oauth.ts) — expo-apple-authentication's
 * signInAsync() returns an identityToken directly from the OS, which
 * Supabase exchanges for a session via signInWithIdToken. iOS-only: Sign in
 * with Apple has no equivalent on Android, and App Store Guideline 4.8 only
 * requires it where Google/other social sign-in is offered on iOS.
 *
 * Requires (outside this repo, cannot be done from code): an Apple Developer
 * Program membership, "Sign In with Apple" capability enabled for the App
 * ID in App Store Connect, and Apple configured as an OAuth provider in the
 * Supabase Auth dashboard. */
export async function signInWithApple(): Promise<void> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple sign-in did not return an identity token.');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;
}

/** ERR_REQUEST_CANCELED is expo-apple-authentication's error code for the
 * user backing out of the native sheet — not a real failure, same treatment
 * as Google's 'cancel'/'dismiss' WebBrowser result in use-google-oauth.ts. */
export function isAppleSignInCancellation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'ERR_REQUEST_CANCELED';
}
