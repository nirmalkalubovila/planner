import { useMutation, useQueryClient } from '@tanstack/react-query';
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
