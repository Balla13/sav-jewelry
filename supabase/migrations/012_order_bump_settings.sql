-- Configuração do produto de order bump (kit de limpeza) em settings
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS order_bump_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS order_bump_name TEXT,
  ADD COLUMN IF NOT EXISTS order_bump_description TEXT,
  ADD COLUMN IF NOT EXISTS order_bump_price_usd NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS order_bump_compare_at_price_usd NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS order_bump_image_url TEXT;

