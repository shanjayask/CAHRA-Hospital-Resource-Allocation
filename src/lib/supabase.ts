import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True only when real Supabase credentials have been provided.
 * When false the app shows a "not configured" error on login.
 */
export const isSupabaseConfigured =
  !!supabaseUrl &&
  supabaseUrl !== 'https://YOUR_PROJECT.supabase.co' &&
  !!supabaseAnonKey &&
  supabaseAnonKey !== 'YOUR_ANON_KEY_HERE';

/**
 * Single Supabase client for the whole application.
 * Supabase handles token storage, refresh, and session persistence internally.
 */
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder',
);
