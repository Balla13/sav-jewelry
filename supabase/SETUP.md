# Setup Supabase – SÁV+ Jewelry

## 1. Criar tabelas e RLS (USD)

1. Abra o **Supabase Dashboard** do seu projeto.
2. Vá em **SQL Editor** → **New query**.
3. Copie todo o conteúdo de `migrations/001_usd_tables.sql` e cole no editor.
4. Execute (**Run**).

Isso remove tabelas antigas (se existirem) e cria de uma vez:
- **products**: id, name, description, category, price_usd, stock_quantity, images (text[]), variations (text[])
- **profiles** e **orders**
- RLS em todas (leitura pública em products; insert/update/delete permitidos para admin; orders aceitam insert para checkout guest).

Depois rode **`migrations/002_products_settings.sql`** para criar a tabela **settings** (links Instagram/Facebook) e garantir a coluna `stock_quantity` se já existir o banco.

**Dashboard (Total Revenue, Total Orders):** adicione `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` (Dashboard do Supabase → Settings → API → service_role) para os cartões de métricas funcionarem.

## 2. Criar o bucket de imagens

O upload do admin usa o bucket **product-images**. Se ele não existir, você verá "Bucket not found".

Siga os passos em [STORAGE_BUCKET.md](./STORAGE_BUCKET.md): Dashboard → Storage → New bucket → nome `product-images`, **Public bucket**.

## Ordem recomendada

1. Rodar `001_usd_tables.sql` (tabelas + RLS).
2. Rodar `002_products_settings.sql` (settings + stock_quantity).
3. Criar o bucket `product-images` no Storage.

Depois disso, o admin consegue criar/editar produtos e fazer upload de imagens.

## Erro "new row violates row-level security policy" ao salvar produto

1. Abra o **Supabase Dashboard** → **SQL Editor** → **New query**.
2. Copie **todo** o conteúdo de **`migrations/003_fix_products_rls.sql`** e cole no editor.
3. Clique em **Run** e confira se aparece "Success".

O script **remove todas** as políticas atuais da tabela `products` e recria apenas as quatro políticas permissivas (SELECT para todos; INSERT/UPDATE/DELETE liberados para o admin). Se ainda falhar, no SQL Editor rode: `SELECT * FROM pg_policies WHERE tablename = 'products';` e envie o resultado para conferir se alguma política restritiva ficou ativa.
