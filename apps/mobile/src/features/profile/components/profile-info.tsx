import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { format } from 'date-fns';
import { Calendar, Camera, Check, Edit2, Mail, User as UserIcon, X } from 'lucide-react-native';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@llb/api';
import { toast } from '@llb/core';

import { Button } from '@/components/ui/button';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/typography';

interface ProfileInfoProps {
  user: User;
  profile?: { fullName?: string; dob?: string; avatarUrl?: string } | null;
  saveProfile?: (updates: any) => Promise<void>;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  loading: boolean;
  onSave: () => Promise<void>;
  fullName: string;
  setFullName: (val: string) => void;
  dob: string;
  setDob: (val: string) => void;
}

/** Port of apps/web/src/features/profile/components/profile-info.tsx. The
 * crop step is much simpler here: expo-image-picker's `allowsEditing` opens
 * the OS's own native crop UI, so there's no react-easy-crop / canvas math
 * to port at all — the picker hands back an already-cropped local file URI. */
export const ProfileInfo: React.FC<ProfileInfoProps> = ({
  user,
  profile,
  saveProfile,
  isEditing,
  setIsEditing,
  loading,
  onSave,
  fullName,
  setFullName,
  dob,
  setDob,
}) => {
  const displayName = profile?.fullName || (user.user_metadata?.full_name as string) || '';
  const initials = displayName ? displayName.substring(0, 2).toUpperCase() : user.email?.substring(0, 2).toUpperCase() || 'U';
  const avatarUrl = profile?.avatarUrl || (user.user_metadata?.avatar_url as string) || null;
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('Photo library access is needed to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      toast.error('Could not read the selected image.');
      return;
    }
    setUploading(true);
    try {
      // Reading via fetch(uri).arrayBuffer() is a known-flaky path on RN —
      // ImagePicker's own base64 output (decoded with a pure-JS decoder)
      // sidesteps that instead of guessing at the fetch/Blob quirk.
      const arrayBuffer = decode(asset.base64);
      const path = `${user.id}/avatar.jpg`;

      // upsert:true re-uploading an EXISTING path goes through Storage's
      // UPDATE RLS check, not INSERT — and this bucket's policies look to
      // only cover INSERT (upload succeeds once per path, then every
      // re-upload to the same path 403s). Deleting first forces every
      // write through the INSERT path instead. The delete is expected to
      // 404 on a first-ever upload — that's fine, ignore it.
      await supabase.storage.from('avatars').remove([path]);

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false, cacheControl: '3600' });
      if (uploadErr) {
        toast.error('Upload failed: ' + uploadErr.message);
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const urlWithBust = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase.auth.updateUser({ data: { avatar_url: urlWithBust } });
      if (updateErr) {
        toast.error('Failed to save avatar');
      } else {
        setPreviewUrl(urlWithBust);
        await supabase.auth.refreshSession();
        if (saveProfile) await saveProfile({ avatarUrl: urlWithBust });
        toast.success('Profile picture updated');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="bg-card border border-border rounded-2xl p-5 gap-5">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-4 flex-1 min-w-0">
          <Pressable onPress={handlePickAvatar} disabled={uploading || isEditing} className="relative">
            {previewUrl ? (
              <Image source={{ uri: previewUrl }} style={{ width: 56, height: 56, borderRadius: 16 }} contentFit="cover" />
            ) : (
              <View className="h-14 w-14 rounded-2xl bg-primary/15 border border-primary/20 items-center justify-center">
                <Text className="text-lg font-bold text-primary">{initials}</Text>
              </View>
            )}
            <View className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border border-border items-center justify-center">
              <Camera size={12} color="#e4e4e7" />
            </View>
          </Pressable>
          <View className="flex-1 min-w-0">
            <Text className="font-bold text-lg text-foreground" numberOfLines={1}>
              {displayName || 'User'}
            </Text>
            <Text variant="small" numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </View>

        {!isEditing && (
          <Button variant="ghost" size="icon" onPress={() => setIsEditing(true)}>
            <Edit2 size={16} color="#a1a1aa" />
          </Button>
        )}
      </View>

      {isEditing ? (
        <View className="gap-4 pt-4 border-t border-border">
          <View className="gap-1.5">
            <Text variant="small" className="font-semibold">
              Full Name
            </Text>
            <Input value={fullName} onChangeText={setFullName} />
          </View>
          <View className="gap-1.5">
            <Text variant="small" className="font-semibold">
              Date of Birth
            </Text>
            <CustomDatePicker
              selected={dob ? new Date(dob) : null}
              onChange={(date) => setDob(date ? format(date, 'yyyy-MM-dd') : '')}
              placeholderText="Select date"
            />
          </View>
          <View className="flex-row gap-3 pt-2">
            <Button onPress={onSave} loading={loading} className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Check size={16} color="#000000" />
                <Text className="text-primary-foreground font-semibold">Save</Text>
              </View>
            </Button>
            <Button variant="outline" onPress={() => setIsEditing(false)} disabled={loading} className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <X size={16} color="#e4e4e7" />
                <Text className="text-foreground font-semibold">Cancel</Text>
              </View>
            </Button>
          </View>
        </View>
      ) : (
        <View className="gap-3 pt-4 border-t border-border">
          <View className="flex-row items-center gap-3">
            <Mail size={14} color="#a1a1aa" />
            <Text variant="small">{user.email}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <UserIcon size={14} color="#a1a1aa" />
            <Text variant="small">DOB: {profile?.dob || (user.user_metadata?.dob as string) || 'Not set'}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Calendar size={14} color="#a1a1aa" />
            <Text variant="small">Joined {new Date(user.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      )}
    </View>
  );
};
