import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUserId, getOptionalUserId } from '@/api/helpers/auth-helpers';
import { toast } from 'sonner';
import { VaultNote, VaultCategory } from '@/types/vault';

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
    title: row.title || '',
    category: row.category || 'ideas',
    is_draft: false,
    tags: Array.isArray(row.tags) ? row.tags : (row.tags ? JSON.parse(row.tags as unknown as string) : []),
  }));
}

export function useNotes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getNotes,
    staleTime: 30 * 1000,
  });
}

interface CreateNoteInput {
  title: string;
  content: string;
  category: VaultCategory;
}

export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      const userId = await getCurrentUserId();
      const tags = parseTags(input.content);
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([{
          user_id: userId,
          title: input.title,
          content: input.content,
          category: input.category,
          tags,
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ...data, tags, is_draft: false } as VaultNote;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<VaultNote[]>(QUERY_KEY);
      const optimisticNote: VaultNote = {
        id: `temp-${Date.now()}`,
        title: input.title,
        content: input.content,
        category: input.category,
        tags: parseTags(input.content),
        is_pinned: false,
        is_draft: false,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<VaultNote[]>(QUERY_KEY, (old = []) => [optimisticNote, ...old]);
      return { previous };
    },
    onError: (_err, _input, context) => {
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
    onMutate: async ({ id, is_pinned }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<VaultNote[]>(QUERY_KEY);
      queryClient.setQueryData<VaultNote[]>(QUERY_KEY, (old = []) =>
        old.map((n) => (n.id === id ? { ...n, is_pinned } : n))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
      toast.error('Failed to pin note');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

interface UpdateNoteInput {
  id: string;
  title?: string;
  content?: string;
  category?: VaultCategory;
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, content, category }: UpdateNoteInput) => {
      const userId = await getCurrentUserId();
      const updatePayload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (title !== undefined) updatePayload.title = title;
      if (content !== undefined) {
        updatePayload.content = content;
        updatePayload.tags = parseTags(content);
      }
      if (category !== undefined) updatePayload.category = category;

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ...data, tags: updatePayload.tags ?? data.tags } as VaultNote;
    },
    onMutate: async ({ id, title, content, category }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<VaultNote[]>(QUERY_KEY);
      queryClient.setQueryData<VaultNote[]>(QUERY_KEY, (old = []) =>
        old.map((n) => {
          if (n.id !== id) return n;
          return {
            ...n,
            ...(title !== undefined && { title }),
            ...(content !== undefined && { content, tags: parseTags(content) }),
            ...(category !== undefined && { category }),
            updatedAt: new Date().toISOString(),
          };
        })
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
