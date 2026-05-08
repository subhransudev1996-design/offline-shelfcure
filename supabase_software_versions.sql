-- ============================================================
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create the software_versions table
CREATE TABLE IF NOT EXISTS public.software_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version      TEXT NOT NULL,
  release_notes TEXT,
  download_url TEXT NOT NULL,
  file_size_mb NUMERIC(8, 1),
  is_latest    BOOLEAN NOT NULL DEFAULT false,
  released_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. RLS policies
ALTER TABLE public.software_versions ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed by invoice email route using anon key)
CREATE POLICY "Public read software_versions"
  ON public.software_versions FOR SELECT
  USING (true);

-- Authenticated admin users can insert new versions
CREATE POLICY "Authenticated insert software_versions"
  ON public.software_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated admin users can update (set is_latest flag)
CREATE POLICY "Authenticated update software_versions"
  ON public.software_versions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- After running the SQL above, also do this in Supabase Dashboard:
--
-- Storage → New bucket
--   Name:   installers
--   Public: YES (toggle on)
--
-- Then go to Admin Panel → Versions → Upload your .exe file.
-- ============================================================
