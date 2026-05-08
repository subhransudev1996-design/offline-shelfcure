-- ============================================================
-- Run this in Supabase SQL Editor to fix RLS on license_payments
-- and add missing columns to desktop_licenses.
-- Safe to re-run: uses IF NOT EXISTS and DROP POLICY IF EXISTS
-- ============================================================

-- 0. Add missing columns to desktop_licenses (safe if already present)
ALTER TABLE public.desktop_licenses
  ADD COLUMN IF NOT EXISTS owner_name   TEXT,
  ADD COLUMN IF NOT EXISTS gst_number   TEXT,
  ADD COLUMN IF NOT EXISTS drug_license TEXT;

-- 0b. Add GST columns to license_payments (safe if already present)
ALTER TABLE public.license_payments
  ADD COLUMN IF NOT EXISTS base_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS gst_rate    NUMERIC(5, 2);


-- 1. Create tables if they don't exist yet
CREATE TABLE IF NOT EXISTS public.license_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key     TEXT NOT NULL,
  payment_type    TEXT NOT NULL CHECK (payment_type IN ('one_time', '3_month_emi', '6_month_emi')),
  total_amount    NUMERIC(10, 2) NOT NULL,
  payment_source  TEXT NOT NULL DEFAULT 'manual_offline',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.license_payment_installments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id          UUID NOT NULL REFERENCES public.license_payments(id) ON DELETE CASCADE,
  license_key         TEXT NOT NULL,
  installment_number  INTEGER NOT NULL,
  amount              NUMERIC(10, 2) NOT NULL,
  due_date            DATE NOT NULL,
  paid_date           DATE,
  payment_method      TEXT,
  reference_id        TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.license_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_payment_installments ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies so we can recreate cleanly
DROP POLICY IF EXISTS "Service role full access" ON public.license_payments;
DROP POLICY IF EXISTS "Authenticated read" ON public.license_payments;
DROP POLICY IF EXISTS "Service role full access" ON public.license_payment_installments;
DROP POLICY IF EXISTS "Authenticated read" ON public.license_payment_installments;

-- 4. license_payments — service_role can do everything (all admin writes go via service role)
CREATE POLICY "Service role full access"
  ON public.license_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated admin UI can read (server-side page.tsx uses service_role, so this is belt-and-suspenders)
CREATE POLICY "Authenticated read"
  ON public.license_payments
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. license_payment_installments — same pattern
CREATE POLICY "Service role full access"
  ON public.license_payment_installments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated read"
  ON public.license_payment_installments
  FOR SELECT
  TO authenticated
  USING (true);
