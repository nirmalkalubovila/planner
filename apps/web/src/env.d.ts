/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Supabase project URL (required) */
    readonly VITE_SUPABASE_URL: string
    /** Supabase anon/public key (required) */
    readonly VITE_SUPABASE_ANON_KEY: string
    /** Google Search Console verification token (optional) */
    readonly VITE_GOOGLE_SITE_VERIFICATION?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
