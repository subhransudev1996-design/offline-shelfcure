-- ============================================================
-- Sales CRM — Phase 6: unified activity timeline + in-app
-- notifications. Voice notes live in the timeline as event_type
-- 'voice_note' (transcript only, no audio — per project decision).
-- Run in Supabase SQL Editor. ADDITIVE ONLY — safe to re-run.
-- ============================================================

-- 1. Unified activity log — every meaningful action on a lead
--    (follow-up, demo, visit, trial, voice note, status change…).
CREATE TABLE IF NOT EXISTS public.lead_timeline (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES public.sales_profiles(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_timeline_lead_idx ON public.lead_timeline(lead_id, created_at DESC);

ALTER TABLE public.lead_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON public.lead_timeline;
CREATE POLICY "Service role full access"
  ON public.lead_timeline FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- 2. In-app notifications (PRD §16 — in-app only).
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.sales_profiles(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  lead_id     UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx
  ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON public.notifications;
DROP POLICY IF EXISTS "Read own notifications"   ON public.notifications;
CREATE POLICY "Service role full access"
  ON public.notifications FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
