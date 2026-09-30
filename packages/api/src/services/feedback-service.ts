import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase-client';
import { getCurrentUserId } from '../helpers/auth-helpers';
import { toast, type FeedbackCategory } from '@llb/core';

const TABLE_NAME = 'feedbacks';

// ── User: submit feedback ──────────────────────────────────────────
export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      category: FeedbackCategory;
      subject: string;
      message: string;
      rating?: number;
      author_name?: string | null;
      author_position?: string | null;
      consent_to_show?: boolean;
      /** Profile photo the user agreed to show next to their review. */
      avatar_url?: string | null;
    }) => {
      const userId = await getCurrentUserId();

      const { error } = await supabase
        .from(TABLE_NAME)
        .insert({
          user_id: userId,
          category: data.category,
          subject: data.subject,
          message: data.message,
          rating: data.rating ?? 5,
          author_name: data.author_name || null,
          author_position: data.author_position || null,
          consent_to_show: data.consent_to_show ?? false,
          avatar_url: data.avatar_url || null,
        });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
      toast.success('Feedback submitted! Thank you for helping us improve.');
    },
    onError: (err) => {
      toast.error('Failed to submit feedback: ' + err.message);
    },
  });
}

// ── User: what they have already told us ───────────────────────────
export interface MyFeedbackStatus {
  hasFeedback: boolean;
  /** Their latest review is positive and they have not agreed to show it publicly yet. */
  canAskConsent: boolean;
}

export function useMyFeedbackStatus(enabled = true) {
  return useQuery({
    queryKey: [TABLE_NAME, 'mine'],
    enabled,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<MyFeedbackStatus> => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('rating, consent_to_show')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      const rows = data ?? [];
      const latestPositive = rows.find((r) => (r.rating ?? 5) >= 4);
      return {
        hasFeedback: rows.length > 0,
        canAskConsent: !!latestPositive && !rows.some((r) => r.consent_to_show),
      };
    },
  });
}

/** Agree to show their existing review on the landing page, with name, role and photo. */
export function useGrantFeedbackConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; position: string; avatarUrl?: string | null }) => {
      const { error } = await supabase.rpc('grant_feedback_consent', {
        p_name: data.name,
        p_position: data.position,
        p_avatar_url: data.avatarUrl ?? '',
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLE_NAME] });
      toast.success('Thank you. Your story is shared.');
    },
    onError: (err) => {
      toast.error('Could not save: ' + err.message);
    },
  });
}
