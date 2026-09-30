import React, { useEffect, useState } from 'react';
import { Pressable, Switch, TextInput, View } from 'react-native';
import { MessageSquarePlus, Send, Star } from 'lucide-react-native';
import { useSubmitFeedback, useUserProfile } from '@llb/api';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/typography';

/** Port of apps/web/src/components/common/feedback-form.tsx: one review form about the system
 * (rating, headline, message) with optional consent + public name/role for the landing page. */
export const FeedbackSection: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile(user);
  const submitFeedback = useSubmitFeedback();

  const [rating, setRating] = useState(5);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorPosition, setAuthorPosition] = useState('');

  useEffect(() => {
    if (profile) {
      setAuthorName(profile.fullName || '');
      setAuthorPosition(profile.currentProfession || '');
    }
  }, [profile?.fullName, profile?.currentProfession]);

  const handleSubmit = async () => {
    if (!user || !subject.trim() || !message.trim()) return;
    await submitFeedback.mutateAsync({
      category: 'About Legacy Life Builder',
      subject: subject.trim(),
      message: message.trim(),
      rating,
      author_name: consent ? authorName.trim() : null,
      author_position: consent ? authorPosition.trim() : null,
      consent_to_show: consent,
    });
    setSubject('');
    setMessage('');
    setRating(5);
    setConsent(false);
  };

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0 && !submitFeedback.isPending;

  return (
    <View className="bg-card border border-border rounded-2xl p-5 gap-5">
      <View className="flex-row items-center gap-2.5">
        <View className="h-8 w-8 rounded-lg bg-primary/10 items-center justify-center">
          <MessageSquarePlus size={16} color="#e4e4e7" />
        </View>
        <View>
          <Text className="text-base font-bold text-foreground">Share Your Feedback</Text>
          <Text variant="tiny">Tell us what you think about Legacy Life Builder</Text>
        </View>
      </View>

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

      <Input value={subject} onChangeText={setSubject} placeholder="A short headline for your review..." maxLength={120} />

      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="What do you think about the system? What helps, what is missing?"
        placeholderTextColor="#71717a"
        multiline
        textAlignVertical="top"
        maxLength={2000}
        className="w-full min-h-[100px] rounded-xl border border-input bg-muted px-3 py-2.5 text-sm text-foreground"
        style={{ includeFontPadding: false }}
      />

      <View className="gap-3 bg-muted/25 border border-border/60 rounded-xl p-4">
        <View className="flex-row items-start gap-3">
          <Switch value={consent} onValueChange={setConsent} />
          <View className="flex-1 gap-1">
            <Text className="text-xs font-semibold text-foreground">Allow showcasing this review on the landing page</Text>
            <Text variant="tiny">If enabled, your review may be featured publicly with the name and role below.</Text>
          </View>
        </View>
        {consent && (
          <View className="gap-2 pt-2 border-t border-border/40">
            <Input value={authorName} onChangeText={setAuthorName} placeholder="Display name (e.g. David K.)" maxLength={50} />
            <Input value={authorPosition} onChangeText={setAuthorPosition} placeholder="Display role (e.g. Founder)" maxLength={60} />
          </View>
        )}
      </View>

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
