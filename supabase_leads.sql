-- ============================================================
-- Lead Management System
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================

-- 1. Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name            TEXT NOT NULL,
  pharmacy_name         TEXT,
  phone                 TEXT,
  email                 TEXT,
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  source                TEXT NOT NULL DEFAULT 'cold_call',
  status                TEXT NOT NULL DEFAULT 'new',
  license_interest      TEXT,
  notes                 TEXT,
  converted_license_key TEXT REFERENCES public.desktop_licenses(license_key) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create lead_followups table
CREATE TABLE IF NOT EXISTS public.lead_followups (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type                TEXT NOT NULL DEFAULT 'call',
  notes               TEXT,
  outcome             TEXT,
  next_followup_date  DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for common queries
CREATE INDEX IF NOT EXISTS leads_status_idx         ON public.leads(status);
CREATE INDEX IF NOT EXISTS leads_updated_at_idx     ON public.leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS leads_created_at_idx     ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS followups_lead_id_idx    ON public.lead_followups(lead_id);
CREATE INDEX IF NOT EXISTS followups_next_date_idx  ON public.lead_followups(next_followup_date);

-- 4. Enable RLS
ALTER TABLE public.leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_followups  ENABLE ROW LEVEL SECURITY;

-- 5. Drop old policies (safe to re-run)
DROP POLICY IF EXISTS "Service role full access" ON public.leads;
DROP POLICY IF EXISTS "Authenticated read"       ON public.leads;
DROP POLICY IF EXISTS "Service role full access" ON public.lead_followups;
DROP POLICY IF EXISTS "Authenticated read"       ON public.lead_followups;

-- 6. Service role gets full access (all admin API routes use service_role)
CREATE POLICY "Service role full access"
  ON public.leads FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read"
  ON public.leads FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role full access"
  ON public.lead_followups FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read"
  ON public.lead_followups FOR SELECT TO authenticated
  USING (true);
