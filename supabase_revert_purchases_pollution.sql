-- ============================================================
-- Revert: undo the mistaken ALTER from supabase_fix_purchases.sql.
--
-- public.purchases turned out to be the pharmacy desktop app's
-- supplier-bills table (pharmacy_id, supplier_id, bill_number...).
-- The web app's order/customer code wants a SEPARATE table — see
-- supabase_web_orders.sql. This script removes the web-only columns
-- that were wrongly added to the supplier-bills table.
--
-- Safe to run: every column listed below was added in the previous
-- (mistaken) migration and contains no data (everything is nullable
-- and no inserts have happened since).
-- ============================================================

ALTER TABLE public.purchases
  DROP COLUMN IF EXISTS customer_name,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS gstin,
  DROP COLUMN IF EXISTS razorpay_order_id,
  DROP COLUMN IF EXISTS razorpay_payment_id,
  DROP COLUMN IF EXISTS amount_base,
  DROP COLUMN IF EXISTS amount_gst,
  DROP COLUMN IF EXISTS amount_total,
  DROP COLUMN IF EXISTS plan_type,
  DROP COLUMN IF EXISTS emi_months,
  DROP COLUMN IF EXISTS paid_at;

DROP INDEX IF EXISTS public.purchases_email_idx;
DROP INDEX IF EXISTS public.purchases_paid_at_desc_idx;
-- payment_status already existed on the pharmacy table — leave its index alone.
-- We didn't create purchases_payment_status_idx if it already existed; the
-- IF NOT EXISTS would have skipped it. Drop only if it shouldn't be there:
-- (uncomment if you want to remove it)
-- DROP INDEX IF EXISTS public.purchases_payment_status_idx;
