import React from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Compass, UserCog } from 'lucide-react-native';
import { StandardDialog } from '@/components/common/standard-dialog';
import { Text } from '@/components/ui/typography';

interface MilestoneStrategyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'ai' | 'manual') => void;
}

export const MilestoneStrategyDialog: React.FC<MilestoneStrategyDialogProps> = ({ isOpen, onClose, onSelect }) => {
  return (
    <StandardDialog isOpen={isOpen} onClose={onClose} title="Build Your Roadmap" subtitle="Choose how to plan" icon={Compass}>
      <View className="p-5 gap-4">
        <Text variant="muted" className="text-center">
          How should we create your action plan?
        </Text>

        <View className="gap-3">
          <Pressable
            onPress={() => onSelect('ai')}
            className="items-center p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 gap-3"
          >
            <Image
              source={require('../../../../assets/images/ai-animation-white.gif')}
              style={{ width: 48, height: 48 }}
              contentFit="contain"
            />
            <View className="items-center">
              <Text className="text-base font-black text-foreground">Legacy Planner</Text>
              <Text variant="tiny" className="text-center mt-1">
                AI builds your milestones based on your profile & schedule.
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => onSelect('manual')}
            className="items-center p-6 rounded-2xl border-2 border-border bg-muted/30 gap-3"
          >
            <View className="p-3.5 bg-muted rounded-full">
              <UserCog size={28} color="#a1a1aa" />
            </View>
            <View className="items-center">
              <Text className="text-base font-black text-foreground">Manual Craft</Text>
              <Text variant="tiny" className="text-center mt-1">
                Define your own milestones and tasks step by step.
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </StandardDialog>
  );
};
