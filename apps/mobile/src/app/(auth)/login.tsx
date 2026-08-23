import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '@llb/api';
import { toast } from '@llb/core';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      toast.error('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      // No manual navigation: (auth)/_layout.tsx redirects once
      // onAuthStateChange fires and AuthProvider's `user` updates.
    } catch (err: any) {
      toast.error(err?.message || 'Failed to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-2xl font-bold text-foreground mb-2">Log in</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#71717a"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          className="rounded-lg border border-border bg-card px-4 py-3 text-foreground"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#71717a"
          secureTextEntry
          autoComplete="password"
          className="rounded-lg border border-border bg-card px-4 py-3 text-foreground"
        />

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-primary py-3 items-center mt-2"
        >
          {submitting ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text className="text-primary-foreground font-semibold">Log in</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
