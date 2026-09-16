-- ============================================================
-- CAHRA Supabase Database Schema
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================

-- Enable RLS
-- (Row Level Security is enabled per table below)

-- ============================================================
-- PROFILES
-- Mirrors Supabase auth.users with CAHRA role information.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'staff'
                CHECK (role IN ('admin', 'doctor', 'staff', 'auditor')),
  department  TEXT NOT NULL DEFAULT '',
  employee_id TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SIMULATION HISTORY
-- Records every FastAPI /simulate call result.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.simulation_history (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario              TEXT NOT NULL DEFAULT 'Custom Scenario',
  predicted_admissions  DOUBLE PRECISION NOT NULL,
  predicted_beds        DOUBLE PRECISION NOT NULL,
  predicted_icu         DOUBLE PRECISION NOT NULL,
  predicted_nurses      DOUBLE PRECISION NOT NULL,
  predicted_doctors     DOUBLE PRECISION NOT NULL,
  predicted_ventilators DOUBLE PRECISION NOT NULL,
  planning_level        TEXT NOT NULL,
  bottleneck            TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.simulation_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own simulation history
CREATE POLICY "sim_history_select_own"
  ON public.simulation_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own simulation history
CREATE POLICY "sim_history_insert_own"
  ON public.simulation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOGS
-- Timestamped log of prediction and simulation events.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role           TEXT NOT NULL DEFAULT 'staff',
  action         TEXT NOT NULL,
  scenario       TEXT,
  prediction     TEXT,
  planning_level TEXT,
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins and auditors can read all logs
CREATE POLICY "audit_logs_select_admin_auditor"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'auditor')
    )
  );

-- All authenticated users can insert audit logs for their own actions
CREATE POLICY "audit_logs_insert_own"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
