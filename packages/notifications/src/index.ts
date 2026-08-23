// @llb/notifications — the in-app notification store and the pure
// delivery-gate rules (enabled → per-type pref → permission → quiet hours
// → rate limit), shared between web and the future React Native app. The
// actual delivery transport (Web Notification API + Service Worker on web,
// expo-notifications on native) stays app-local.

export * from './store';
export * from './delivery-gate';
