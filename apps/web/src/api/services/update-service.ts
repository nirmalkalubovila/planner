import { supabase } from "@/lib/supabaseClient";

export interface AppUpdate {
    id: string;
    version: string;
    title: string;
    description: string;
    release_date: string;
}

export const AppUpdateService = {
    getLatestUpdate: async (): Promise<AppUpdate | null> => {
        try {
            const { data, error } = await supabase
                .from("app_updates")
                .select("*")
                .order("release_date", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                // If table doesn't exist yet, fail silently to prevent app crash
                console.warn("Could not fetch app updates (table may not exist):", error.message);
                return null;
            }
            return data as AppUpdate | null;
        } catch (e) {
            console.warn("Error fetching app updates:", e);
            return null;
        }
    },

    getAllUpdates: async (): Promise<AppUpdate[]> => {
        try {
            const { data, error } = await supabase
                .from("app_updates")
                .select("*")
                .order("release_date", { ascending: false });

            if (error) {
                console.warn("Could not fetch app updates:", error.message);
                return [];
            }
            return (data ?? []) as AppUpdate[];
        } catch (e) {
            console.warn("Error fetching app updates:", e);
            return [];
        }
    },

    createUpdate: async (version: string, title: string, description: string): Promise<AppUpdate> => {
        const { data, error } = await supabase
            .from("app_updates")
            .insert({ version, title, description })
            .select("*")
            .single();

        if (error) throw new Error(error.message);
        return data as AppUpdate;
    },

    deleteUpdate: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from("app_updates")
            .delete()
            .eq("id", id);

        if (error) throw new Error(error.message);
    }
};
