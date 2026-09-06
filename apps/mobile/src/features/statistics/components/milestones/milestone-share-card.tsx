import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/typography';
import type { MilestoneStage } from '@/lib/milestone-celebration';

interface MilestoneShareCardProps {
  stage: MilestoneStage;
  totalDaysExecuted: number;
  currentStreak: number;
}

const CARD_WIDTH = 360;
const CARD_HEIGHT = 640;
const DISC_SIZE = 180;

// Android's default includeFontPadding adds extra ascent/descent space
// around glyphs — harmless on normal body text, but on the big bold streak
// number inside a tightly-sized circle it was pushing the digits enough to
// read as "cropped" against the disc's border. Same fix as the OTP boxes
// and text inputs elsewhere in this app.
const noFontPadding = { includeFontPadding: false } as const;

function StatBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View className="flex-1 rounded-xl p-3 gap-1" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }}>
      <Text style={{ color: '#f59e0b', fontSize: 8, fontWeight: '900', letterSpacing: 1, ...noFontPadding }}>{label}</Text>
      <Text className="text-white font-black" style={{ fontSize: 15, ...noFontPadding }}>
        {value}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '700', ...noFontPadding }}>{sub}</Text>
    </View>
  );
}

/** A pure RN component tree standing in for
 * apps/web/.../insights/share-card-renderer.tsx's Canvas 2D
 * `renderMilestoneShareCard` — same content and composition, rebuilt as
 * real Views/Text instead of hand-translating ~500 lines of canvas ctx
 * calls, per the plan's own recommendation (view-shot + component tree is
 * "far less code" than a Skia port and gives pixel-perfect text for free).
 * Rendered off-screen and captured with react-native-view-shot. */
export const MilestoneShareCard = forwardRef<View, MilestoneShareCardProps>(({ stage, totalDaysExecuted, currentStreak }, ref) => {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: '#07090f',
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 10,
      }}
    >
      <View className="items-center gap-2">
        <Image source={require('../../../../../assets/images/llb-logo-white.png')} style={{ width: 30, height: 30 }} contentFit="contain" />
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: '900', letterSpacing: 3, ...noFontPadding }}>LEGACY LIFE BUILDER</Text>
        <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)' }}>
          <Text style={{ color: '#f59e0b', fontSize: 8, fontWeight: '900', letterSpacing: 1.5, ...noFontPadding }}>
            PROOF OF CONSISTENCY • STAGE 0{stage.stageNumber}
          </Text>
        </View>
      </View>

      <View className="items-center mt-6">
        <View
          className="items-center justify-center rounded-full"
          style={{ width: DISC_SIZE, height: DISC_SIZE, backgroundColor: '#12100a', borderWidth: 2, borderColor: 'rgba(245,158,11,0.6)' }}
        >
          <Text style={{ color: '#f59e0b', fontSize: 9, fontWeight: '900', letterSpacing: 2, ...noFontPadding }}>CONSISTENCY STREAK</Text>
          <Text
            className="text-white"
            style={{ fontSize: 48, fontWeight: '800', lineHeight: 56, marginVertical: 2, ...noFontPadding }}
          >
            {stage.days}
          </Text>
          <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: '900', letterSpacing: 3, ...noFontPadding }}>DAYS UNBROKEN</Text>
        </View>

        <Text className="text-white font-black text-center mt-4" style={{ fontSize: 20, letterSpacing: 0.5, ...noFontPadding }}>
          {stage.title.toUpperCase()}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', ...noFontPadding }} className="mt-1">
          {stage.subtitle}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2 mt-5">
        <StatBox label="ACTIVE STREAK" value={`${currentStreak} Days`} sub="Unbroken Focus" />
        <StatBox label="TOTAL EXECUTED" value={`${totalDaysExecuted} Days`} sub="Lifetime Output" />
        <StatBox label="MASTERY TIER" value={`Stage ${stage.stageNumber} / 7`} sub="Pinnacle Rank" />
        <StatBox label="GLOBAL STANDING" value="Top 2%" sub="Verified Discipline" />
      </View>

      <View
        className="mt-5 rounded-xl p-3 items-center"
        style={{ backgroundColor: 'rgba(245,158,11,0.04)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', fontWeight: '700', fontSize: 12, textAlign: 'center', ...noFontPadding }}>
          &quot;{stage.description}&quot;
        </Text>
        <Text style={{ color: 'rgba(245,158,11,0.75)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, ...noFontPadding }} className="mt-2">
          — LEGACY LIFE BUILDER CREED
        </Text>
      </View>

      <View className="items-center mt-auto pt-4" style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, ...noFontPadding }}>
          VERIFIED ON LEGACY LIFE BUILDER
        </Text>
        <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: '900', letterSpacing: 3, ...noFontPadding }} className="mt-1">
          WWW.LEGACYLIFEBUILDER.XYZ
        </Text>
      </View>
    </View>
  );
});
MilestoneShareCard.displayName = 'MilestoneShareCard';
