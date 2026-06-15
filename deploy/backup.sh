#!/usr/bin/env bash
# Бэкап БД и файлов Directus. Запускать на хосте из каталога deploy/.
# Cron (ежедневно в 3:30):
#   30 3 * * * cd /opt/romashka/deploy && ./backup.sh >> /var/log/romashka-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
# Совместимо с обоими режимами: prod (свой nginx) и shared (общий хост-nginx).
# Переопределяется через env: COMPOSE_FILE, COMPOSE_PROJECT_NAME.
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
COMPOSE="docker compose ${COMPOSE_PROJECT_NAME:+-p $COMPOSE_PROJECT_NAME} -f $COMPOSE_FILE"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

# Загружаем переменные (DB_USER, DB_DATABASE)
set -a; [ -f .env ] && . ./.env; set +a

echo "[$(date)] Бэкап БД…"
$COMPOSE exec -T database pg_dump -U "$DB_USER" "$DB_DATABASE" | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"

echo "[$(date)] Бэкап файлов Directus…"
tar czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C ./directus uploads

echo "[$(date)] Ротация (старше $RETENTION_DAYS дней)…"
find "$BACKUP_DIR" -name 'db-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime +"$RETENTION_DAYS" -delete

echo "[$(date)] Готово: $BACKUP_DIR/db-$STAMP.sql.gz, uploads-$STAMP.tar.gz"
