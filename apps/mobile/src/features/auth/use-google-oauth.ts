import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@llb/api';

// Matches apps/mobile/src/lib/supabase.ts's flowType:'pkce' setup and the
// (auth)/callback screen it anticipates. Registered as a literal redirect
// URL in Supabase's dashboard (Authentication -> URL Configuration) — that
// step can only be done there, not from this repo.
const REDIRECT_URL = 'legacylifebuilder://callback';

function extractParam(url: string, key: string): string | null {
  const match = url.match(new RegExp(`[?&#]${key}=([^&]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Native's Google sign-in round trip (the plan's documented shape):
 * signInWithOAuth({ skipBrowserRedirect: true }) to get the provider URL
 * without web's implicit browser navigation, WebBrowser.openAuthSessionAsync
 * to run the actual Google consent screen and catch the app's own
 * `legacylifebuilder://` scheme when Google redirects back, then
 * exchangeCodeForSession to turn the PKCE code into a real session — after
 * which AuthProvider's onAuthStateChange listener picks it up like any
 * other sign-in, no manual navigation needed. */
export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: REDIRECT_URL, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Google did not return a sign-in URL.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URL);
  if (result.type !== 'success' || !result.url) {
    if (result.type === 'cancel' || result.type === 'dismiss') return; // user backed out — not an error
    throw new Error('Google sign-in did not complete.');
  }

  const code = extractParam(result.url, 'code');
  if (!code) {
    const errorDescription = extractParam(result.url, 'error_description');
    throw new Error(errorDescription || 'Google sign-in did not return an authorization code.');
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}
