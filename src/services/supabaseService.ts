import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Role } from '@/types';

// ----------------------------------------------------------------
// Types matching the Supabase tables
// ----------------------------------------------------------------

export interface SimulationHistoryRow {
  id?: string;
  user_id: string;
  scenario: string;
  predicted_admissions: number;
  predicted_beds: number;
  predicted_icu: number;
  predicted_nurses: number;
  predicted_doctors: number;
  predicted_ventilators: number;
  planning_level: string;
  bottleneck: string;
  created_at?: string;
}

export interface AuditLogRow {
  id?: string;
  user_id: string;
  role: Role;
  action: string;
  scenario: string | null;
  prediction: string | null;
  planning_level: string | null;
  timestamp?: string;
}

// ----------------------------------------------------------------
// Simulation History
// ----------------------------------------------------------------

export async function saveSimulationHistory(
  row: Omit<SimulationHistoryRow, 'id' | 'created_at'>,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.from('simulation_history').insert(row);
  if (error) {
    console.warn('[CAHRA] saveSimulationHistory error:', error.message);
  }
}

export async function getSimulationHistory(
  userId: string,
  limit = 20,
): Promise<SimulationHistoryRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('simulation_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[CAHRA] getSimulationHistory error:', error.message);
    return [];
  }

  return (data ?? []) as SimulationHistoryRow[];
}

// ----------------------------------------------------------------
// Audit Logs
// ----------------------------------------------------------------

export async function saveAuditLog(
  row: Omit<AuditLogRow, 'id' | 'timestamp'>,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.from('audit_logs').insert(row);
  if (error) {
    console.warn('[CAHRA] saveAuditLog error:', error.message);
  }
}

export async function getAuditLogs(limit = 50): Promise<AuditLogRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[CAHRA] getAuditLogs error:', error.message);
    return [];
  }

  return (data ?? []) as AuditLogRow[];
}
