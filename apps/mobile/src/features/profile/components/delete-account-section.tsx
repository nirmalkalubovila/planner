import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { supabase } from '@llb/api';
import { toast } from '@llb/core';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { useAuth } from '@/contexts/auth-context';

/** App Store Guideline 5.1.1(v): any app that supports account creation
 * must let the user delete their account from within the app. Calls the
 * `delete-account` edge function (service-role deletes app-data rows +
 * the auth user), then reuses the existing signOut() to clear local
 * session/query-cache/offline-persistence state. */
export function DeleteAccountSection() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await signOut();
      router.replace('/login');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View className="bg-card border border-destructive/30 rounded-2xl p-5 gap-3">
      <View className="flex-row items-center gap-2">
        <Trash2 size={14} color="#ef4444" />
        <Text className="text-base font-bold text-destructive">Delete Account</Text>
      </View>
      <Text variant="small" className="text-muted-foreground">
        Permanently deletes your account and all associated data — goals, habits, planner history,
        and vault notes. This cannot be undone.
      </Text>
      <Button
        variant="destructive"
        onPress={() => setIsDialogOpen(true)}
        loading={isDeleting}
      >
        Delete My Account
      </Button>

      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        variant="destructive"
        title="Delete your account?"
        description="This permanently deletes your account and all of your data. This action cannot be undone."
        confirmText="Delete Permanently"
        cancelText="Cancel"
      />
    </View>
  );
}
