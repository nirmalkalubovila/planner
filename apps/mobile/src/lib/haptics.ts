import { Platform, Vibration } from 'react-native';

/** Tactile feedback for direct-manipulation gestures — the lift/snap/drop
 * ticks that make dragging a calendar block feel physical rather than
 * abstract (Google Calendar's drag is the reference).
 *
 * Built on React Native's core `Vibration` rather than `expo-haptics`
 * deliberately: expo-haptics is a native module, so adding it would force
 * a new dev-client build before anything works on device, whereas
 * `Vibration` is already linked and `android.permission.VIBRATE` is
 * already in the manifest — this works on the build you have installed.
 *
 * The tradeoff is iOS. There, `Vibration.vibrate()` ignores the duration
 * and fires one long system buzz, which feels worse than no haptic at all,
 * so iOS is a no-op for now. Proper iOS haptics (and richer Android
 * effects) mean adding `expo-haptics` and rebuilding — at which point only
 * the four functions below change, not their call sites. */
const supported = Platform.OS === 'android';

/** Snap ticks fire whenever the drop target changes slot. On a fast drag
 * that can be many times a second, which turns a crisp tick into a
 * continuous buzz, so hold them to a floor. */
const SNAP_THROTTLE_MS = 45;
let lastSnapAt = 0;

export const haptics = {
  /** A block has been picked up and is now following the finger. */
  lift() {
    if (supported) Vibration.vibrate(20);
  },

  /** The held block snapped to a different slot. */
  snap() {
    if (!supported) return;
    const now = Date.now();
    if (now - lastSnapAt < SNAP_THROTTLE_MS) return;
    lastSnapAt = now;
    Vibration.vibrate(10);
  },

  /** The block landed successfully. */
  drop() {
    if (supported) Vibration.vibrate(15);
  },

  /** The block could not go there. A double pulse reads as "no" in a way a
   * single tick doesn't. */
  reject() {
    if (supported) Vibration.vibrate([0, 25, 70, 25]);
  },
};
