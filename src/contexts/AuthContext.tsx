import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type { UserProfile, Role } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// ----------------------------------------------------------------
// Context interface
// ----------------------------------------------------------------

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  role: Role | null;
  loading: boolean;
  login: (identifier: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/**
 * Accept either an email or a short username.
 * Short usernames (no @) are mapped to @hospital.ai
 * so that "admin" → "admin@hospital.ai".
 */
function resolveEmail(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) return trimmed;
  return `${trimmed.toLowerCase()}@hospital.ai`;
}

async function fetchProfile(userId: string, email: string): Promise<UserProfile> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return {
    id: userId,
    username: email.split('@')[0],
    email,
    full_name: (profile?.full_name as string | null) ?? email,
    role: ((profile?.role as Role | null) ?? 'staff'),
    department: (profile?.department as string | null) ?? '',
    employee_id: (profile?.employee_id as string | null) ?? '',
    avatar_url: null,
    created_at: (profile?.created_at as string | null) ?? new Date().toISOString(),
    updated_at: (profile?.created_at as string | null) ?? new Date().toISOString(),
    last_login: null,
  };
}

// ----------------------------------------------------------------
// Provider
// ----------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Supabase not set up yet — show login but disable it
      setLoading(false);
      return;
    }

    // ── 1. Restore session on page load ──────────────────────────
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const profile = await fetchProfile(
            session.user.id,
            session.user.email ?? '',
          );
          setUser(profile);
        } catch {
          // Stale session / profile missing → sign out cleanly
          await supabase.auth.signOut();
          setUser(null);
        }
      }
      setLoading(false);
    });

    // ── 2. React to sign-in, sign-out, token refresh ─────────────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
        session?.user
      ) {
        try {
          const profile = await fetchProfile(
            session.user.id,
            session.user.email ?? '',
          );
          setUser(profile);
        } catch {
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── login ──────────────────────────────────────────────────────
  const login = useCallback(
    async (identifier: string, password: string, _remember: boolean) => {
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase is not configured.\n' +
            'Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
            'to your .env file and restart the dev server.',
        );
      }

      const email = resolveEmail(identifier);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(
          error.message === 'Invalid login credentials'
            ? 'Invalid email or password. Please check your credentials.'
            : error.message,
        );
      }
      // onAuthStateChange (SIGNED_IN) will update user state
    },
    [],
  );

  // ── logout ─────────────────────────────────────────────────────
  const logout = useCallback(() => {
    if (isSupabaseConfigured) {
      void supabase.auth.signOut();
      // onAuthStateChange (SIGNED_OUT) will clear user state
    } else {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        role: user?.role ?? null,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
