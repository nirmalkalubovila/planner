import React from 'react';
import { View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Text } from '@/components/ui/typography';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/lib/web-links';

/** Opens web's /privacy and /terms pages in an in-app browser sheet
 * (SFSafariViewController on iOS, Custom Tab on Android) — satisfies both
 * stores' "legal pages reachable in-app" requirement without a WebView
 * dependency or an authenticated route, so it also works pre-login. */
function openPrivacy() {
  WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
}

function openTerms() {
  WebBrowser.openBrowserAsync(TERMS_OF_SERVICE_URL);
}

/** Compact inline pair for auth screens (login/signup footer disclaimer). */
export function LegalLinksInline() {
  return (
    <Text variant="tiny" className="text-center text-muted-foreground">
      By continuing, you agree to our{' '}
      <Text variant="tiny" className="text-primary font-medium" onPress={openTerms}>
        Terms of Service
      </Text>{' '}
      and{' '}
      <Text variant="tiny" className="text-primary font-medium" onPress={openPrivacy}>
        Privacy Policy
      </Text>
      .
    </Text>
  );
}

/** Stacked row list for the Profile screen's settings surface. */
export function LegalLinksSection() {
  return (
    <View className="bg-card border border-border rounded-2xl p-5 gap-1">
      <Text className="text-base font-bold text-foreground mb-2">Legal</Text>
      <Text
        variant="small"
        className="py-2.5 border-b border-border text-foreground font-medium"
        onPress={openTerms}
      >
        Terms of Service
      </Text>
      <Text variant="small" className="py-2.5 text-foreground font-medium" onPress={openPrivacy}>
        Privacy Policy
      </Text>
    </View>
  );
}
