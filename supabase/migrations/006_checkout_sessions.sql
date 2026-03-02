-- Carrinho abandonado: sessões de checkout com email para trigger após 2h
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_created_at
  ON public.checkout_sessions(created_at)
  WHERE email_sent_at IS NULL;

ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert checkout_sessions" ON public.checkout_sessions;
DROP POLICY IF EXISTS "Allow select checkout_sessions" ON public.checkout_sessions;
DROP POLICY IF EXISTS "Allow update checkout_sessions" ON public.checkout_sessions;
CREATE POLICY "Allow insert checkout_sessions" ON public.checkout_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select update for service" ON public.checkout_sessions FOR SELECT USING (true);
CREATE POLICY "Allow update for service" ON public.checkout_sessions FOR UPDATE USING (true);
