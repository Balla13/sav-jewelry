-- Guarda IDs do Stripe para idempotência e rastreio
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_session_id_unique
  ON public.orders(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

