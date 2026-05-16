-- ============================================================
-- Test-account flag for desktop licenses
-- Test licenses are excluded from revenue / profit reporting.
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.desktop_licenses
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS desktop_licenses_is_test_idx
  ON public.desktop_licenses (is_test);
