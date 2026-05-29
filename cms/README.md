# CMS — Directus + PostgreSQL

Единый бэкенд проекта «Ромашка»: каталог, пользователи-дизайнеры, материалы, сделки,
RBAC и файловое хранилище. Схема и сиды задаются воспроизводимыми скриптами (REST API).

## Запуск

```bash
cp .env.example .env        # заполнить значения (локально можно оставить как есть)
docker compose up -d        # Postgres + Directus → http://localhost:8055
docker compose down         # остановить
```

Админка: `http://localhost:8055` — вход по `ADMIN_EMAIL` / `ADMIN_PASSWORD` из `.env`.
Используйте валидный e-mail с реальным TLD (Directus отклоняет `.local` при логине).

## Bootstrap контент-модели

Идемпотентные Node-скрипты (Node ≥ 20, читают `.env` через `--env-file`):

```bash
npm run schema      # коллекции, поля, связи (IMPLEMENTATION_PLAN §2)
npm run access      # роли/политики/permissions (Public, Designer)
npm run presets     # дефолтный Kanban-layout для deals (по полю status)
npm run seed        # сиды + тестовые дизайнеры и сделки
npm run bootstrap   # всё перечисленное по порядку
```

Повторный запуск безопасен (создаётся только отсутствующее).

### Тестовые учётные записи (после `seed`)
- Админ: `admin@romashka.ru` / `admin12345`
- Дизайнер 1: `designer@romashka.ru` / `designer123` (сделки 2026-001, 2026-002)
- Дизайнер 2: `designer2@romashka.ru` / `designer123` (сделка 2026-003)

Дизайнер видит **только свои** сделки (row-level: `deals.designer = $CURRENT_USER`).

## Схема (snapshot)

```bash
npm run snapshot    # выгрузка структуры в snapshot/snapshot.yaml
```

Применение на другом окружении (например, на проде):

```bash
docker compose exec directus npx directus schema apply --yes /directus/snapshot/snapshot.yaml
```

> Snapshot покрывает **только структуру** (коллекции/поля/связи). Роли, политики,
> permissions и данные восстанавливаются скриптами `access`/`seed`, а не snapshot'ом.

## Kanban для сделок

Колоночный Kanban — это layout-расширение из Marketplace (в ядре Directus его нет).
Папка `extensions/` смонтирована, а дефолтный preset коллекции `deals` уже настроен на
Kanban по полю `status`. Чтобы включить вид:

1. Settings → Marketplace → найти **Kanban (Advanced)** (`advanced-kanban-layout`) → Install.
2. Перезапустить контейнер: `docker compose restart directus`.

Пока расширение не установлено, `deals` показывается таблицей (без ошибок).
`extensions/` не коммитится (устанавливается в рантайме, как `node_modules`).

## Структура

```
cms/
├─ docker-compose.yml     # Postgres 16 (PostGIS) + Directus 11
├─ .env.example           # шаблон конфигурации (реальный .env — в .gitignore)
├─ scripts/               # bootstrap: schema / access / presets / seed + lib/client.mjs
├─ snapshot/snapshot.yaml # структура схемы (для schema apply)
├─ extensions/            # Marketplace-расширения (gitignored)
└─ uploads/, data/        # файлы Directus и том Postgres (gitignored)
```
