import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@llb/api';
import { getMmkvBundle } from '@/lib/mmkv';
import { attachOfflinePersistence, detachOfflinePersistence } from '@/lib/offline';

// Mirrors apps/web/src/contexts/auth-context.tsx exactly — same shape, same
// getSession()-then-subscribe pattern, same cache-clear-on-signout.

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (!session) {
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Re-keys the offline cache to whichever account is now signed in (or
  // tears it down entirely when signed out), the same isolation
  // @llb/notifications' store already applies to its own storage. Reacts
  // to `user?.id` rather than living inline in signOut()/the auth listener
  // above, so both paths — an explicit sign-out and an external session
  // change (token expiry, sign-in on first launch) — are covered by one
  // rule instead of two copies of it.
  useEffect(() => {
    if (user?.id) {
      attachOfflinePersistence(user.id, getMmkvBundle().persistentKvStore);
    } else {
      detachOfflinePersistence();
    }
  }, [user?.id]);

  const signOut = async () => {
    setUser(null);
    setSession(null);
    queryClient.clear();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
