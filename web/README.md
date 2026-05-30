# web — Next.js (фронтенд + API)

Публичный сайт-витрина и личный кабинет дизайнеров. Next.js 16 (App Router) +
TypeScript + Tailwind v4. Данные — из Directus (см. `../cms`).

## Разработка
```bash
npm install
npm run dev        # http://localhost:3000 (нужен запущенный Directus)
npm run lint
npm run typecheck
npm run build      # прод-сборка (standalone)
```
Конфигурация — `.env.local` (см. `.env.example`). Directus должен быть поднят:
`cd ../cms && docker compose up -d`.

## Структура
```
app/
├─ (public)/        # публичные страницы (Header/Footer/виджеты)
├─ cabinet/         # кабинет: login + (panel) + прокси файлов
├─ api/             # lead, subscribe
├─ layout.tsx       # шрифты, metadata, Метрика, cookie-баннер
├─ sitemap.ts, robots.ts
components/          # ui, layout, catalog, product, home, forms, widgets, cabinet
lib/                 # directus (чтение), directus-write, auth, cabinet, seo,
                     # validation, max, mail, promo, rate-limit, sanitize, …
middleware.ts        # защита /cabinet/*
```

## Ключевые моменты
- **Чтение каталога** — `lib/directus.ts` (server-only, fetch + ISR). Публичные
  read идут без токена. На этапе сборки бэкенд может быть недоступен — отдаётся
  fallback (страницы наполняются в рантайме).
- **Серверная запись** (лиды/подписки) — `lib/directus-write.ts` с
  `DIRECTUS_ADMIN_TOKEN` (только сервер). Каналы MAX/SMTP — no-op без ключей.
- **Кабинет** — Directus auth, httpOnly-куки, refresh в `middleware.ts`,
  row-level RBAC; приватные файлы — через прокси `/cabinet/file/[id]`.
- **Безопасность** — заголовки в `next.config.ts`; HSTS на Nginx (прод).

## Прод
Образ собирается из `web/Dockerfile` (standalone). Оркестрация — `../deploy`.
