-- ============================================================
-- Sales CRM — Phase 4: GPS visit tracking.
-- Run in Supabase SQL Editor. ADDITIVE ONLY — safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lead_visits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sales_user_id       UUID NOT NULL REFERENCES public.sales_profiles(id) ON DELETE CASCADE,

  check_in_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_at        TIMESTAMPTZ,

  check_in_lat        DOUBLE PRECISION,
  check_in_lng        DOUBLE PRECISION,
  check_out_lat       DOUBLE PRECISION,
  check_out_lng       DOUBLE PRECISION,

  -- Distance (metres) of the check-in point from the lead's saved pin,
  -- and whether that was within the allowed radius (150 m).
  distance_from_pin_m DOUBLE PRECISION,
  within_radius       BOOLEAN,

  duration_seconds    INT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_visits_lead_id_idx ON public.lead_visits(lead_id);
CREATE INDEX IF NOT EXISTS lead_visits_user_idx    ON public.lead_visits(sales_user_id);

-- Fast lookup of a user's currently-open visit (only one allowed at a time).
CREATE INDEX IF NOT EXISTS lead_visits_open_idx
  ON public.lead_visits(sales_user_id)
  WHERE check_out_at IS NULL;

-- Row Level Security
ALTER TABLE public.lead_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.lead_visits;
DROP POLICY IF EXISTS "Read own visits"          ON public.lead_visits;

CREATE POLICY "Service role full access"
  ON public.lead_visits FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Read own visits"
  ON public.lead_visits FOR SELECT TO authenticated
  USING (sales_user_id = auth.uid());
