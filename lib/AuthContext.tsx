// ============================================================================
// AuthContext
//
// One source of truth for the current user's auth session and profile row.
// Wraps the entire app. Any component can call `useAuth()` to get session,
// profile, settings, and signOut/refreshProfile helpers.
// ============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { rowToProfile, rowToSettings } from './profileMapping';
import type { ProfileRow } from './database.types';
import type { UserProfile, UserSettings } from '../types';

interface AuthContextValue {
  session: Session | null;
  profileRow: ProfileRow | null;
  profile: UserProfile | null;
  settings: UserSettings | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profileRow, setProfileRow] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfileRow(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[AuthContext] failed to load profile:', error.message);
      setProfileRow(null);
      return;
    }
    setProfileRow(data);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) {
      await loadProfile(session.user.id);
    }
  }, [session?.user.id, loadProfile]);

  useEffect(() => {
    let mounted = true;

    // Safety net: if anything hangs, unblock UI after 5s
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        try {
          await loadProfile(data.session?.user.id);
        } catch (e) {
          console.error('[AuthContext] loadProfile threw:', e);
        }
        setLoading(false);
        clearTimeout(safetyTimer);
      })
      .catch((err) => {
        console.error('[AuthContext] getSession threw:', err);
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      try {
        await loadProfile(newSession?.user.id);
      } catch (e) {
        console.error('[AuthContext] loadProfile (listener) threw:', e);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const profile = profileRow ? rowToProfile(profileRow) : null;
  const settings = profileRow ? rowToSettings(profileRow) : null;

  return (
    <AuthContext.Provider value={{ session, profileRow, profile, settings, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
