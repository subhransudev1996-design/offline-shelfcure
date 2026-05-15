-- ============================================================
-- Sales CRM — Phase 2: extend the existing `leads` table.
-- Run in Supabase SQL Editor. ADDITIVE ONLY — safe to re-run.
-- No renames, no drops, no type changes. Existing admin Leads
-- pages and API routes are unaffected (all new columns nullable).
-- ============================================================

-- ── Assignment ──────────────────────────────────────────────
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- FK: assigned field-sales/demo employee. ON DELETE SET NULL so
-- deleting an employee never deletes their leads (re-runnable).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_assigned_to_fkey'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_assigned_to_fkey
      FOREIGN KEY (assigned_to) REFERENCES public.sales_profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ── Contact / geo ───────────────────────────────────────────
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gps_lat  DOUBLE PRECISION;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gps_lng  DOUBLE PRECISION;

-- ── Pipeline intelligence ───────────────────────────────────
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS priority_score INT NOT NULL DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lost_reason    TEXT;

-- ── Pharmacy intelligence (captured by field exec) ──────────
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS existing_software      TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS monthly_billing_volume TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS staff_count            INT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS has_computer           BOOLEAN;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS has_internet           BOOLEAN;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS drug_license_no        TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gst_number             TEXT;

-- ── Competitor tracking ─────────────────────────────────────
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS competitor_name            TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS competitor_satisfaction    TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS competitor_renewal_period  TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS competitor_pain_points     TEXT;

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS leads_geo_idx         ON public.leads(gps_lat, gps_lng);
