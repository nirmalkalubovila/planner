import { createClient } from "@supabase/supabase-js";
import type { Database } from '@llb/core';
import { initSupabase, supabase } from '@llb/api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

initSupabase(createClient<Database>(supabaseUrl, supabaseKey));

// Re-exported at the same path so the ~20 non-service call sites across the
// app that import `supabase` directly (auth-context, App.tsx, forms, ...)
// don't need to change. New code should import from '@llb/api' directly.
export { supabase };
