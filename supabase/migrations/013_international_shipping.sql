-- International flat-rate shipping (admin-editable, default $35)
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS international_shipping_usd NUMERIC(10,2) NOT NULL DEFAULT 35;
