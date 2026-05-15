-- ============================================================
-- web_orders — Razorpay orders from the marketing website
--
-- Lives separately from public.purchases (which is the pharmacy
-- desktop app's supplier-bills table). All Razorpay-related code
-- in /app/api/razorpay/** and the admin orders/customers pages
-- point at THIS table.
--
-- Safe to run on a fresh project (no order data has ever existed).
-- Additive and re-runnable.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.web_orders (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id    text        UNIQUE,
  razorpay_payment_id  text,
  customer_name        text        NOT NULL,
  email                text        NOT NULL,
  phone                text        NOT NULL,
  gstin                text,
  amount_base          integer     NOT NULL,
  amount_gst           integer     NOT NULL,
  amount_total         integer     NOT NULL,
  payment_status       text        NOT NULL DEFAULT 'pending'
                                   CHECK (payment_status IN ('pending','paid','failed')),
  plan_type            text        NOT NULL DEFAULT 'lifetime',
  emi_months           integer,
  paid_at              timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS web_orders_email_idx          ON public.web_orders (email);
CREATE INDEX IF NOT EXISTS web_orders_payment_status_idx ON public.web_orders (payment_status);
CREATE INDEX IF NOT EXISTS web_orders_paid_at_desc_idx   ON public.web_orders (paid_at DESC);

-- Service-role-only access. Razorpay routes use the service client;
-- the admin pages do too. No end-user reads this directly.
ALTER TABLE public.web_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.web_orders;
CREATE POLICY "Service role full access" ON public.web_orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- licenses.purchase_id should reference web_orders.id, not the pharmacy
-- purchases table. Drop any old FK first, then recreate. Both halves are
-- idempotent.
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'public.licenses'::regclass
    AND contype  = 'f'
    AND conkey   = ARRAY[
      (SELECT attnum FROM pg_attribute
        WHERE attrelid = 'public.licenses'::regclass AND attname = 'purchase_id')
    ];

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.licenses DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

ALTER TABLE public.licenses
  ADD CONSTRAINT licenses_purchase_id_fkey
  FOREIGN KEY (purchase_id) REFERENCES public.web_orders(id) ON DELETE SET NULL;

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'web_orders'
ORDER BY ordinal_position;
