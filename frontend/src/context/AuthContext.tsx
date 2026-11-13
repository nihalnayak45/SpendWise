import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UserProfile {
  id: string;
  full_name: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; needsEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Ensures an authenticated user's corresponding public.profiles row exists in Supabase.
 * This satisfies foreign key constraints on public.budget_plan and public.monthly_savings_plans.
 */
export const ensureProfileExists = async (
  currentUser: User,
  preferredName?: string
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, created_at, updated_at')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (!error && data) {
      return data;
    }

    const fallbackName =
      preferredName?.trim() ||
      currentUser.user_metadata?.full_name ||
      currentUser.email?.split('@')[0] ||
      'User';

    const { data: upserted, error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: currentUser.id,
          full_name: fallbackName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('id, full_name, created_at, updated_at')
      .maybeSingle();

    if (upsertError) {
      console.error('Failed to create/verify user profile in Supabase:', upsertError.message);
      return { id: currentUser.id, full_name: fallbackName };
    }

    return upserted || { id: currentUser.id, full_name: fallbackName };
  } catch (err) {
    console.error('Unexpected error ensuring profile:', err);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    const prof = await ensureProfileExists(currentUser);
    if (prof) {
      setProfile(prof);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Get initial session and ensure profile exists BEFORE ending loading state
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(initialSession);
        if (initialSession?.user) {
          const userProf = await ensureProfileExists(initialSession.user);
          if (!isMounted) return;
          setProfile(userProf);
          setUser(initialSession.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error during auth initialization:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);

      if (newSession?.user) {
        const userProf = await ensureProfileExists(newSession.user);
        if (!isMounted) return;
        setProfile(userProf);
        setUser(newSession.user);
      } else {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: new Error(error.message) };
      }
      if (data.user) {
        const prof = await ensureProfileExists(data.user);
        if (prof) setProfile(prof);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Login failed') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const trimmedName = fullName.trim() || email.split('@')[0];
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: trimmedName,
          },
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (data.user) {
        const prof = await ensureProfileExists(data.user, trimmedName);
        if (prof) setProfile(prof);
      }

      // Check if session exists immediately or if email verification is pending
      const needsEmailVerification = !data.session && Boolean(data.user);

      return { error: null, needsEmailVerification };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Sign up failed') };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
