-- Etiqueta "Peça única" editável + texto seguro no envio (settings)
-- Preço normal vs promocional por produto (compare_at_price)
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS unique_piece_label TEXT,
  ADD COLUMN IF NOT EXISTS shipping_insured_text TEXT;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(12,2) NULL;
