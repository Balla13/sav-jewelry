-- Add sync-friendly fields to products table (eBay prep)
-- Safe to run multiple times.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS price NUMERIC,
  ADD COLUMN IF NOT EXISTS quantity INTEGER,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_id TEXT;

-- Backfill from existing columns when present.
UPDATE public.products
SET
  title = COALESCE(title, name),
  price = COALESCE(price, price_usd),
  quantity = COALESCE(quantity, stock_quantity),
  updated_at = COALESCE(updated_at, now())
WHERE
  title IS NULL
  OR price IS NULL
  OR quantity IS NULL;

-- Unique constraint for sync upserts.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_source_source_id_unique'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_source_source_id_unique UNIQUE (source, source_id);
  END IF;
END $$;

-- Helpful index for manual lookups.
CREATE INDEX IF NOT EXISTS products_sku_idx ON public.products (sku);

