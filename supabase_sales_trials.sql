-- ============================================================
-- Sales CRM — Phase 5: trial management (PRE-conversion trials
-- tracked at the lead level; the post-conversion license trial
-- in `desktop_licenses` is a separate concept).
-- Run in Supabase SQL Editor. ADDITIVE ONLY — safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lead_trials (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                UUID NOT NULL UNIQUE
                          REFERENCES public.leads(id) ON DELETE CASCADE,

  start_date             DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date            DATE,
  last_active_date       DATE,
  login_count            INT  NOT NULL DEFAULT 0,
  conversion_probability INT,                 -- 0..100
  notes                  TEXT,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_trials_expiry_idx ON public.lead_trials(expiry_date);

ALTER TABLE public.lead_trials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.lead_trials;

CREATE POLICY "Service role full access"
  ON public.lead_trials FOR ALL TO service_role
  USING (true) WITH CHECK (true);
