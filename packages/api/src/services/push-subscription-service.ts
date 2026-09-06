import { useMutation } from '@tanstack/react-query';
import { supabase } from '../supabase-client';
import { getCurrentUserId } from '../helpers/auth-helpers';

const TABLE_NAME = 'push_subscriptions';

interface UpsertExpoPushSubscriptionInput {
    expoPushToken: string;
    platform: 'ios' | 'android';
    deviceId?: string;
    timezone?: string;
}

/** Native counterpart to web's direct `subscribeToPush()` calls in
 * apps/web/src/lib/notification-service.ts. Deliberately a separate
 * function rather than a shared one: web's upsert targets the
 * `(user_id, endpoint)` constraint and must stay byte-identical, while
 * this targets the new `(user_id, expo_push_token)` constraint added in
 * the 20260826080000 migration — the two can never collide. */
export function useUpsertExpoPushSubscription() {
    return useMutation({
        mutationFn: async (input: UpsertExpoPushSubscriptionInput) => {
            const userId = await getCurrentUserId();
            const { error } = await supabase
                .from(TABLE_NAME)
                .upsert(
                    {
                        user_id: userId,
                        platform: input.platform,
                        expo_push_token: input.expoPushToken,
                        device_id: input.deviceId,
                        timezone: input.timezone,
                        last_seen_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id,expo_push_token' }
                );
            if (error) throw new Error(error.message);
        },
    });
}

/** Called on sign-out so a shared/reset device stops receiving pushes
 * meant for the previous account. */
export function useRemoveExpoPushSubscription() {
    return useMutation({
        mutationFn: async (expoPushToken: string) => {
            const { error } = await supabase
                .from(TABLE_NAME)
                .delete()
                .eq('expo_push_token', expoPushToken);
            if (error) throw new Error(error.message);
        },
    });
}
