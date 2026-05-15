-- ============================================================
-- Sales CRM — RLS audit
-- READ-ONLY. Run in Supabase SQL Editor to verify Row Level
-- Security is enabled and policies look correct on every table
-- this project owns. Paste the output of each query in turn —
-- the SQL editor only shows the LAST statement's result.
-- ============================================================

-- 1) RLS enabled? Every row should have `rls_enabled = true`.
SELECT
  c.relname                AS table_name,
  c.relrowsecurity         AS rls_enabled,
  c.relforcerowsecurity    AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'sales_profiles',
    'leads',
    'lead_followups',
    'lead_visits',
    'lead_demos',
    'lead_trials',
    'lead_timeline',
    'notifications',
    'user_settings'
  )
ORDER BY c.relname;

-- 2) Every policy attached to those tables, grouped per table.
--    Confirm there is a "Service role full access" policy on every one,
--    and that authenticated reads are appropriately narrow.
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd        AS for_command,
  qual       AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'sales_profiles',
    'leads',
    'lead_followups',
    'lead_visits',
    'lead_demos',
    'lead_trials',
    'lead_timeline',
    'notifications',
    'user_settings'
  )
ORDER BY tablename, policyname;

-- 3) Counts of rows per table. Tables that don't exist yet are reported as
--    "(table missing — run the matching migration)". This makes the script
--    safe to run no matter how far you've got through the SQL files.
SELECT
  t.name AS table_name,
  CASE
    WHEN c.exists THEN
      (xpath(
        '/row/c/text()',
        query_to_xml(
          format('SELECT COUNT(*) AS c FROM public.%I', t.name),
          false, true, ''
        )
      ))[1]::text
    ELSE '(table missing — run the matching migration)'
  END AS row_count
FROM (VALUES
  ('sales_profiles'),
  ('leads'),
  ('lead_followups'),
  ('lead_visits'),
  ('lead_demos'),
  ('lead_trials'),
  ('lead_timeline'),
  ('notifications')
) AS t(name)
LEFT JOIN LATERAL (
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name   = t.name
  ) AS exists
) AS c ON true
ORDER BY t.name;
