-- Tabela de contatos para pop-up de saída / newsletter
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS contacts_email_source_unique
  ON public.contacts (email, source);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contacts insert for anon" ON public.contacts;
DROP POLICY IF EXISTS "Contacts select for service" ON public.contacts;

CREATE POLICY "Contacts insert for anon"
  ON public.contacts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Contacts select for service"
  ON public.contacts
  FOR SELECT
  USING (true);

