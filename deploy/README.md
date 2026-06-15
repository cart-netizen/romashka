# Деплой «Ромашка» (прод)

Один VPS (РФ), Docker Compose, Nginx (reverse proxy + SSL). Web на основном
домене, Directus на поддомене `cms.<домен>`.

## Быстрый старт: автоустановка (сервер с другими сайтами)

Если на сервере **уже есть другие сайты** (общий хостовый nginx) — используйте
автоустановщик. Он не поднимает свой nginx на 80/443, а вешает web+Directus на
localhost-порты и отдаёт готовый конфиг для хостового nginx.

```bash
cd deploy
sudo SITE_DOMAIN=paleron.ru CMS_DOMAIN=cms.paleron.ru \
     ADMIN_EMAIL=admin@paleron.ru \
     bash install.sh --with-nginx --with-ssl
```

Скрипт сам: ставит docker (если нет) → генерит секреты в `.env` → подбирает
свободные порты → создаёт папки данных Directus с правами `1000:1000` →
поднимает изолированный стек (`-p romashka`) → применяет схему + access/presets
→ пишет server-блок для хостового nginx (`deploy/nginx-host/<домен>.conf`),
проверяет `nginx -t` и выпускает SSL. Демо-контент — флагом `--with-seed`.

Дополнительно скрипт включает **автозапуск после ребута** (`systemctl enable docker`
+ `restart: always`) и **ежедневный бэкап** через `/etc/cron.d/romashka-backup`
(БД + файлы, по умолчанию 03:30, ротация 14 дней).

Флаги: `--with-seed`, `--with-nginx`, `--with-ssl`, `--skip-bootstrap`,
`--no-cron`, `--yes`. Время бэкапа — `BACKUP_HOUR`/`BACKUP_MIN`.
Без `--with-nginx` скрипт только сгенерит конфиг и подскажет команды подключения.

Файлы shared-режима: `docker-compose.shared.yml`, `install.sh`, `nginx-host/`.

---

## Ручной вариант (выделенный сервер, свой nginx-контейнер)

## Структура
```
deploy/
├─ docker-compose.prod.yml   # postgres + directus + web + nginx
├─ .env.example              # → скопировать в .env и заполнить
├─ nginx/conf.d/default.conf # reverse proxy + SSL (заменить домен!)
├─ nginx/certbot/            # ACME webroot + сертификаты (создаётся certbot)
├─ directus/                 # uploads / extensions / snapshot (тома Directus)
└─ backup.sh                 # бэкап БД + файлов
```

## Запуск
```bash
cp .env.example .env            # заполнить домены, секреты, ключи
# заменить paleron.ru → ваш домен в nginx/conf.d/default.conf
docker compose -f docker-compose.prod.yml up -d --build
```

Web-образ собирается без доступа к БД (данные подтянутся в рантайме через ISR).

## SSL (Let's Encrypt)
1. Временно поднимите только nginx с HTTP-блоком (ACME webroot
   `nginx/certbot/www`).
2. Выпустите сертификат:
   ```bash
   docker run --rm -v $PWD/nginx/certbot/conf:/etc/letsencrypt \
     -v $PWD/nginx/certbot/www:/var/www/certbot certbot/certbot certonly \
     --webroot -w /var/www/certbot \
     -d paleron.ru -d www.paleron.ru -d cms.paleron.ru
   ```
3. Перезапустите nginx: `docker compose -f docker-compose.prod.yml restart nginx`.
4. Автопродление — cron: `certbot renew` + `nginx -s reload`.

## Инициализация Directus
```bash
# применить схему
docker compose -f docker-compose.prod.yml exec directus \
  npx directus schema apply --yes /directus/snapshot/snapshot.yaml
# роли/политики/пресеты/сиды (из каталога cms, с DIRECTUS_URL=https://cms.<домен>)
cd ../cms && npm run access && npm run presets && npm run seed
```
Kanban-вид сделок — установить «Kanban (Advanced)» из Settings → Marketplace.

## Бэкапы
```bash
./backup.sh                     # разово
# cron (ежедневно 3:30):
30 3 * * * cd /opt/romashka/deploy && ./backup.sh >> /var/log/romashka-backup.log 2>&1
```

См. также `docs/LAUNCH_CHECKLIST.md`.
