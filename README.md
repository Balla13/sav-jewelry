# Joias — E-commerce de Joias de Luxo

Projeto em **Next.js 14** (App Router) com **Tailwind CSS**, **Lucide React** e **next-intl** para multi-idioma (Inglês e Espanhol).

## Estrutura

```
├── messages/           # Traduções (en.json, es.json)
├── src/
│   ├── app/
│   │   ├── [locale]/    # Rotas por idioma (/en, /es)
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx   # Layout raiz (fontes)
│   ├── components/
│   │   ├── Navbar.tsx   # Navbar + seletor de idioma
│   │   ├── Hero.tsx
│   │   └── FeaturedCollection.tsx
│   └── i18n/
│       ├── navigation.ts  # Link, useRouter, usePathname
│       ├── request.ts     # Config de mensagens por request
│       └── routing.ts     # Locales (en, es), defaultLocale
├── middleware.ts        # Detecção de idioma do navegador
└── next.config.mjs
```

## Como rodar

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). O middleware redireciona para `/en` ou `/es` conforme o idioma do navegador.

## Multi-idioma

- **Rotas:** `/en` (inglês) e `/es` (espanhol).
- **Detecção:** idioma do navegador via middleware (next-intl).
- **Seletor:** na Navbar (EN / ES) mantém a página atual ao trocar de idioma.

## Tecnologias

- Next.js 14 (App Router)
- Tailwind CSS
- next-intl (i18n)
- Lucide React (ícones)
- Fontes: Playfair Display (títulos), Inter (texto)
