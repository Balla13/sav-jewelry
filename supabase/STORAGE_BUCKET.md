# Supabase Storage: bucket `product-images`

O código usa **exatamente** o nome de bucket: `product-images` (veja `src/app/api/admin/upload/route.ts`).

Se aparecer **"Bucket not found"**, crie o bucket no Supabase:

1. Acesse **Supabase Dashboard** → **Storage**.
2. Clique em **New bucket**.
3. Nome: **product-images** (exatamente assim, minúsculo, com hífen).
4. Marque **Public bucket** (para as URLs públicas das imagens funcionarem na loja).
5. Crie o bucket.

Políticas: em buckets públicos, o Supabase costuma permitir upload com a anon key. Se der erro de permissão no upload, em Storage → Policies crie uma política para o bucket `product-images` permitindo `INSERT` para `anon` ou `authenticated`.
