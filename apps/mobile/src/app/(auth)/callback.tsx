import { PageLoader } from '@/components/common/page-loader';

/** Landing pad for legacylifebuilder://callback. The actual PKCE code
 * exchange happens inline in use-google-oauth.ts's WebBrowser promise
 * handler — but the OS may *also* deliver this deep link as a normal
 * navigation event (Expo Router needs a matching route to avoid an
 * "Unmatched Route" flash in that case). Once the session lands,
 * (auth)/_layout.tsx's guard redirects away from here on its own. */
export default function AuthCallbackScreen() {
  return <PageLoader />;
}
