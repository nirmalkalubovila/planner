import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Bug, HelpCircle, Lightbulb, MessageCircle, MessageSquarePlus, Send, Star } from 'lucide-react-native';
import { useSubmitFeedback } from '@llb/api';
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from '@llb/core';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

/** Port of apps/web/src/features/profile/feedback-section.tsx. The public
 * "showcase this on the landing page" consent flow (display name/position +
 * live preview card) is web-only for now — the landing page it feeds is
 * itself web-only per the plan's scope, so there's nothing on mobile for
 * that consent to serve yet. */

const CATEGORY_ICONS: Record<FeedbackCategory, React.ComponentType<{ size?: number; color?: string }>> = {
  'Bug Report': Bug,
  'Feature Request': Lightbulb,
  'About Legacy Life Builder': MessageCircle,
  Other: HelpCircle,
};

export const FeedbackSection: React.FC = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState<FeedbackCategory>('About Legacy Life Builder');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);

  const submitFeedback = useSubmitFeedback();

  const handleSubmit = async () => {
    if (!user || !subject.trim() || !message.trim()) return;
    await submitFeedback.mutateAsync({
      category,
      subject: subject.trim(),
      message: message.trim(),
      rating: category === 'About Legacy Life Builder' ? rating : undefined,
      author_name: null,
      author_position: null,
      consent_to_show: false,
    });
    setSubject('');
    setMessage('');
    setCategory('About Legacy Life Builder');
    setRating(5);
  };

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0 && !submitFeedback.isPending;

  return (
    <View className="bg-card border border-border rounded-2xl p-5 gap-5">
      <View className="flex-row items-center gap-2.5">
        <View className="h-8 w-8 rounded-lg bg-primary/10 items-center justify-center">
          <MessageSquarePlus size={16} color="#e4e4e7" />
        </View>
        <View>
          <Text className="text-base font-bold text-foreground">Send Feedback</Text>
          <Text variant="tiny">Report bugs, request features, or share your thoughts</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {FEEDBACK_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          const isSelected = category === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => {
                setCategory(cat);
                if (cat !== 'About Legacy Life Builder') setRating(5);
              }}
              className={cn(
                'flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border',
                isSelected ? 'bg-primary/15 border-primary/30' : 'bg-muted/50 border-transparent'
              )}
            >
              <Icon size={14} color={isSelected ? '#e4e4e7' : '#a1a1aa'} />
              <Text className={cn('text-xs font-semibold', isSelected ? 'text-primary' : 'text-muted-foreground')}>
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {category === 'About Legacy Life Builder' && (
        <View className="gap-2 p-3 bg-muted/30 rounded-xl border border-border/55">
          <Text variant="tiny" className="uppercase font-bold">
            Rate Legacy Life Builder
          </Text>
          <View className="flex-row items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} hitSlop={4}>
                <Star size={20} color={star <= rating ? '#fbbf24' : '#3f3f46'} fill={star <= rating ? '#fbbf24' : 'none'} />
              </Pressable>
            ))}
            <Text className="ml-2 text-xs font-bold text-muted-foreground">{rating} / 5</Text>
          </View>
        </View>
      )}

      <Input value={subject} onChangeText={setSubject} placeholder="Brief subject..." maxLength={120} />

      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Describe the issue or share your feedback..."
        placeholderTextColor="#71717a"
        multiline
        textAlignVertical="top"
        maxLength={2000}
        className="w-full min-h-[100px] rounded-xl border border-input bg-muted px-3 py-2.5 text-sm text-foreground"
        style={{ includeFontPadding: false }}
      />

      <View className="flex-row items-center justify-between">
        <Text variant="tiny">{message.length}/2000</Text>
        <Button onPress={handleSubmit} disabled={!canSubmit} loading={submitFeedback.isPending}>
          <View className="flex-row items-center gap-2">
            <Send size={14} color="#000000" />
            <Text className="text-primary-foreground font-semibold">Submit Feedback</Text>
          </View>
        </Button>
      </View>
    </View>
  );
};
