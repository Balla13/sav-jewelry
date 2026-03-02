-- Expand product categories and ensure images (array) + category
-- Run after 001_initial_tables.sql. If you already have products table, this updates the constraint.

-- Drop existing category constraint if present (Postgres doesn't let you alter CHECK easily)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;

-- Add new category constraint (expanded list)
ALTER TABLE public.products ADD CONSTRAINT products_category_check CHECK (
  category IN (
    'Vintage Metal',
    'Fine Jewelry',
    'Precious Stones',
    'Sterling Silver',
    '18k Gold',
    'Necklaces',
    'Rings',
    'Earrings',
    'Bracelets',
    'Rare Finds'
  )
);

-- Ensure images column exists (already in 001 as JSONB)
-- If you're creating from scratch, use 001_updated below or run 001 then this.
-- No-op if column exists:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'images'
  ) THEN
    ALTER TABLE public.products ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
