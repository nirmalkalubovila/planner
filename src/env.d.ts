/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Supabase project URL (required) */
    readonly VITE_SUPABASE_URL: string
    /** Supabase anon/public key (required) */
    readonly VITE_SUPABASE_ANON_KEY: string
    /** OpenRouter API key (optional - preferred for goal plan generation) */
    readonly VITE_OPENROUTER_API_KEY?: string
    /** Fallback API key - Gemini or OpenRouter (optional) */
    readonly VITE_GEMINI_API_KEY?: string
    /** AI API base URL (optional - defaults to OpenRouter) */
    readonly VITE_AI_API_URL?: string
    /** AI model identifier (optional) */
    readonly VITE_AI_MODEL?: string
    /** AI backup model when primary fails (optional) */
    readonly VITE_AI_BACKUP_MODEL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
