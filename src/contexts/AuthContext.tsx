import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'forte_mais_admin' | 'school_user';

export interface UserProfile {
  id: string;
  role: UserRole;
  school_id: string | null;
  name: string;
}

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any; profile?: UserProfile }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(sessionToLoad: Session) {
      const { data, error } = await supabase
        .from('users')
        .select('id, role, school_id, name')
        .eq('id', sessionToLoad.user.id)
        .single();
      
      if (mounted) {
        if (!error && data) {
          setProfile(data as UserProfile);
        } else {
          setProfile(null);
        }
      }
    }

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (mounted) {
        setSession(initialSession);
        if (initialSession) {
          loadProfile(initialSession).then(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadProfile(newSession);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { error: authError };
    }

    if (authData.session) {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('id, role, school_id, name')
        .eq('id', authData.session.user.id)
        .single();

      if (profileError) {
         return { error: profileError };
      }
      
      return { profile: profileData as UserProfile };
    }

    return { error: new Error('Unknown error') };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
