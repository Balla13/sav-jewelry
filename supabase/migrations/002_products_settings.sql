-- SÁV+ Jewelry: stock_quantity em products + tabela settings (redes sociais)
-- Rodar no SQL Editor do Supabase após 001_usd_tables.sql

-- ========== 1. PRODUCTS: adicionar stock_quantity ==========
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;

-- ========== 2. TABELA SETTINGS (uma linha: links redes sociais) ==========
CREATE TABLE IF NOT EXISTS public.settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  instagram_url TEXT,
  facebook_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir linha única se não existir
INSERT INTO public.settings (id, instagram_url, facebook_url)
VALUES (1, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.settings;
DROP POLICY IF EXISTS "Settings are updatable by anon (admin)" ON public.settings;
DROP POLICY IF EXISTS "Settings are insertable by anon (admin)" ON public.settings;

CREATE POLICY "Settings are viewable by everyone"
  ON public.settings FOR SELECT USING (true);
CREATE POLICY "Settings are updatable by anon (admin)"
  ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Settings are insertable by anon (admin)"
  ON public.settings FOR INSERT WITH CHECK (true);

-- Nota: O dashboard de revenue/orders usa a API /api/admin/stats com
-- SUPABASE_SERVICE_ROLE_KEY (server-side) para ler totais sem expor pedidos ao público.
