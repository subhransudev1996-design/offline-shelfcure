-- ============================================================
-- FIX: "Database error creating new user"
--
-- Root cause: the trigger function public.handle_new_user_settings()
-- runs on every auth signup and does:
--     INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
-- but the public.user_settings table is missing, so EVERY user
-- creation fails (dashboard + API alike).
--
-- Fix: recreate the missing table. The trigger only supplies user_id,
-- so every other column must have a default. Additive — safe to re-run.
-- Run in Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security: a user reads/writes only their own settings row;
-- service_role keeps full access.
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.user_settings;
DROP POLICY IF EXISTS "Own settings"             ON public.user_settings;

CREATE POLICY "Service role full access"
  ON public.user_settings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Own settings"
  ON public.user_settings FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Backfill a settings row for any existing auth user that lacks one,
-- so older accounts are consistent with new ones.
INSERT INTO public.user_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
