-- Corrige "new row violates row-level security policy" ao cadastrar produtos no Admin.
-- Rode no SQL Editor do Supabase (Dashboard → SQL Editor → New query → Run).

-- 1. Garantir que RLS está ativo
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes na tabela products (qualquer nome)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
  END LOOP;
END $$;

-- 3. Recriar apenas as políticas permissivas (Admin com cookie consegue INSERT/UPDATE/DELETE)
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT USING (true);

CREATE POLICY "Products are insertable by anon for now"
  ON public.products FOR INSERT WITH CHECK (true);

CREATE POLICY "Products are updatable by anon for now"
  ON public.products FOR UPDATE USING (true);

CREATE POLICY "Products are deletable by anon for now"
  ON public.products FOR DELETE USING (true);
