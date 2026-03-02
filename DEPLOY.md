# Deploy e domínio (Hostinger + Vercel)

Para o site continuar funcionando igual (Stripe, Supabase, Resend, cron, etc.), o **melhor caminho** é hospedar o Next.js na **Vercel** e usar o domínio da Hostinger (e, se quiser, DNS na Cloudflare).

---

## Passo a passo do zero (sem Vercel ainda)

### Passo 1: Deixar o projeto no GitHub

- Se o projeto ainda não está no GitHub: crie uma conta em [github.com](https://github.com), crie um repositório novo (ex.: `sav-jewelry`) e suba o código:
  - No terminal, na pasta do projeto:  
    `git init` → `git add .` → `git commit -m "Initial commit"` → `git branch -M main` → `git remote add origin https://github.com/SEU_USUARIO/sav-jewelry.git` → `git push -u origin main`
- Se já está no GitHub, pule para o passo 2.

### Passo 2: Criar conta na Vercel e importar o projeto

1. Acesse [vercel.com](https://vercel.com) e clique em **Sign Up**.
2. Escolha **Continue with GitHub** e autorize a Vercel a acessar seus repositórios.
3. No dashboard da Vercel, clique em **Add New…** → **Project**.
4. Na lista, escolha o repositório do projeto (ex.: `sav-jewelry`) e clique em **Import**.
5. **Não** clique em Deploy ainda; antes configure as variáveis de ambiente (próximo passo).

### Passo 3: Configurar variáveis de ambiente na Vercel

1. Na tela do projeto (antes ou depois do primeiro deploy), vá em **Settings** → **Environment Variables**.
2. Adicione **cada** variável do seu `.env.local`, uma a uma. Use o mesmo nome e o mesmo valor (copie e cole). Marque **Production**, **Preview** e **Development** para cada uma.

   Lista das que o projeto usa:

   | Nome | Onde achar o valor |
   |------|--------------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | No seu `.env.local` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No seu `.env.local` |
   | `SUPABASE_SERVICE_ROLE_KEY` | No seu `.env.local`. **Obrigatório** — sem isso o admin não consegue criar/editar produtos no Supabase. |
   | `ADMIN_PASSWORD` | Senha do painel /admin. **Obrigatório em produção** — sem isso não dá para criar/editar produtos. Use a mesma em todo lugar. |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No seu `.env.local` (pk_live_...) |
   | `STRIPE_SECRET_KEY` | No seu `.env.local` (sk_live_...) |
   | `RESEND_API_KEY` | No seu `.env.local` (chave do Resend) |
   | `RESEND_FROM_EMAIL` | (Opcional) Ex.: `contact@savjewelry.shop` depois de verificar o domínio no Resend |
   | `NEXT_PUBLIC_SITE_URL` | **Produção:** `https://savjewelry.shop` — usado em e-mails e links. Defina na Vercel e faça Redeploy. |
   | `CRON_SECRET` | (Opcional) Uma senha qualquer em texto para proteger o endpoint de carrinho abandonado |

3. Salve e volte para a aba **Deployments**.

### Passo 4: Fazer o primeiro deploy

1. Se ainda não fez o deploy: na tela do projeto, clique em **Deploy** (ou **Redeploy** no último deployment).
2. Espere terminar (1–3 minutos). Quando aparecer **Ready**, clique no link do deployment (ex.: `seu-projeto.vercel.app`).
3. Teste o site: home, collection, checkout (pode usar cartão de teste da Stripe). Confira se o admin (`/en/admin` ou `/es/admin`) abre e se o login funciona.

### Passo 5: Colocar seu domínio (Hostinger)

1. **Na Vercel:** no projeto → **Settings** → **Domains** → em "Add", digite seu domínio (ex.: `savjewelry.shop`) e depois `www.savjewelry.shop` → **Add**.
2. A Vercel vai mostrar o que falta (ex.: "Configure the following DNS records"). Anote:
   - Para o domínio raiz (`savjewelry.shop`): geralmente um registro **A** com valor `76.76.21.21` (confirme o valor que a Vercel mostrar).
   - Para `www`: um **CNAME** com valor `cname.vercel-dns.com`.
3. **Na Hostinger:** entre no painel → **Domínios** → clique no domínio → **DNS / Zona DNS** (ou **Gerenciar DNS**).
4. Crie os registros que a Vercel pediu:
   - **A**: Tipo A, Nome `@` (ou em branco), Aponta para / Valor: `76.76.21.21` (ou o que a Vercel indicar).
   - **CNAME**: Nome `www`, Aponta para / Target: `cname.vercel-dns.com`.
5. Salve e aguarde de 5 minutos a algumas horas (propagação). Na Vercel, em **Domains**, o status deve passar para **Valid** e o cadeado (HTTPS) será ativado automaticamente.
6. Depois de validar: em **Settings** → **Environment Variables**, edite `NEXT_PUBLIC_SITE_URL` e coloque `https://savjewelry.shop` (ou seu domínio) e faça um **Redeploy** para as mudanças valerem.

### Passo 6: (Opcional) Usar Cloudflare só para DNS

- Se quiser usar a Cloudflare: na Cloudflare adicione o site com o domínio, troque os **nameservers** do domínio na Hostinger para os que a Cloudflare der. Depois, na Cloudflare em **DNS**, crie os mesmos registros (A para `@` e CNAME para `www`) apontando para a Vercel como no passo 5. O resto do passo a passo continua igual.

---

## Por que Vercel?

- Next.js foi feito para rodar na Vercel; deploy em 1 clique a partir do GitHub.
- Plano gratuito inclui: HTTPS, cron (carrinho abandonado), serverless, variáveis de ambiente.
- Hostinger em modo “hospedagem compartilhada” não roda Next.js (precisa de Node.js); você teria que usar VPS e configurar tudo à mão.

---

## "Não dá para usar só Cloudflare + Hostinger, sem Vercel?"

- **Só Hostinger (plano compartilhado):** não. Esse plano é para PHP/sites estáticos; Next.js precisa de Node.js. Só funcionaria com um **VPS** na Hostinger (ou outro provedor), aí você instala Node, sobe o projeto e gerencia servidor, PM2, cron e HTTPS à mão.
- **Cloudflare Pages:** consegue hospedar Next.js com [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages), mas com limitações (nem todas as APIs do Node, cron diferente, etc.). Dá para usar, mas exige adaptar o projeto e o deploy.
- **Resumo:** o caminho mais simples para "tudo continuar funcionando como está" é **Vercel para o app** + **Hostinger só com o domínio** (e, se quiser, **Cloudflare só para DNS**). Você não paga hospedagem na Hostinger; só o domínio. A Vercel no plano gratuito já cobre o que o projeto usa.

---

## Passo a passo resumido

### 1. Comprar o domínio na Hostinger

- Compre o domínio (ex.: `seusite.com`) na Hostinger.
- Você **não** precisa contratar hospedagem de site na Hostinger só para o domínio; o site em si pode ficar na Vercel.

### 2. Subir o projeto na Vercel

1. Crie uma conta em [vercel.com](https://vercel.com) (pode usar “Login with GitHub”).
2. **Import** o repositório do projeto (conecte o GitHub e escolha o repo).
3. Nas **Environment Variables** do projeto na Vercel, adicione **todas** as variáveis do seu `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` (opcional)
   - `NEXT_PUBLIC_SITE_URL` (coloque a URL final, ex.: `https://seusite.com`)
   - `CRON_SECRET` (opcional, para proteger o endpoint de carrinho abandonado)
4. Faça o **Deploy**. A Vercel vai dar uma URL tipo `seu-projeto.vercel.app`.

### 3. Apontar o domínio para a Vercel

Você pode fazer de dois jeitos: **só com Hostinger** ou **usando Cloudflare**.

#### Opção A: DNS só na Hostinger

1. Na Vercel: no projeto → **Settings** → **Domains** → adicione `seusite.com` e `www.seusite.com`.
2. A Vercel vai mostrar os registros que você precisa (geralmente um **A** ou **CNAME**).
3. Na Hostinger: **Domínios** → seu domínio → **DNS / Nameservers** (ou **Zona DNS**).
4. Crie os registros que a Vercel pediu, por exemplo:
   - **A**: nome `@`, valor `76.76.21.21` (confirme na própria Vercel).
   - **CNAME**: nome `www`, valor `cname.vercel-dns.com`.
5. Aguarde a propagação (minutos a algumas horas). A Vercel ativa o HTTPS automaticamente.

#### Opção B: DNS na Cloudflare (recomendado se você já tem conta)

1. Na Cloudflare: **Add site** → digite `seusite.com` → plano **Free**.
2. A Cloudflare vai mostrar dois **nameservers** (ex.: `xxx.ns.cloudflare.com`).
3. Na Hostinger: no domínio, troque os **Nameservers** para os que a Cloudflare passou (em “Alterar nameservers” ou “DNS”).
4. Na Cloudflare, quando o domínio estiver ativo: **DNS** → **Records**:
   - **A**: nome `@`, IPv4 `76.76.21.21`, Proxy (nuvem laranja) **ligado** se quiser.
   - **CNAME**: nome `www`, target `cname.vercel-dns.com`, Proxy **ligado** se quiser.
5. Na Vercel: **Settings** → **Domains** → adicione `seusite.com` e `www.seusite.com`.
6. Depois que a Vercel validar, tudo (incluindo HTTPS) continua funcionando; o tráfego passa pela Cloudflare e depois para a Vercel.

### 4. Garantir que “tudo continua funcionando”

- **Stripe:** nas variáveis de ambiente da Vercel use as mesmas chaves (e no Stripe Dashboard adicione o domínio em “Allowed domains” se pedir).
- **Supabase:** não precisa mudar nada; o app já usa as URLs do Supabase.
- **Resend:** use o mesmo `RESEND_API_KEY` e, em produção, um `RESEND_FROM_EMAIL` de um domínio verificado no Resend.
- **Cron (carrinho abandonado):** no plano gratuito da Vercel o `vercel.json` já agenda o job; não precisa configurar nada extra.
- **NEXT_PUBLIC_SITE_URL:** em produção, defina como `https://seusite.com` (ou o domínio que você usar).

---

## Resumo rápido

| Onde        | O que fazer |
|------------|-------------|
| **Hostinger** | Comprar domínio; opcionalmente só alterar nameservers para a Cloudflare. |
| **Cloudflare** | (Opcional) Colocar DNS do domínio aqui e apontar A/CNAME para a Vercel. |
| **Vercel**  | Conectar GitHub, configurar env vars, deploy; adicionar domínio e seguir as instruções de DNS. |

Assim o site sobe na Vercel, o domínio da Hostinger aponta para ela (direto ou via Cloudflare), e tudo (pagamentos, e-mails, cron, Pixel, favicon) continua funcionando como está.
