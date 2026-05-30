# Деплой «Ромашка» (прод)

Один VPS (РФ), Docker Compose, Nginx (reverse proxy + SSL). Web на основном
домене, Directus на поддомене `cms.<домен>`.

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
# заменить romashka.ru → ваш домен в nginx/conf.d/default.conf
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
     -d romashka.ru -d www.romashka.ru -d cms.romashka.ru
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
