import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from '../supabase-client';
import { toast } from '@llb/core';

export interface McpConnectorStatus {
    hasToken: boolean;
    createdAt: string | null;
    lastUsedAt: string | null;
}

const NO_CONNECTOR: McpConnectorStatus = { hasToken: false, createdAt: null, lastUsedAt: null };

/** Whether this user has a connector link, and when an AI app last used it. */
export function useMcpConnectorStatus() {
    return useQuery({
        queryKey: ['mcp_connector'],
        queryFn: async (): Promise<McpConnectorStatus> => {
            const { data, error } = await supabase.rpc('get_mcp_connector_status').maybeSingle();
            if (error) throw new Error(error.message);
            if (!data) return NO_CONNECTOR;
            return {
                hasToken: !!data.has_token,
                createdAt: data.created_at,
                lastUsedAt: data.last_used_at,
            };
        },
        staleTime: 60 * 1000,
    });
}

function randomToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    // base64url: safe to sit in a URL path segment without escaping.
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(input: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Mints a connector token. The raw secret is generated here, in the browser,
 * and only its SHA-256 hash is ever sent to the server — so the database
 * holds nothing that can be replayed as a working link, and the raw value
 * exists only in this one response for the user to copy.
 */
export function useCreateMcpConnectorToken() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (): Promise<string> => {
            const rawToken = randomToken();
            const { error } = await supabase.rpc('save_mcp_connector_token', {
                p_token_hash: await sha256Hex(rawToken),
            });
            if (error) throw new Error(error.message);
            return rawToken;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mcp_connector'] });
        },
        onError: (err: Error) => {
            toast.error('Could not create connector link: ' + err.message);
        },
    });
}

/** Instantly invalidates the link wherever it has already been pasted. */
export function useRevokeMcpConnectorToken() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase.rpc('revoke_mcp_connector_token');
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            toast.success('Connector link revoked.');
            queryClient.invalidateQueries({ queryKey: ['mcp_connector'] });
        },
        onError: (err: Error) => {
            toast.error('Could not revoke link: ' + err.message);
        },
    });
}
