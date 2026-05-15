-- ============================================================
-- Sales CRM — Phase 1: Employee identity & roles
-- Run in Supabase SQL Editor. Safe to re-run. Additive only.
-- ============================================================

-- 1. Profile row per Supabase Auth user that belongs to the sales org.
--    Existing admins (web-panel logins) do NOT need a row — the app
--    treats "no profile" as a legacy admin (see middleware.ts).
CREATE TABLE IF NOT EXISTS public.sales_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT,                              -- denormalised for display
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'field_sales',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Role must be one of the three known roles (re-runnable).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_profiles_role_chk'
  ) THEN
    ALTER TABLE public.sales_profiles
      ADD CONSTRAINT sales_profiles_role_chk
      CHECK (role IN ('admin', 'field_sales', 'demo_team'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS sales_profiles_role_idx ON public.sales_profiles(role);

-- 3. Row Level Security
ALTER TABLE public.sales_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.sales_profiles;
DROP POLICY IF EXISTS "Read own profile"          ON public.sales_profiles;

-- Admin API routes use service_role and need full access.
CREATE POLICY "Service role full access"
  ON public.sales_profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- A signed-in mobile user may read (only) their own profile row.
CREATE POLICY "Read own profile"
  ON public.sales_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
