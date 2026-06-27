import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUserId, getOptionalUserId } from '@/api/helpers/auth-helpers';
import { toast } from 'sonner';

export interface VaultReminder {
  id: string;
  user_id: string;
  note_id: string;
  title: string;
  body?: string;
  repeat_type: 'daily' | 'every_2_days' | 'weekly' | 'random' | 'once';
  remind_at?: string | null; // e.g. "14:15"
  next_fire: string; // ISO string
  is_active: boolean;
  snooze_count: number;
  created_at: string;
}

const TABLE_NAME = 'vault_reminders';
const QUERY_KEY = [TABLE_NAME];

export function calculateNextFire(repeatType: string, remindAt?: string | null): Date {
  const now = new Date();
  const next = new Date();

  if (repeatType === 'random') {
    // Random hour between 9:00 AM and 9:00 PM tomorrow
    // Tomorrow:
    next.setDate(next.getDate() + 1);
    const startHour = 9;
    const endHour = 21;
    const randomHour = startHour + Math.floor(Math.random() * (endHour - startHour));
    const randomMinute = Math.floor(Math.random() * 60);
    next.setHours(randomHour, randomMinute, 0, 0);
    return next;
  }

  if (repeatType === 'once') {
    // Default once fire in 1 hour if not specified
    next.setHours(next.getHours() + 1);
    return next;
  }

  if (remindAt) {
    const [h, m] = remindAt.split(':').map(Number);
    next.setHours(h, m, 0, 0);
    if (next.getTime() <= now.getTime()) {
      if (repeatType === 'daily') {
        next.setDate(next.getDate() + 1);
      } else if (repeatType === 'every_2_days') {
        next.setDate(next.getDate() + 2);
      } else if (repeatType === 'weekly') {
        next.setDate(next.getDate() + 7);
      }
    }
  } else {
    // If not specified, set to tomorrow at 9:00 AM
    next.setDate(next.getDate() + 1);
    next.setHours(9, 0, 0, 0);
  }
  return next;
}

async function getReminders(): Promise<VaultReminder[]> {
  const userId = await getOptionalUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', userId)
    .order('next_fire', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useReminders() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getReminders,
    staleTime: 10 * 1000, // 10 seconds stale time
  });
}

interface CreateReminderInput {
  note_id: string;
  title: string;
  body?: string;
  repeat_type: 'daily' | 'every_2_days' | 'weekly' | 'random' | 'once';
  remind_at?: string | null;
  next_fire?: string;
}

export function useAddReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReminderInput) => {
      const userId = await getCurrentUserId();
      const nextFireDate = input.next_fire 
        ? new Date(input.next_fire)
        : calculateNextFire(input.repeat_type, input.remind_at);

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([{
          user_id: userId,
          note_id: input.note_id,
          title: input.title,
          body: input.body || '',
          repeat_type: input.repeat_type,
          remind_at: input.remind_at,
          next_fire: nextFireDate.toISOString(),
          is_active: true,
          snooze_count: 0,
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as VaultReminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['vault_notes'] });
    },
    onError: (err) => {
      toast.error('Failed to create reminder: ' + err.message);
    }
  });
}

interface UpdateReminderInput {
  id: string;
  title?: string;
  body?: string;
  repeat_type?: 'daily' | 'every_2_days' | 'weekly' | 'random' | 'once';
  remind_at?: string | null;
  next_fire?: string;
  is_active?: boolean;
  snooze_count?: number;
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateReminderInput) => {
      const userId = await getCurrentUserId();
      const { id, ...rest } = input;

      const payload: Record<string, any> = { ...rest };
      if (rest.next_fire !== undefined) {
        payload.next_fire = rest.next_fire;
        payload.snooze_count = 0; // reset snooze on modification
      } else if (rest.repeat_type !== undefined || rest.remind_at !== undefined) {
        const currentData = queryClient.getQueryData<VaultReminder[]>(QUERY_KEY)?.find(r => r.id === id);
        const rType = rest.repeat_type || currentData?.repeat_type || 'daily';
        const rAt = rest.remind_at !== undefined ? rest.remind_at : currentData?.remind_at;
        payload.next_fire = calculateNextFire(rType, rAt).toISOString();
        payload.snooze_count = 0; // reset snooze on modification
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as VaultReminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['vault_notes'] });
    },
    onError: (err) => {
      toast.error('Failed to update reminder: ' + err.message);
    }
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getCurrentUserId();
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['vault_notes'] });
    },
    onError: (err) => {
      toast.error('Failed to delete reminder: ' + err.message);
    }
  });
}

export function useSnoozeReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, minutes = 15 }: { id: string; minutes?: number }) => {
      const userId = await getCurrentUserId();
      const nextFireDate = new Date();
      nextFireDate.setMinutes(nextFireDate.getMinutes() + minutes);

      // We will perform a simple update by fetching the current snooze count first
      const currentData = queryClient.getQueryData<VaultReminder[]>(QUERY_KEY)?.find(r => r.id === id);
      const currentSnooze = currentData?.snooze_count ?? 0;

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
          next_fire: nextFireDate.toISOString(),
          snooze_count: currentSnooze + 1,
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as VaultReminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => {
      toast.error('Failed to snooze reminder: ' + err.message);
    }
  });
}
