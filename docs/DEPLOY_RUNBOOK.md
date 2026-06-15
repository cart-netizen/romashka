# Пошаговый деплой «Ромашка» (paleron.ru)

Боевой стек: Postgres + Directus 11 + Next.js (web) в Docker. Режим **shared** —
для сервера, где уже есть другие сайты (общий хостовый nginx, чужие docker-стеки).
web и Directus слушают только `127.0.0.1`, наружу их проксирует хостовый nginx.

> Внутреннее имя docker-проекта — `romashka` (метка контейнеров/томов/сети,
> на домен не влияет). Домен сайта — `paleron.ru`, Directus — `cms.paleron.ru`.

---

## 0. Предпосылки (до начала)

- VPS в **РФ** (152-ФЗ), Linux с systemd; root или sudo.
- На сервере допускается уже работающий **хостовый nginx** (порты 80/443 заняты им — это нормально, свой nginx мы не поднимаем).
- Установлены `curl`, `openssl` (есть почти везде). Docker установщик поставит сам при отсутствии.
- Доступ к DNS домена `paleron.ru` (нужно создать A-записи).
- Git-доступ к репозиторию `github.com/cart-netizen/romashka`.

---

## 1. DNS (делать заранее — нужно для SSL)

Создайте **три A-записи**, все на внешний IP сервера:

| Имя | Тип | Значение |
|---|---|---|
| `paleron.ru` | A | IP сервера |
| `www.paleron.ru` | A | IP сервера |
| `cms.paleron.ru` | A | IP сервера |

`www` обязателен: сертификат выпускается одной SAN-командой на все 3 домена — если у `www` нет записи, не выпустится **ни один**.

Проверка резолва **с самого сервера** (должны вернуть IP сервера):
```bash
dig +short paleron.ru www.paleron.ru cms.paleron.ru
```
Пока DNS не «прорезолвился» — не запускайте `--with-ssl` (см. шаг 3, вариант Б).

Firewall: открыты 80/443 наружу; **Postgres наружу не открывать**.

---

## 2. Получить код на сервер

```bash
sudo mkdir -p /opt/romashka && sudo chown "$USER" /opt/romashka
git clone https://github.com/cart-netizen/romashka.git /opt/romashka
cd /opt/romashka/deploy
```

> Пуш с сервера потом потребует отдельной авторизации GitHub (deploy-key или PAT) — для деплоя достаточно read-доступа на clone/pull.

---

## 3. Запуск установщика

Установщик идемпотентен и делает по порядку: проверка/установка Docker → генерация секретов в `deploy/.env` → подбор свободных localhost-портов → создание папок данных Directus с правами `1000:1000` → сборка и старт стека (`-p romashka`) → применение схемы + роли/доступы → (опц.) конфиг хостового nginx + SSL → cron-бэкап + автозапуск Docker.

### Вариант А — DNS уже готов (всё за один заход)
```bash
sudo SITE_DOMAIN=paleron.ru CMS_DOMAIN=cms.paleron.ru \
     ADMIN_EMAIL=admin@paleron.ru \
     bash install.sh --with-nginx --with-ssl
```

### Вариант Б — DNS ещё не «прорезолвился» (рекомендуется, два шага)
```bash
# 1) поднять по HTTP (поставит конфиг в хостовый nginx, проверит `nginx -t`)
sudo SITE_DOMAIN=paleron.ru CMS_DOMAIN=cms.paleron.ru \
     ADMIN_EMAIL=admin@paleron.ru \
     bash install.sh --with-nginx
# открыть http://paleron.ru и http://cms.paleron.ru — должны отвечать
# 2) когда dig подтвердил DNS — выпустить SSL:
sudo certbot --nginx --agree-tos -m admin@paleron.ru --redirect \
     -d paleron.ru -d www.paleron.ru -d cms.paleron.ru
```

### Флаги
| Флаг | Действие |
|---|---|
| `--with-nginx` | поставить server-блоки в хостовый nginx + reload (после `nginx -t`) |
| `--with-ssl` | выпустить Let's Encrypt (форсит `--with-nginx`) |
| `--with-seed` | залить **демо-контент** (для боевого запуска НЕ нужен) |
| `--skip-bootstrap` | только поднять контейнеры (без схемы/доступов) |
| `--no-cron` | не настраивать cron-бэкап |
| `--yes` | без вопросов (домены из env) |

Время бэкапа: `BACKUP_HOUR`/`BACKUP_MIN` (по умолчанию 03:30).

### В конце установщик напечатает (сохраните!)
- адрес сайта и админки `https://cms.paleron.ru/admin`
- `ADMIN_EMAIL` и **авто-сгенерированный `ADMIN_PASSWORD`** (показывается один раз)
- локальные порты web/directus

> ⚠ Пароль админа применяется Directus **только при первом старте на пустой БД**. Повторный запуск установщика его не меняет. Смена позже — `docker compose -p romashka -f docker-compose.shared.yml exec directus npx directus users passwd --email admin@paleron.ru --password '<новый>'`.

Без `--with-nginx` установщик лишь сгенерирует `deploy/nginx-host/paleron.ru.conf` и подскажет команды подключения вручную.

---

## 4. ⚠ ОБЯЗАТЕЛЬНЫЙ ручной шаг — сервисный токен Directus

Установщик кладёт в `.env` **случайный** `DIRECTUS_ADMIN_TOKEN`, но эта строка **не привязана** ни к одному пользователю Directus. С нашей правкой (`web/lib/directus-write.ts`) при невалидном токене заявка/подписка **больше не теряется** — код ловит 401/403 и сохраняет запись через ограниченную **public-роль**. НО при этом **не заполняются промо-поля** (промокод не записывается в `subscribers`, нет серверной проверки уникальности кода). Чтобы промо-механика работала полноценно, токен нужно сделать настоящим:

1. Войти в админку `https://cms.paleron.ru/admin` под `admin@paleron.ru` / пароль из шага 3.
2. **User Directory → Create User**: например `service@paleron.ru`. Роль — **не админ**, дать минимальные права: `create` для `leads` и `subscribers` + `read` для `subscribers` (нужно для проверки уникальности промокода).
3. В профиле этого пользователя — поле **Token** → сгенерировать, **скопировать** значение.
4. В `deploy/.env` заменить значение `DIRECTUS_ADMIN_TOKEN=` на этот токен (права файла оставить `600`).
5. Перечитать переменную в web:
   ```bash
   cd /opt/romashka/deploy
   docker compose -p romashka -f docker-compose.shared.yml --env-file .env up -d web
   ```
6. Проверить (шаг 6): тестовая заявка/подписка должны вернуть успех, промокод — выдаться.

> Быстрая альтернатива: вставить **уже сгенерированный** `hex` из `.env` в поле Token заведённого сервис-пользователя — тогда строка станет валидной без правки `.env`.

---

## 5. Что сделал bootstrap и чего не хватает

`install.sh` (без `--skip-bootstrap`) уже выполнил:
- **схему** (`directus schema apply` из `snapshot.yaml`) — только структура коллекций/полей/связей;
- **access** — роли/политики/permissions (Public read опубликованного каталога, Designer на свои сделки), публичная папка файлов;
- **presets** — Kanban-пресет для «Сделок».

Доустановить вручную в админке:
- **Kanban (Advanced)** из **Settings → Marketplace** (без него «Сделки» — обычный список), затем перезапустить Directus.

Демо-контент (`--with-seed`) для боевого запуска не нужен — наполняете реальными данными (шаг 7).

---

## 6. Приёмка (проверить перед открытием)

- `https://paleron.ru` открывается по HTTPS, редирект с http; `https://cms.paleron.ru/admin` — вход админа.
- **Картинки каталога** грузятся (next/image с `cms.paleron.ru`).
- **Заявка** и **подписка** с сайта: возвращают успех, доходят в MAX и на e-mail (если заданы ключи), **промокод выдаётся**; записи появились в `leads`/`subscribers` с промо-полями ⇒ значит шаг 4 сделан верно.
- **Изоляция дизайнеров**: чужая сделка → 404; приватные файлы — только через `/cabinet`.
- SEO: `/sitemap.xml`, `/robots.txt` отдаются; JSON-LD валиден (Google Rich Results); Метрика считает визиты.
- 152-ФЗ: чекбокс согласия в формах, cookie-баннер, политика конфиденциальности.

---

## 7. Наполнение контентом (порядок важен — связи)

В админке Directus, по `docs/CONTENT_GUIDE.md`, строго по порядку:
1. **Site Settings** (контакты, hero, тексты, `about_image`) → 2. **Категории** → 3. **Подкатегории** → 4. **Цвета** → 5. **Фабрики** → 6. **Товары** → 7. **Menu Promos / USP / Отзывы** → 8. **Shop the look** (сцены + хотспоты) → 9. **Материалы** → 10. **Дизайнеры** (пользователи, роль Designer, Active) → 11. **Сделки**.

Три правила:
- запись видна на сайте только при статусе **«Опубликовано»**;
- изменения появляются **в течение ~2 минут** (кэш/ISR — это нормально);
- **фото загружать в поле записи** (тогда файл попадает в публичную папку и отдаётся на сайте), а не вставлять внешней ссылкой; цена — числом в рублях (`189000` → «от 189 000 ₽»).

---

## 8. Эксплуатация

**Логи / статус:**
```bash
cd /opt/romashka/deploy
docker compose -p romashka -f docker-compose.shared.yml ps
docker compose -p romashka -f docker-compose.shared.yml logs -f
```

**Автозапуск после ребута** — уже настроен (`systemctl enable docker` + `restart: always`).

**Бэкапы** — cron `/etc/cron.d/romashka-backup` (БД + `directus/uploads`, ротация 14 дней, 03:30). Разово:
```bash
cd /opt/romashka/deploy
COMPOSE_FILE=docker-compose.shared.yml COMPOSE_PROJECT_NAME=romashka ./backup.sh
```
Восстановление обязательно проверить заранее (распаковать `db-*.sql.gz` + `uploads-*.tar.gz`).

**Обновление кода:**
```bash
cd /opt/romashka && git pull
cd deploy && docker compose -p romashka -f docker-compose.shared.yml --env-file .env up -d --build
```

**Смена домена (важно):** `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_DIRECTUS_URL` **запекаются в образ на сборке** (в т.ч. список хостов next/image). После правки доменов в `.env` нужна именно **пересборка**, не рестарт:
```bash
docker compose -p romashka -f docker-compose.shared.yml --env-file .env up -d --build web
```

---

## 9. Подводные камни (выверено по коду)

| # | Серьёзность | Суть | Что делать |
|---|---|---|---|
| 1 | 🟡 warning | Случайный `DIRECTUS_ADMIN_TOKEN` не привязан к пользователю. После фикса заявки **не теряются** (фолбэк на public-роль), но без промо-полей/проверки уникальности промокода | Шаг 4: завести сервис-пользователя, выписать токен, вписать в `.env`, `up -d web` |
| 2 | 🟡 warning | Пароль/почта админа применяются только при первом старте на пустой БД; авто-пароль показан один раз | Сохранить пароль; менять через `directus users passwd` в контейнере |
| 3 | 🟡 warning | Смена домена без пересборки оставляет старый домен и ломает картинки next/image | Менять домен только с `up -d --build web` |
| 4 | 🟡 warning | `--with-ssl` при неготовом DNS мягко не выпустит сертификат (сайт остаётся на HTTP); чужие сайты не страдают | Сначала `dig`, затем SSL; или вариант Б (два шага) |
| 5 | ⚪ note | Перенос/ручной деплой без `install.sh` не делает `chown 1000:1000` → ошибки записи файлов | При ручном `compose up` заранее `mkdir -p directus/{uploads,extensions,snapshot} && sudo chown -R 1000:1000 directus` |
| 6 | ✅ исправлено | `NEXT_PUBLIC_YANDEX_METRICA_ID` добавлен в `build.args` обоих compose и в `web/Dockerfile` | Задать `NEXT_PUBLIC_YANDEX_METRICA_ID` в `deploy/.env` **до** сборки; меняете позже — `up -d --build web` |

Не-проблемы (проверено, действий не требуют): путь снапшота и идемпотентность; сеть `romashka_default` и `npm install` для bootstrap (в `cms` нет зависимостей); права папок при штатном `install.sh`.
