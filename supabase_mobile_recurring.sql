-- ============================================================
-- Mobile add-on yearly recurring subscriptions
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Drop the (license_key, product) unique constraint so a license
--    can have multiple mobile plan rows (one per yearly cycle).
ALTER TABLE public.license_payments
  DROP CONSTRAINT IF EXISTS license_payments_license_key_product_unique;

-- 2. Add cycle date columns (nullable for backward compatibility with
--    existing desktop one-time payments).
ALTER TABLE public.license_payments
  ADD COLUMN IF NOT EXISTS cycle_start_date DATE,
  ADD COLUMN IF NOT EXISTS cycle_end_date   DATE;

-- 3. Helpful index for fetching cycles in order
CREATE INDEX IF NOT EXISTS license_payments_license_product_cycle_idx
  ON public.license_payments (license_key, product, cycle_start_date DESC);
