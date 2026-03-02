-- Ícone do site (favicon) + Pixel ID (Meta/Facebook)
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS site_icon_url TEXT,
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;

