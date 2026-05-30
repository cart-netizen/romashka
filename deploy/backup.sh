#!/usr/bin/env bash
# Бэкап БД и файлов Directus. Запускать на хосте из каталога deploy/.
# Cron (ежедневно в 3:30):
#   30 3 * * * cd /opt/romashka/deploy && ./backup.sh >> /var/log/romashka-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
COMPOSE="docker compose -f docker-compose.prod.yml"
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
