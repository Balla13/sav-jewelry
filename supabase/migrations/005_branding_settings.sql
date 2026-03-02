-- Site Logo e Home Hero Banner (URLs salvas após upload no admin)
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS site_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS home_hero_banner_desktop_url TEXT,
  ADD COLUMN IF NOT EXISTS home_hero_banner_mobile_url TEXT;
