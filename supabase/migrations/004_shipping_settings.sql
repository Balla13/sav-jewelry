-- Frete fixo em settings + frete grátis por produto
-- Rodar após 002_products_settings.sql / 003

-- ========== 1. SETTINGS: shipping_fee_usd ==========
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS shipping_fee_usd NUMERIC(10,2) NOT NULL DEFAULT 5;

-- ========== 2. PRODUCTS: free_shipping ==========
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT false;
