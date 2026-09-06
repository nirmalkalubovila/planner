import React, { useState } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import type { InsightCardData } from '@llb/core';
import { getInsightTheme } from './insight-themes';
import { InsightCard } from './insight-card';

interface StoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  cards: InsightCardData[];
  hashSeed: string;
}

/** Instagram-style story walk-through of the insight deck. Web's version
 * auto-advances on a timer with a progress bar; this one is tap-driven —
 * left half goes back, right half forward — because an auto-advancing
 * full-screen takeover is easy to lose your place in on a phone and there's
 * no hover to pause it. The segment bar at the top still shows position. */
export function StoryViewer({ isOpen, onClose, cards, hashSeed }: StoryViewerProps) {
  const [index, setIndex] = useState(0);
  const { width } = useWindowDimensions();

  if (!isOpen || cards.length === 0) return null;

  const safeIndex = Math.min(index, cards.length - 1);
  const card = cards[safeIndex];
  const theme = getInsightTheme(safeIndex, hashSeed);

  const goNext = () => {
    if (safeIndex >= cards.length - 1) {
      setIndex(0);
      onClose();
    } else {
      setIndex(safeIndex + 1);
    }
  };

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));

  return (
    <Modal visible={isOpen} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View className="flex-row gap-1 px-4 pt-2">
            {cards.map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: i <= safeIndex ? '#ffffff' : 'rgba(255,255,255,0.25)',
                }}
              />
            ))}
          </View>

          <View className="flex-row justify-end px-4 py-2">
            <Pressable
              onPress={onClose}
              hitSlop={12}
              className="h-9 w-9 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            >
              <X size={18} color="#ffffff" />
            </Pressable>
          </View>

          <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
            <InsightCard card={card} theme={theme} />

            {/* Tap zones sit above the card but below the close button. */}
            <View style={{ position: 'absolute', inset: 0, flexDirection: 'row' }} pointerEvents="box-none">
              <Pressable style={{ width: width * 0.3 }} onPress={goPrev} />
              <Pressable style={{ flex: 1 }} onPress={goNext} />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
