# IMPLEMENTATION_PLAN.md

План реализации сайта-витрины ООО «Ромашка» (v1.1). Документ даёт Claude Code полную картину: архитектуру, модель данных, дизайн-систему и пошаговые фазы с критериями приёмки. Бизнес-требования — в `ТЗ.md`, правила работы — в `CLAUDE.md`.

---

## 0. Общая картина

**Два контура в одном приложении:**
1. **Публичный сайт-витрина** (SSG/ISR) — каталог, карточки, фабрики, инфо-страницы, формы.
2. **Личный кабинет дизайнера** (авторизованный, SSR) — материалы и сделки, доступ только к своим данным.

**Единый бэкенд — Directus:** каталог, пользователи, материалы, сделки; RBAC, файловое хранилище, админка для ручного ведения. Отдельной CRM нет.

**Поток данных:**
- Публичные страницы: Next.js при сборке/ISR забирает опубликованные данные из Directus (read-only public-роль или серверный токен) → статические страницы.
- Кабинет: дизайнер логинится (Directus auth) → токен в httpOnly-куки → запросы к Directus с его токеном → row-level права отдают только его данные.
- Лиды/подписки: форма → API route → запись в Directus → MAX + e-mail.

```
Браузер ──> Next.js (web) ──> Directus REST/GraphQL ──> PostgreSQL
                │                     │
                │                     └─ файлы (изображения, чертежи, материалы)
                ├─ /api/lead ──────> Directus(leads) + MAX + SMTP
                ├─ /api/subscribe ─> Directus(subscribers) + MAX + SMTP
                └─ /cabinet/* ─────> Directus auth (httpOnly cookie, row-level RBAC)
```

---

## 1. Архитектура и структура кода

```
repo/
├─ web/                          # Next.js (App Router) + TS + Tailwind
│  ├─ app/
│  │  ├─ (public)/
│  │  │  ├─ page.tsx                         # главная
│  │  │  ├─ catalog/page.tsx                 # все товары
│  │  │  ├─ catalog/[category]/page.tsx
│  │  │  ├─ catalog/[category]/[subcategory]/page.tsx
│  │  │  ├─ product/[slug]/page.tsx
│  │  │  ├─ factories/page.tsx
│  │  │  ├─ factories/[slug]/page.tsx
│  │  │  ├─ about/page.tsx
│  │  │  ├─ contacts/page.tsx
│  │  │  ├─ delivery/page.tsx
│  │  │  ├─ favorites/page.tsx
│  │  │  └─ privacy/page.tsx
│  │  ├─ cabinet/
│  │  │  ├─ login/page.tsx
│  │  │  ├─ page.tsx                         # дашборд
│  │  │  ├─ materials/page.tsx
│  │  │  ├─ deals/page.tsx
│  │  │  └─ deals/[id]/page.tsx
│  │  ├─ api/
│  │  │  ├─ lead/route.ts                    # приём заявок
│  │  │  ├─ subscribe/route.ts               # подписка (купон 5000 ₽)
│  │  │  └─ auth/                            # логин/логаут/refresh (прокси к Directus)
│  │  ├─ sitemap.ts
│  │  ├─ robots.ts
│  │  └─ layout.tsx
│  ├─ components/
│  ├─ lib/                       # directus, auth, max, mail, validation, seo
│  ├─ middleware.ts              # защита /cabinet/*
│  ├─ tailwind.config.ts         # дизайн-токены
│  └─ .env.example
├─ cms/
│  ├─ docker-compose.yml         # Postgres + Directus
│  ├─ snapshot/                  # схема Directus (collections/fields/relations/roles)
│  └─ seed/                      # сиды: категории, подкатегории, цвета, промо, usp, тест-данные
└─ docs/
   ├─ ТЗ.md
   └─ IMPLEMENTATION_PLAN.md
```

---

## 2. Контент-модель (Directus)

### `factories`
name, slug(uniq), logo(file), description(wysiwyg), website(опц.), sort, status.

### `categories`
name, slug(uniq), description, hero_image(file), sort, status. Сиды: Диваны, Кровати, Кресла, Тумбочки.

### `subcategories`
name, slug, **category** (M2O → categories), sort, status. Пример: Диваны → Угловые/Прямые/Двухместные/Трёхместные/Модульные/Кожаные. Заполняет заказчик.

### `menu_promos`
Промо-плитки в mega-menu. **category** (M2O → categories), title, image(file), link(string), sort, status. До 3 на категорию (Новинки / Хиты коллекции / Распродажа).

### `colors`
name, hex(string), sort. Свотчи.

### `products`
| Поле | Тип | Прим. |
|---|---|---|
| name | string | |
| slug | string | uniq |
| **sku** | string | артикул |
| category | M2O → categories | |
| subcategory | M2O → subcategories | nullable |
| factory | M2O → factories | |
| **price_from** | integer | цена «от», ₽ |
| short_description | text | для карточки в сетке |
| description | text (wysiwyg) | «Информация о товаре» |
| main_image | file | |
| gallery | files (M2M) | лента миниатюр карточки |
| frame | enum (single) | Массив/Металл/Фанера — для фильтра |
| upholstery | enum (multiple) | Букле/Жаккард/Лён/Натуральная кожа/Смесовая ткань/Шенилл |
| colors | M2M → colors | свотчи |
| **characteristics** | repeater (JSON) | список {label, value} — таблица «Материал изделия и уход» (Каркас, Обивка, Наполнение сиденья/спинки/подушек/подлокотников, Ножки, Уход…) |
| **sizes** | repeater (JSON) | список {label, width_cm, height_cm, depth_cm} — варианты размеров (кнопки) |
| **dimensions_images** | files (M2M) | чертежи для блока «Фактические размеры» |
| **lead_time_note** | string | срок изготовления (опц.; иначе дефолт из settings) |
| width_cm, height_cm, depth_cm | integer | габариты для фильтра «Размеры» |
| variants_count | integer | «Размеров доступно: N» (можно вычислять из sizes) |
| style | string/enum | опц., фильтр по стилю |
| is_bestseller, is_new, is_sale, in_stock | boolean | флаги (хиты/новинки/распродажа/в наличии) |
| sort, status | int, enum | published/draft |

### `reviews`
**product** (M2O → products), author_name, rating(int 1–5), text, status(published/draft), created_at. **Кураторские** (заводит/модерирует администратор). Public-роль: read только published. `aggregateRating` на карточке считается по опубликованным.

### `usp_messages`
text, icon(опц.), sort, status. Ротация в USP-баннере карточки товара («Персональный подбор обивки…»).

### `leads`
name, phone(required), email, message, product(M2O→products, nullable), selected_size(string, nullable), source_page(string), type(enum: callback/price_request/contact), status(enum: new/processed), created_at. Public: только **create**.

### `subscribers`
contact (e-mail или телефон), consent(boolean), source_page(string), created_at, **promo_code**(string, генерируется сервером), **promo_channel**(enum: email/max), **promo_sent_at**(datetime), **promo_status**(enum: issued/redeemed — администратор отмечает использование вручную). Public: только **create** (поля промокода заполняет сервер, не форма).

### `materials`
title, description, file(nullable), url(nullable), category(enum: прайсы/чертежи/фактуры/условия/маркетинг), sort, status. Designer: read опубликованных.

### `deals`
number, title, **designer**(M2O → directus_users), client_object, items(text), amount(int), **status**(enum: new/ordered/shipped/delivered/closed), commission_amount(int), commission_status(enum: accrued/ready_to_pay/paid), comment, attachments(files M2M), created_at, updated_at. Designer: read где `designer = $CURRENT_USER`. Admin: full. В админке — **Kanban-layout** по `status`.

### `showcase_scenes`
title, image(file), sort, status. До ~5 сцен для «Shop the look».

### `showcase_hotspots`
scene(M2O → showcase_scenes), product(M2O → products), pos_x(decimal, %), pos_y(decimal, %), sort. Название / цена «от» / ссылка берутся из связанного `product`.

### `site_settings` (singleton)
phone, email, work_hours, address, map_embed, messenger_max_link, social-ссылки, seo_default_title/description, hero-тексты, **dimensions_disclaimer** («Все изделия измерены вручную. Возможна незначительная погрешность 1–3 см»), **default_lead_time_note**, **promo_amount** (5000), **promo_code_prefix**, **promo_static_code** (опц., если используется единый код).

### Роли
- **Administrator** — full.
- **Designer** — read own `deals`, read `materials`, read/update own profile.
- **Public** — read published `products/categories/subcategories/menu_promos/factories/colors/reviews/usp_messages/showcase_*/site_settings`; create `leads`, `subscribers`. Больше ничего.

> Схему фиксировать как Directus **snapshot** в `cms/snapshot/` (`directus schema apply` на проде).

---

## 3. Дизайн-система

### Палитра (CSS-переменные / Tailwind theme)
| Токен | Назначение | Ориентир |
|---|---|---|
| `--bg-cream` | основной фон | `#F5F0E8` |
| `--ink` | основной текст | `#221E1A` |
| `--burgundy` | акцент, баннеры, выбранные кнопки | `#532529` |
| `--terracotta` | футер, CTA-кнопки, баннеры | `#9E5A33` |
| `--muted` | вторичный текст/линии | тёплый серый |

*(значения уточнить по брендбуку; референс — направление, не копирование.)*

### Типографика (подтверждено по CSS референса)
- Заголовки, логотип, цены: **Playfair Display** (serif), переменная `--font-playfair-display`. Кириллица.
- Текст, навигация, интерфейс, символ валюты: **Montserrat** (sans), переменная `--font-montserrat`. Кириллица.
- Подключение через `next/font/google` (оптимизация, без layout shift). Файлы шрифтов — из открытых источников, не копировать с референса.

### Ключевые компоненты
Header + **MegaMenu** (десктоп — выпадающая панель: подкатегории + промо-плитки; мобайл — вложенный аккордеон в бургере), Footer, AccentBanner, CategoryTile, ProductCard (сетка), **ProductGallery** (верт. миниатюры + основное фото + стрелка), **ProductSizeSelector** (кнопки размеров), **UspBanner** (ротация сообщений с точками), **SpecAccordion** (Материал/уход, Фактические размеры, Информация), **DimensionsBlock** (чертежи + дисклеймер), **RelatedProducts** («Рекомендуем также»), **ReviewsBlock** (рейтинг, список, сортировка, пустое состояние), FilterSidebar (+ мобильная панель), SortDropdown, Pagination, LeadFormModal, ConsentCheckbox, MessengerFab, Breadcrumbs, FavoriteButton, Map, CouponTab (фикс. вкладка слева), SubscribeSlideIn (выезжающая панель), **InteractiveScene** (основной просмотр + галерея 5 миниатюр) + **SceneHotspot** (пульсирующие маркеры).

---

## 4. Фазы реализации

> Каждая фаза заканчивается прогоном `lint`/`build` и осмысленным коммитом. Двигайся последовательно.

### Фаза 0. Подготовка
- [ ] Репозиторий и структура `web/ cms/ docs/`.
- [ ] `web`: Next.js (App Router, TS) + Tailwind + ESLint/Prettier.
- [ ] `cms`: `docker-compose.yml` (Postgres + Directus), поднять локально.
- [ ] `.env.example` со всеми плейсхолдерами (§6). Реальный `.env` — в `.gitignore`.
- **Приёмка:** оба сервиса стартуют локально; открывается дев-сайт и админка Directus.

### Фаза 1. Контент-модель в Directus
- [ ] Создать коллекции и поля из §2, связи (M2O/M2M), repeater-поля (`characteristics`, `sizes`).
- [ ] Роли Admin/Designer/Public и **row-level** права.
- [ ] Kanban-layout для `deals` по `status`.
- [ ] Сиды: 4 категории; подкатегории (хотя бы по дивану); базовые цвета; 1–2 `menu_promos`; пара `usp_messages`; `dimensions_disclaimer` и `default_lead_time_note` в settings; 3–5 тестовых товаров (с sku, sizes, characteristics, чертежами); 1 тестовый дизайнер с 1–2 сделками; 1–2 showcase-сцены с хотспотами; пара отзывов.
- [ ] Экспортировать schema snapshot в `cms/snapshot/`.
- **Приёмка:** в админке заводятся товар/подкатегория/материал/сделка/сцена/отзыв; тестовый дизайнер видит только свои сделки.

### Фаза 2. Каркас фронтенда, дизайн-система и mega-menu
- [ ] Tailwind-токены (палитра, отступы), подключение шрифтов `next/font/google`: **Playfair Display** (`--font-playfair-display`) и **Montserrat** (`--font-montserrat`).
- [ ] Глобальный layout, Header, Footer, типографика.
- [ ] **MegaMenu:** десктоп — выпадающая панель по наведению (заголовок категории + список подкатегорий слева, промо-плитки `menu_promos` справа, оверлей-затемнение); мобайл — вложенный аккордеон в бургере.
- [ ] UI-примитивы: кнопки, инпуты, модалка, чекбокс согласия, хлебные крошки.
- [ ] `lib/directus.ts` — клиент (привилегированный токен только на сервере).
- **Приёмка:** mega-menu открывается/закрывается корректно на десктопе и мобайле, ведёт на подкатегории и промо-ссылки; шрифты применяются; данные читаются на сервере.

### Фаза 3. Каталог и карточка товара
- [ ] `/catalog`, `/catalog/[category]`, `/catalog/[category]/[subcategory]`.
- [ ] FilterSidebar: в наличии, **фабрика**, **подкатегория**, каркас, обивка, цена (слайдер), цвета, размеры; «Сбросить/Применить». На мобиле — выезжающая панель.
- [ ] Сортировка (цена ↑/↓, новизна), пагинация, поиск.
- [ ] ProductCard (сетка): фото, имя, краткое описание, фабрика, «Размеров доступно: N», свотчи, **цена «от»**, избранное.
- [ ] Карточка товара `/product/[slug]`:
  - [ ] **ProductGallery** — верт. миниатюры + основное фото + стрелка прокрутки.
  - [ ] Крошки (категория › подкатегория › товар), название, избранное, рейтинг + «N отзывов», **артикул**, цена «от» (Playfair Display).
  - [ ] **ProductSizeSelector** — кнопки вариантов из `sizes`.
  - [ ] **UspBanner** — ротация `usp_messages` с точками.
  - [ ] CTA «Узнать цену» (открывает LeadFormModal с товаром и выбранным размером) + «Заказать звонок»/«Написать в MAX»; срок изготовления; ссылка на фабрику.
  - [ ] **SpecAccordion**: «Материал изделия и уход» (таблица из `characteristics`), «Фактические размеры» (`dimensions_images` + дисклеймер), «Информация о товаре» (`description`).
  - [ ] **RelatedProducts** «Рекомендуем также».
  - [ ] **ReviewsBlock**: рейтинг, список кураторских отзывов, сортировка, пустое состояние.
  - [ ] ISR + ревалидация; `next/image` везде.
- **Приёмка:** фильтры/сортировка/поиск/подкатегории работают; карточка полностью собрана (галерея, размеры, аккордеоны, отзывы); цена везде «от»; корзины нигде нет.

### Фаза 4. Главная, фабрики, инфо-страницы, избранное, виджеты
- [ ] Главная: hero, плитка категорий, лента новинок/бестселлеров, блок фабрик, «О компании» кратко, блок доставки, форма заявки, акцентные баннеры.
- [ ] **InteractiveScene «Shop the look»:** основной блок просмотра (фото + пульсирующие маркеры из `showcase_hotspots`, тултип: название, цена «от», «>», переход на товар) + **галерея 5 миниатюр** сцен (с точками); клик по миниатюре открывает сцену в основном блоке.
- [ ] `/factories`, `/factories/[slug]` (описание + ассортимент).
- [ ] `/about`, `/contacts` (карта + контакты из `site_settings`), `/delivery`, `/privacy`.
- [ ] Избранное (localStorage) + `/favorites`.
- [ ] MessengerFab (MAX).
- [ ] Виджет «Купон на скидку»: фиксированная вкладка у левого края (на всех публичных страницах) + выезжающая панель подписки в правом нижнем углу (2 части: фото 40% / текст+форма+кнопка 60%) с чекбоксом согласия. UI здесь; отправку — в Фазе 5.
- **Приёмка:** интерактивная сцена переключается по миниатюрам и ведёт на товары; публичные страницы наполняются из Directus; избранное переживает перезагрузку.

### Фаза 5. Лиды, подписки и уведомления
- [ ] LeadFormModal + формы (товарная заявка с `product` и `selected_size`, обратный звонок, контактная).
- [ ] `zod`-схемы (клиент+сервер), обязательное согласие 152-ФЗ, honeypot + rate limit.
- [ ] `POST /api/lead`: сохранить в Directus → MAX (`lib/max.ts`) → e-mail (`lib/mail.ts`); каждый канал в `try/catch`, лид не теряется.
- [ ] `POST /api/subscribe`: сохранить подписчика (+ согласие) → сгенерировать уникальный промокод 5000 ₽ (`lib/promo`) и записать в `subscribers` → доставить код подписчику: e-mail (`lib/mail`) при e-mail, либо MAX-уведомление по номеру (`lib/max`) при телефоне → уведомить администратора. Каждый канал в `try/catch`, запись не теряется. (Альтернатива: единый статический код из настроек.)
- [ ] Cookie-баннер.
- **Приёмка:** заявка/подписка сохраняются; при заданных ключах уходят в MAX и на почту; без ключей — не падают, запись всё равно в БД.

### Фаза 6. Личный кабинет дизайнера
- [ ] Авторизация через Directus (логин/логаут/refresh), токены в httpOnly-куки.
- [ ] `middleware.ts` защищает `/cabinet/*` (редирект на login).
- [ ] Дашборд: материалы + активные сделки.
- [ ] `/cabinet/materials` — список с группировкой.
- [ ] `/cabinet/deals` и `/cabinet/deals/[id]` — статусы сделки и вознаграждения (только чтение).
- [ ] Запросы к Directus от имени дизайнера → проверить недоступность чужих сделок.
- **Приёмка:** дизайнер видит только свои данные; неавторизованный редиректится; logout очищает сессию.

### Фаза 7. SEO и аналитика
- [ ] `generateMetadata` на всех страницах, OpenGraph/Twitter.
- [ ] JSON-LD: `Organization`/`LocalBusiness` (Барнаул, `areaServed` — Сибирь), `Product` (цена «от», `aggregateRating` при отзывах), `BreadcrumbList`.
- [ ] `sitemap.ts`, `robots.ts`.
- [ ] Яндекс.Метрика + код верификации Вебмастера (плейсхолдеры из env).
- **Приёмка:** валидная разметка; sitemap/robots отдаются; Метрика подключается при наличии ID.

### Фаза 8. Производительность, безопасность, деплой
- [ ] Lighthouse → «зелёная» зона Core Web Vitals (изображения/шрифты/скрипты).
- [ ] Проверка: секреты не утекают на клиент; админ-токен только серверный; куки httpOnly/secure.
- [ ] Прод: Nginx (reverse proxy, SSL), Docker Compose (Directus+Postgres), сборка/запуск Next.js.
- [ ] Бэкапы БД и файлов Directus.
- [ ] Чек-лист запуска (§7).
- **Приёмка:** прод-сборка работает; бэкапы настроены; чек-лист пройден.

---

## 5. Контракты ключевых модулей
- `lib/directus.ts` — фабрика клиента; серверный клиент с привилегированным токеном не импортируется в клиентские компоненты.
- `lib/max.ts` — отправка через MAX: `sendMaxNotification(text)` для уведомлений администратору (бот) и `sendMaxPhoneCode(phone, text)` для доставки промокода по номеру телефона (бизнес-уведомления MAX). Эндпоинт/ключи из env; no-op + лог, если не заданы.
- `lib/mail.ts` — `sendLeadEmail(payload)`: nodemailer/SMTP из env; no-op + лог, если SMTP не задан.
- `lib/auth.ts` — логин/refresh/логаут через Directus, httpOnly-куки.
- `lib/seo.ts` — метаданные и JSON-LD.
- `lib/validation.ts` — zod-схемы (заявки и подписка).
- `app/api/lead/route.ts` — приём заявок: `leads` + `lib/max` + `lib/mail`.
- `lib/promo.ts` — генерация уникального промокода (префикс из настроек + случайная часть), проверка уникальности.
- `app/api/subscribe/route.ts` — приём подписки: `subscribers` + генерация промокода (`lib/promo`) + доставка кода подписчику (e-mail через `lib/mail` или MAX по номеру через `lib/max`) + уведомление администратора.

---

## 6. Переменные окружения (`.env.example`)

```dotenv
# --- Site ---
NEXT_PUBLIC_SITE_URL=

# --- Directus ---
DIRECTUS_URL=
DIRECTUS_ADMIN_TOKEN=          # ТОЛЬКО сервер. Не отдавать на клиент.
DIRECTUS_PUBLIC_TOKEN=         # read-only public-роль (серверное чтение каталога)

# --- MAX Bot API (вводит заказчик) ---
MAX_BOT_TOKEN=                 # токен бота
MAX_ADMIN_CHAT_ID=             # получатель уведомлений
MAX_API_BASE=https://platform-api.max.ru
# Доставка промокода по номеру телефона (бизнес-уведомления MAX; конкретный метод уточнить по докам MAX для бизнеса)
MAX_NOTIFY_TOKEN=
MAX_NOTIFY_SENDER=

# --- E-mail (SMTP, резервный канал) ---
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
LEAD_EMAIL_TO=

# --- Аналитика (вводит заказчик) ---
NEXT_PUBLIC_YANDEX_METRICA_ID=
YANDEX_WEBMASTER_VERIFICATION=
```

> Все значения — **плейсхолдеры**. Код работает при пустых ключах: уведомления логируются как пропущенные, запись всегда сохраняется в БД.

---

## 7. Чек-лист запуска
- [ ] Данные компании в `site_settings` (телефон, e-mail, часы, дисклеймеры).
- [ ] Заполнен каталог (товары, фото, чертежи, артикулы, размеры, фабрики, подкатегории, промо-плитки меню).
- [ ] Заданы ключи MAX/SMTP/Метрики; проверена доставка тестовой заявки и подписки, включая выдачу промокода на e-mail и на телефон через MAX.
- [ ] Политика конфиденциальности и cookie-баннер; согласие 152-ФЗ обязательно в формах.
- [ ] SSL, бэкапы, sitemap/robots, Метрика и Вебмастер активны.
- [ ] Проверена изоляция данных дизайнеров (нельзя увидеть чужие сделки).
- [ ] Интерактивная сцена и mega-menu корректны на десктопе и мобайле.

---

## 8. Договорённости и дефолты
- Отзывы — кураторские (заводит/модерирует администратор); публичной регистрации нет. Публичные отзывы — отдельный скоуп при необходимости.
- Промокод 5000 ₽: уникальный код на подписчика, доставка на e-mail или на телефон через MAX; действует офлайн (предъявляется в салоне), администратор отмечает использование. Возможен единый статический код.
- Размерные варианты (`sizes`) — информационные; цена остаётся «от» (при необходимости можно добавить цену на вариант).
- Учётные записи дизайнеров заводит администратор; восстановление пароля — по согласованию.
- Контентом (каталог, материалы, сделки, сцены, отзывы) заказчик управляет сам через Directus.
- При неоднозначности — выбирать разумный дефолт, помечать решение и продолжать, не блокируясь.
