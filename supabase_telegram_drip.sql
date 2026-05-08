-- ============================================================
-- Run this in Supabase SQL Editor
-- Adds Telegram drip columns to trial_requests
-- ============================================================

ALTER TABLE public.trial_requests
  ADD COLUMN IF NOT EXISTS telegram_chat_id   TEXT,
  ADD COLUMN IF NOT EXISTS drip_steps_sent    INTEGER[] NOT NULL DEFAULT '{}';

-- Index for cron query performance (only processes linked users)
CREATE INDEX IF NOT EXISTS idx_trial_requests_telegram
  ON public.trial_requests (telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;
