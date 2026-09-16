/**
 * CAHRA Auth Service — Supabase wrapper utilities.
 *
 * Authentication is handled by AuthContext (src/contexts/AuthContext.tsx)
 * using supabase.auth.onAuthStateChange and supabase.auth.signInWithPassword.
 *
 * This file provides supplementary helpers if needed elsewhere.
 */
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Role, UserProfile } from '@/types';

export { isSupabaseConfigured };

/**
 * Resolve email from short username ("admin" → "admin@hospital.ai").
 */
export function resolveEmail(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) return trimmed;
  return `${trimmed.toLowerCase()}@hospital.ai`;
}

/**
 * Get the role label for display.
 */
export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    admin: 'Admin',
    doctor: 'Doctor',
    staff: 'Staff',
    auditor: 'Auditor',
  };
  return labels[role];
}

/**
 * Fetch the current Supabase session user profile from the profiles table.
 * Returns null if there is no active session or Supabase is not configured.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) return null;

  return {
    id: session.user.id,
    username: session.user.email?.split('@')[0] ?? '',
    email: session.user.email ?? '',
    full_name: (profile.full_name as string) ?? '',
    role: (profile.role as Role) ?? 'staff',
    department: (profile.department as string) ?? '',
    employee_id: (profile.employee_id as string) ?? '',
    avatar_url: null,
    created_at: (profile.created_at as string) ?? new Date().toISOString(),
    updated_at: (profile.created_at as string) ?? new Date().toISOString(),
    last_login: null,
  };
}
