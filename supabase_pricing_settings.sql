-- ============================================================
-- Global pricing settings — single-row table
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id                            INT PRIMARY KEY DEFAULT 1,
  -- Desktop defaults
  desktop_base_amount           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  desktop_gst_rate              NUMERIC(5, 2)  NOT NULL DEFAULT 18,
  desktop_gst_inclusive         BOOLEAN        NOT NULL DEFAULT false,
  desktop_default_payment_type  TEXT           NOT NULL DEFAULT 'one_time'
                                CHECK (desktop_default_payment_type IN ('one_time','3_month_emi','6_month_emi')),
  -- Mobile defaults (one-time only)
  mobile_base_amount            NUMERIC(12, 2) NOT NULL DEFAULT 0,
  mobile_gst_rate               NUMERIC(5, 2)  NOT NULL DEFAULT 18,
  mobile_gst_inclusive          BOOLEAN        NOT NULL DEFAULT false,
  -- Included AI credits per license (shown on invoice as the base AI quota)
  ai_credits_included           INT            NOT NULL DEFAULT 50,
  -- Included AI label scans per license
  label_scans_included          INT            NOT NULL DEFAULT 50,
  updated_at                    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  CONSTRAINT pricing_settings_singleton CHECK (id = 1)
);

-- Idempotent column add (for existing tables)
ALTER TABLE public.pricing_settings
  ADD COLUMN IF NOT EXISTS ai_credits_included  INT NOT NULL DEFAULT 50;
ALTER TABLE public.pricing_settings
  ADD COLUMN IF NOT EXISTS label_scans_included INT NOT NULL DEFAULT 50;

-- Seed the single row
INSERT INTO public.pricing_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read pricing_settings"        ON public.pricing_settings;
DROP POLICY IF EXISTS "Authenticated update pricing_settings" ON public.pricing_settings;

CREATE POLICY "Public read pricing_settings"
  ON public.pricing_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated update pricing_settings"
  ON public.pricing_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
