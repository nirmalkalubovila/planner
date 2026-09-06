import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { kv } from '@llb/core';
import { StandardDialog } from './standard-dialog';
import { Text } from '@/components/ui/typography';

const STATUS_MESSAGES = [
  'Reading your goal parameters...',
  'Analyzing your career profile...',
  'Mapping peak energy hours...',
  'Cross-referencing existing habits...',
  'Calculating optimal task splits...',
  'Building milestone sequences...',
  'Optimizing for your focus patterns...',
  'Finalizing your action roadmap...',
];

const STORAGE_KEY = 'legacy_ai_gen_times';

function getAvgTime(): number | null {
  try {
    const raw = kv.persistent.getItem(STORAGE_KEY);
    if (!raw) return null;
    const times: number[] = JSON.parse(raw);
    if (!times.length) return null;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  } catch {
    return null;
  }
}

export function recordGenTime(ms: number) {
  try {
    const raw = kv.persistent.getItem(STORAGE_KEY);
    const times: number[] = raw ? JSON.parse(raw) : [];
    times.push(ms);
    if (times.length > 20) times.shift();
    kv.persistent.setItem(STORAGE_KEY, JSON.stringify(times));
  } catch {
    /* ignore */
  }
}

interface AILoadingPopupProps {
  isOpen: boolean;
  onClose?: () => void;
}

/** Port of apps/web/src/components/common/ai-loading-popup.tsx — same
 * rotating status copy and "taking longer than expected" heuristic, MMKV
 * (via @llb/core's kv port) standing in for localStorage. */
export const AILoadingPopup: React.FC<AILoadingPopupProps> = (props) => (
  // Re-keyed on open so a fresh run starts from message 0, "not slow", and
  // a new start timestamp — previously an effect reset all four on open.
  <AILoadingPopupBody key={props.isOpen ? 'open' : 'closed'} {...props} />
);

const AILoadingPopupBody: React.FC<AILoadingPopupProps> = ({ isOpen, onClose }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [slow, setSlow] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [avgTime] = useState(() => getAvgTime());

  useEffect(() => {
    if (!isOpen) return;
    const msgInterval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2200);
    const tickInterval = setInterval(() => {
      const secs = Math.floor((Date.now() - startedAt) / 1000);
      const threshold = avgTime ? Math.round(avgTime / 1000) + 10 : 45;
      if (secs > threshold) setSlow(true);
    }, 1000);
    return () => {
      clearInterval(msgInterval);
      clearInterval(tickInterval);
    };
  }, [isOpen, startedAt, avgTime]);

  return (
    <StandardDialog
      isOpen={isOpen}
      onClose={onClose || (() => {})}
      title="Legacy Planner"
      hideClose={!onClose}
      closeOnBackdrop={false}
    >
      <View className="px-6 py-8 items-center gap-5">
        <Image source={require('../../../assets/images/ai-animation-white.gif')} style={{ width: 64, height: 64 }} contentFit="contain" />

        <View className="items-center gap-1.5">
          <Text className="text-sm font-semibold text-muted-foreground text-center">
            {slow ? 'Taking longer than expected...' : STATUS_MESSAGES[msgIdx]}
          </Text>
          {slow && (
            <Text variant="tiny" className="text-amber-400/80">
              Please check your internet connection
            </Text>
          )}
        </View>

        <View className="w-full bg-muted rounded-full h-1 overflow-hidden">
          <View className="h-full bg-primary/60 rounded-full w-1/2" />
        </View>
      </View>
    </StandardDialog>
  );
};
