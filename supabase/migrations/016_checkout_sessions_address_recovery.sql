-- Endereço e link de recuperação para carrinho abandonado
ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS country_code TEXT,
  ADD COLUMN IF NOT EXISTS recovery_token UUID UNIQUE DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_recovery_token
  ON public.checkout_sessions(recovery_token)
  WHERE recovery_token IS NOT NULL;

COMMENT ON COLUMN public.checkout_sessions.recovery_token IS 'Used in /checkout?recover=id to restore this cart. Use id for link (id or recovery_token).';
