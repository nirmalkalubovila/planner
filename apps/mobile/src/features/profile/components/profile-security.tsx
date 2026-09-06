import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react-native';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@llb/api';
import { toast } from '@llb/core';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/typography';

interface ProfileSecurityProps {
  user: User;
}

export const ProfileSecurity: React.FC<ProfileSecurityProps> = ({ user }) => {
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailChange = async () => {
    if (!newEmail || newEmail === user.email) {
      toast.error('Please enter a different email address.');
      return;
    }
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailLoading(false);
    if (!error) {
      toast.success('Confirmation email sent to both old and new addresses. Please verify to complete the change.');
      setNewEmail('');
    } else {
      toast.error(error.message);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (!error) {
      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(error.message);
    }
  };

  return (
    <View className="bg-card border border-border rounded-2xl p-5 gap-6">
      <Text className="text-base font-bold text-foreground">Account Security</Text>

      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <Mail size={14} color="#a1a1aa" />
          <Text variant="small" className="font-semibold">
            Change Email
          </Text>
        </View>
        <Text variant="tiny">
          Current: <Text className="text-foreground font-medium">{user.email}</Text>
        </Text>
        <View className="gap-3">
          <Input
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="New email address"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Button variant="outline" onPress={handleEmailChange} loading={emailLoading} disabled={!newEmail}>
            Update Email
          </Button>
        </View>
      </View>

      <View className="gap-3 pt-4 border-t border-border">
        <View className="flex-row items-center gap-2">
          <KeyRound size={14} color="#a1a1aa" />
          <Text variant="small" className="font-semibold">
            Change Password
          </Text>
        </View>
        <View className="gap-3">
          <View className="relative justify-center">
            <Input
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              secureTextEntry={!showPassword}
              className="pr-10"
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} className="absolute right-3" hitSlop={8}>
              {showPassword ? <EyeOff size={16} color="#a1a1aa" /> : <Eye size={16} color="#a1a1aa" />}
            </Pressable>
          </View>
          <Input
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry={!showPassword}
          />
          <Button onPress={handlePasswordChange} loading={passwordLoading} disabled={!newPassword || !confirmPassword}>
            Update Password
          </Button>
        </View>
      </View>
    </View>
  );
};
