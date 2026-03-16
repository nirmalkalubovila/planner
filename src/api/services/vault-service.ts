import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUserId, getOptionalUserId } from '@/api/helpers/auth-helpers';
import { toast } from 'sonner';
import { VaultNote } from '@/types/vault';

const TABLE_NAME = 'vault_notes';
const QUERY_KEY = [TABLE_NAME];

function parseTags(content: string): string[] {
  const matches = content.match(/#[\w-]+/g) ?? [];
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
}

async function getNotes(): Promise<VaultNote[]> {
  const userId = await getOptionalUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('createdAt', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : (row.tags ? JSON.parse(row.tags as unknown as string) : []),
  }));
}

export function useNotes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getNotes,
    staleTime: 30 * 1000, // 30s for snappy feel
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const userId = await getCurrentUserId();
      const tags = parseTags(content);
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([{ user_id: userId, content, tags }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ...data, tags } as VaultNote;
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<VaultNote[]>(QUERY_KEY);
      const optimisticNote: VaultNote = {
        id: `temp-${Date.now()}`,
        content,
        tags: parseTags(content),
        is_pinned: false,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<VaultNote[]>(QUERY_KEY, (old = []) => [optimisticNote, ...old]);
      return { previous };
    },
    onError: (_err, _content, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
      toast.error('Failed to save note');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useTogglePinNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ is_pinned, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as VaultNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => toast.error('Failed to update note: ' + err.message),
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const userId = await getCurrentUserId();
      const tags = parseTags(content);
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ content, tags, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ...data, tags } as VaultNote;
    },
    onMutate: async ({ id, content }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<VaultNote[]>(QUERY_KEY);
      queryClient.setQueryData<VaultNote[]>(QUERY_KEY, (old = []) =>
        old.map((n) => (n.id === id ? { ...n, content, tags: parseTags(content), updatedAt: new Date().toISOString() } : n))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
      toast.error('Failed to save note');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getCurrentUserId();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id).eq('user_id', userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => toast.error('Failed to delete note: ' + err.message),
  });
}

export { parseTags };
