-- Store eBay OAuth refresh token (User token for sell.inventory)
-- Single row: one eBay seller account per store.

CREATE TABLE IF NOT EXISTS public.ebay_tokens (
  id TEXT PRIMARY KEY DEFAULT 'default',
  refresh_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Upsert uses id='default'
