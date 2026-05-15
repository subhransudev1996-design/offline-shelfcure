-- ============================================================
-- Sales CRM — Phase 5: demo management.
-- Run in Supabase SQL Editor. ADDITIVE ONLY — safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lead_demos (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  conducted_by           UUID REFERENCES public.sales_profiles(id) ON DELETE SET NULL,

  scheduled_at           TIMESTAMPTZ NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'scheduled',
  -- 'scheduled' | 'completed' | 'no_show' | 'cancelled'

  duration_minutes       INT,
  notes                  TEXT,
  questions_asked        TEXT,
  interest_level         TEXT,                -- 'low' | 'medium' | 'high'
  conversion_probability INT,                 -- 0..100

  completed_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_demos_status_chk'
  ) THEN
    ALTER TABLE public.lead_demos
      ADD CONSTRAINT lead_demos_status_chk
      CHECK (status IN ('scheduled', 'completed', 'no_show', 'cancelled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS lead_demos_lead_idx       ON public.lead_demos(lead_id);
CREATE INDEX IF NOT EXISTS lead_demos_conductor_idx  ON public.lead_demos(conducted_by);
CREATE INDEX IF NOT EXISTS lead_demos_status_idx     ON public.lead_demos(status, scheduled_at);

ALTER TABLE public.lead_demos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.lead_demos;
DROP POLICY IF EXISTS "Read demos I conduct"     ON public.lead_demos;

CREATE POLICY "Service role full access"
  ON public.lead_demos FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Read demos I conduct"
  ON public.lead_demos FOR SELECT TO authenticated
  USING (conducted_by = auth.uid());
