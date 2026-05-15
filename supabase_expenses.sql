-- ============================================================
-- expenses — business-expense log for the marketing website
--
-- One row per expense. The /admin/expenses page is a manual entry
-- form; the /admin/expenses/reports page joins this against
-- web_orders to compute revenue, expenses, and profit per period.
--
-- Money is stored in PAISE (smallest INR unit, integer) to match
-- web_orders.amount_total and avoid float drift. UI shows ₹.
--
-- Safe to run on existing DB. Additive and re-runnable.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.expenses (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  spent_on        date        NOT NULL,
  category        text        NOT NULL CHECK (category IN (
                    'marketing',
                    'salaries',
                    'software',
                    'infrastructure',
                    'office',
                    'travel',
                    'professional_fees',
                    'taxes',
                    'refunds',
                    'other'
                  )),
  vendor          text,
  description     text        NOT NULL,
  amount_paise    bigint      NOT NULL CHECK (amount_paise >= 0),
  payment_method  text        CHECK (payment_method IN (
                    'card','upi','bank_transfer','cash','cheque','other'
                  )),
  reference       text,           -- invoice no., txn id, receipt url, free-form
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_spent_on_desc_idx ON public.expenses (spent_on DESC);
CREATE INDEX IF NOT EXISTS expenses_category_idx      ON public.expenses (category);

-- Auto-bump updated_at on update.
CREATE OR REPLACE FUNCTION public.expenses_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS expenses_updated_at ON public.expenses;
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.expenses_set_updated_at();

-- Service-role-only — admin pages use the service client.
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.expenses;
CREATE POLICY "Service role full access" ON public.expenses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'expenses'
ORDER BY ordinal_position;
