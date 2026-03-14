import { supabase } from '@/lib/supabaseClient';

export async function getCurrentUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) throw new Error('Not authenticated');
    return session.user.id;
}

export async function getOptionalUserId(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
}
