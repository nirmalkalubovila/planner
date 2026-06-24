import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export interface GlobalSmtpSettings {
  enabled: boolean;
  senderEmail: string;
  senderName: string;
  host: string;
  port: number;
  minInterval: number;
  username: string;
  hasPassword?: boolean;
}

export interface GlobalEmailTemplate {
  type: string;
  enabled: boolean;
  subject: string;
  body: string;
}

const SMTP_QUERY_KEY = ["global_smtp_settings"];
const TEMPLATE_QUERY_KEY = ["global_email_templates"];

/** Fetch global SMTP settings using safe RPC */
async function fetchGlobalSmtpSettings(): Promise<GlobalSmtpSettings | null> {
  const { data, error } = await supabase.rpc("get_global_smtp_settings");
  
  if (error) {
    // If it's a "no rows" error or similar, return a blank config
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  if (!data || data.length === 0) return null;
  const row = data[0];

  return {
    enabled: row.enabled,
    senderEmail: row.sender_email,
    senderName: row.sender_name,
    host: row.host,
    port: row.port,
    minInterval: row.min_interval,
    username: row.username,
    hasPassword: row.has_password,
  };
}

/** Hook to manage global SMTP settings */
export function useGlobalSmtpSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SMTP_QUERY_KEY,
    queryFn: fetchGlobalSmtpSettings,
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      settings,
      password,
    }: {
      settings: Omit<GlobalSmtpSettings, "hasPassword">;
      password?: string;
    }) => {
      // Use the anon key as encryption key for pgcrypto
      const encryptionKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const { error } = await supabase.rpc("save_global_smtp_settings", {
        p_enabled: settings.enabled,
        p_sender_email: settings.senderEmail,
        p_sender_name: settings.senderName,
        p_host: settings.host,
        p_port: settings.port,
        p_min_interval: settings.minInterval,
        p_username: settings.username,
        p_password: password || null,
        p_encryption_key: encryptionKey,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SMTP_QUERY_KEY });
      toast.success("SMTP settings saved successfully!");
    },
    onError: (err) => {
      toast.error("Failed to save SMTP settings: " + err.message);
    },
  });

  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    saveSettings: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}

/** Fetch global email templates */
async function fetchGlobalEmailTemplates(): Promise<GlobalEmailTemplate[]> {
  const { data, error } = await supabase
    .from("global_email_templates")
    .select("*");

  if (error) throw new Error(error.message);
  return (data || []).map((t) => ({
    type: t.type,
    enabled: t.enabled,
    subject: t.subject,
    body: t.body,
  }));
}

/** Hook to manage global email templates */
export function useGlobalEmailTemplates() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: TEMPLATE_QUERY_KEY,
    queryFn: fetchGlobalEmailTemplates,
  });

  const saveMutation = useMutation({
    mutationFn: async (template: GlobalEmailTemplate) => {
      const { error } = await supabase
        .from("global_email_templates")
        .upsert({
          type: template.type,
          enabled: template.enabled,
          subject: template.subject,
          body: template.body,
          updated_at: new Date().toISOString(),
        });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEY });
      toast.success("Template saved successfully!");
    },
    onError: (err) => {
      toast.error("Failed to save template: " + err.message);
    },
  });

  return {
    templates: query.data ?? [],
    isLoading: query.isLoading,
    saveTemplate: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
