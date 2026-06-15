#!/usr/bin/env bash
# =============================================================================
# install.sh — автоматическая установка проекта «Ромашка» на сервер,
# где УЖЕ ЕСТЬ другие сайты (общий хостовый nginx, чужие docker-стеки).
#
# Что делает:
#   1. Проверяет/ставит зависимости (docker, compose, openssl).
#   2. Готовит deploy/.env: автогенерация секретов, домены, свободные порты.
#   3. Создаёт папки данных Directus и выставляет права (uid 1000).
#   4. Поднимает изолированный docker-стек (имя проекта romashka),
#      web+Directus слушают ТОЛЬКО 127.0.0.1 — без конфликта по 80/443.
#   5. Применяет схему Directus + access + presets (+ опц. seed).
#   6. Генерирует конфиг для ХОСТОВОГО nginx (proxy на localhost-порты),
#      опционально включает его и выпускает SSL (certbot) — безопасно для
#      других сайтов (nginx -t перед reload).
#
# Использование:
#   sudo SITE_DOMAIN=paleron.ru CMS_DOMAIN=cms.paleron.ru \
#        ADMIN_EMAIL=admin@paleron.ru ./install.sh [флаги]
#
# Флаги:
#   --with-seed       залить демо-контент (по умолчанию НЕ заливается)
#   --with-nginx      установить server-блоки в хостовый nginx и reload
#   --with-ssl        выпустить Let's Encrypt сертификаты (требует --with-nginx)
#   --skip-bootstrap  не применять схему/доступы (только поднять контейнеры)
#   --yes             не задавать вопросов (CI); домены брать из env
# =============================================================================
set -euo pipefail

# ── параметры по умолчанию ───────────────────────────────────────────────────
PROJECT_NAME="romashka"
COMPOSE_FILE="docker-compose.shared.yml"
WITH_SEED=0; WITH_NGINX=0; WITH_SSL=0; SKIP_BOOTSTRAP=0; ASSUME_YES=0; NO_CRON=0
BACKUP_HOUR="${BACKUP_HOUR:-3}"; BACKUP_MIN="${BACKUP_MIN:-30}"

for arg in "$@"; do
  case "$arg" in
    --with-seed) WITH_SEED=1 ;;
    --with-nginx) WITH_NGINX=1 ;;
    --with-ssl) WITH_SSL=1 ;;
    --skip-bootstrap) SKIP_BOOTSTRAP=1 ;;
    --no-cron) NO_CRON=1 ;;
    --yes|-y) ASSUME_YES=1 ;;
    *) echo "Неизвестный флаг: $arg" >&2; exit 1 ;;
  esac
done
[ "$WITH_SSL" = 1 ] && WITH_NGINX=1

# ── пути ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
cd "$SCRIPT_DIR"

# Диагностика — ТОЛЬКО в stderr, чтобы не попадать в $(подстановку команд)
# (напр. write_nginx_conf возвращает путь через stdout).
log()  { printf '\033[1;32m[ ✓ ]\033[0m %s\n' "$*" >&2; }
info() { printf '\033[1;34m[ i ]\033[0m %s\n' "$*" >&2; }
warn() { printf '\033[1;33m[ ! ]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[ ✗ ]\033[0m %s\n' "$*" >&2; exit 1; }

SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"

# ── 1. зависимости ───────────────────────────────────────────────────────────
ensure_prereqs() {
  info "Проверяю зависимости…"
  command -v openssl >/dev/null || die "Нужен openssl (apt install openssl)."
  command -v curl    >/dev/null || die "Нужен curl (apt install curl)."

  if ! command -v docker >/dev/null; then
    warn "Docker не найден — устанавливаю официальным скриптом…"
    curl -fsSL https://get.docker.com | $SUDO sh
  fi
  if ! docker compose version >/dev/null 2>&1; then
    die "Нет docker compose plugin. Установите docker-compose-plugin."
  fi
  log "Docker $(docker --version | awk '{print $3}' | tr -d ',') готов."
}

# ── вспомогательные: правка .env ─────────────────────────────────────────────
# get_env KEY  → значение (с обрезкой обрамляющих пробелов)
get_env() {
  local v
  v=$(grep -E "^$1=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- || true)
  # срезаем ведущие/хвостовые пробелы (на случай кривого .env)
  v="${v#"${v%%[![:space:]]*}"}"; v="${v%"${v##*[![:space:]]}"}"
  printf '%s' "$v"
}
set_env() {
  local k="$1" v="$2"
  if grep -qE "^$k=" "$ENV_FILE" 2>/dev/null; then
    # экранируем разделитель/амперсанд для sed
    local esc; esc=$(printf '%s' "$v" | sed -e 's/[&|]/\\&/g')
    sed -i "s|^$k=.*|$k=$esc|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$k" "$v" >> "$ENV_FILE"
  fi
}
# заполнить KEY, если пусто/отсутствует/выглядит как комментарий-заглушка
fill_if_empty() {
  local cur; cur=$(get_env "$1")
  case "$cur" in
    "" | "#"*) set_env "$1" "$2" ;;   # пусто или начинается с # → считаем незаданным
  esac
}

# занят ли localhost-порт (учёт чужих docker-сайтов и любых слушателей)
port_in_use() {
  local p="$1"
  if command -v ss >/dev/null 2>&1; then
    # любой listener на этом порту (0.0.0.0:p, 127.0.0.1:p, [::]:p, *:p)
    ss -ltnH 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$p\$" && return 0
    return 1
  fi
  # фолбэк без ss: проба коннекта (docker-proxy/любой listener примет соединение)
  (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null && { exec 3>&- 3<&-; return 0; }
  return 1
}

# свободный localhost-порт начиная с базового (учёт чужих сервисов)
pick_port() {
  local p="$1" max=$(( $1 + 500 ))
  while [ "$p" -lt "$max" ]; do
    port_in_use "$p" || { echo "$p"; return 0; }
    p=$((p+1))
  done
  echo "$1"  # крайний случай: всё занято — вернём базовый
}

# ── 2. .env ──────────────────────────────────────────────────────────────────
prepare_env() {
  info "Готовлю .env…"
  [ -f "$ENV_FILE" ] || cp "$SCRIPT_DIR/.env.example" "$ENV_FILE"

  # домены (из env или интерактивно)
  local site_dom="${SITE_DOMAIN:-}" cms_dom="${CMS_DOMAIN:-}" admin_mail="${ADMIN_EMAIL:-}"
  if [ -z "$site_dom" ] && [ "$ASSUME_YES" = 0 ]; then
    read -rp "Домен сайта (напр. paleron.ru): " site_dom
  fi
  [ -n "$site_dom" ] && set_env SITE_URL "https://$site_dom"
  if [ -z "$cms_dom" ]; then
    [ -n "$site_dom" ] && cms_dom="cms.$site_dom"
    if [ -z "$cms_dom" ] && [ "$ASSUME_YES" = 0 ]; then read -rp "Домен Directus (напр. cms.paleron.ru): " cms_dom; fi
  fi
  [ -n "$cms_dom" ] && set_env DIRECTUS_PUBLIC_URL "https://$cms_dom"
  [ -n "$admin_mail" ] && set_env ADMIN_EMAIL "$admin_mail"

  # секреты — генерируем, только если пустые
  fill_if_empty DB_PASSWORD          "$(openssl rand -hex 24)"
  fill_if_empty DIRECTUS_KEY         "$(openssl rand -hex 32)"
  fill_if_empty DIRECTUS_SECRET      "$(openssl rand -hex 32)"
  fill_if_empty ADMIN_PASSWORD       "$(openssl rand -base64 18 | tr -d '/+=')"
  fill_if_empty DIRECTUS_ADMIN_TOKEN "$(openssl rand -hex 32)"

  # порты для localhost: ВСЕГДА проверяем занятость (на сервере с другими
  # сайтами дефолт из .env.example может быть занят чужим docker-контейнером).
  local web_port dir_port
  web_port=$(get_env WEB_PORT);      [ -z "$web_port" ] && web_port=8080
  dir_port=$(get_env DIRECTUS_PORT); [ -z "$dir_port" ] && dir_port=8055
  web_port=$(pick_port "$web_port")
  dir_port=$(pick_port "$dir_port")
  [ "$dir_port" = "$web_port" ] && dir_port=$(pick_port $((web_port + 1)))
  set_env WEB_PORT "$web_port"
  set_env DIRECTUS_PORT "$dir_port"

  chmod 600 "$ENV_FILE"
  log "Секреты заданы, порты: web=127.0.0.1:$web_port, directus=127.0.0.1:$dir_port"

  # критичная проверка: домены заданы
  case "$(get_env SITE_URL)" in *paleron.ru|"") warn "SITE_URL=$(get_env SITE_URL) — проверьте, что это ВАШ домен.";; esac
}

# ── 3. папки данных + права ──────────────────────────────────────────────────
prepare_dirs() {
  info "Создаю папки данных Directus и выставляю права…"
  local d="$SCRIPT_DIR/directus"
  mkdir -p "$d/uploads" "$d/extensions" "$d/snapshot" "$SCRIPT_DIR/nginx-host"
  # схему берём из cms/snapshot
  if [ -f "$PROJECT_ROOT/cms/snapshot/snapshot.yaml" ]; then
    cp "$PROJECT_ROOT/cms/snapshot/snapshot.yaml" "$d/snapshot/snapshot.yaml"
  else
    warn "Не найден cms/snapshot/snapshot.yaml — схему придётся применить вручную."
  fi
  # Directus в контейнере работает под пользователем node (uid/gid 1000):
  # тома uploads/extensions/snapshot должны принадлежать ему.
  $SUDO chown -R 1000:1000 "$d/uploads" "$d/extensions" "$d/snapshot"
  $SUDO chmod -R u=rwX,g=rX,o= "$d/uploads" "$d/extensions"
  chmod +x "$SCRIPT_DIR/backup.sh" 2>/dev/null || true
  log "Папки готовы: $d (owner 1000:1000)"
}

dc() { docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"; }

# ── 4. контейнеры ────────────────────────────────────────────────────────────
start_stack() {
  info "Собираю и поднимаю стек (project=$PROJECT_NAME)…"
  dc up -d --build
  info "Жду готовности Directus…"
  local port; port=$(get_env DIRECTUS_PORT)
  for i in $(seq 1 60); do
    if curl -fsS "http://127.0.0.1:$port/server/health" >/dev/null 2>&1; then
      log "Directus отвечает (127.0.0.1:$port)."; return 0
    fi
    sleep 3
  done
  die "Directus не поднялся за 180с. Логи: docker compose -p $PROJECT_NAME logs directus"
}

# ── 5. схема + доступы + (опц.) сиды ─────────────────────────────────────────
bootstrap_directus() {
  [ "$SKIP_BOOTSTRAP" = 1 ] && { warn "Пропускаю bootstrap (--skip-bootstrap)."; return 0; }
  info "Применяю схему Directus…"
  dc exec -T directus npx directus schema apply --yes /directus/snapshot/snapshot.yaml \
    || warn "schema apply вернул ошибку (возможно, уже применена)."

  # Самолечение креды: Directus применяет ADMIN_* из env только при ПЕРВОМ старте
  # на пустой БД. Если том БД остался от прежнего/упавшего запуска с другим
  # паролем — синхронизируем пароль администратора с текущим .env, иначе
  # bootstrap-логин ниже упадёт «Invalid user credentials».
  local am ap
  am=$(get_env ADMIN_EMAIL); ap=$(get_env ADMIN_PASSWORD)
  if [ -n "$am" ] && [ -n "$ap" ]; then
    if dc exec -T directus npx directus users passwd --email "$am" --password "$ap" </dev/null >/dev/null 2>&1; then
      log "Пароль администратора синхронизирован с .env."
    else
      warn "Синхронизация пароля админа пропущена (свежая БД или старый CLI — обычно это норм)."
    fi
  fi

  info "Настраиваю роли/политики/пресеты (access, presets)…"
  local net="${PROJECT_NAME}_default"
  local steps="node scripts/access.mjs && node scripts/presets.mjs"
  [ "$WITH_SEED" = 1 ] && steps="$steps && node scripts/seed.mjs"
  docker run --rm --network "$net" \
    -e DIRECTUS_URL="http://directus:8055" \
    -e ADMIN_EMAIL="$(get_env ADMIN_EMAIL)" \
    -e ADMIN_PASSWORD="$(get_env ADMIN_PASSWORD)" \
    -v "$PROJECT_ROOT/cms":/cms -w /cms \
    node:22-alpine sh -c \
    "npm install --no-audit --no-fund --silent >/dev/null 2>&1 || true; $steps" \
    || die "Ошибка bootstrap. Если выше 'Invalid user credentials' — БД осталась от прежнего запуска с другим паролем.
       Очистите БД ТОЛЬКО нашего стека и переустановите (чужие сайты не затрагиваются):
         docker compose -p $PROJECT_NAME -f $COMPOSE_FILE --env-file .env down -v
         sudo bash $0 <те же флаги>"
  if [ "$WITH_SEED" = 1 ]; then log "Directus инициализирован (с демо-контентом)."; else log "Directus инициализирован."; fi
}

# ── 6. хостовый nginx ────────────────────────────────────────────────────────
write_nginx_conf() {
  local site_dom cms_dom web_port dir_port out
  site_dom=$(get_env SITE_URL | sed 's#https\?://##'); cms_dom=$(get_env DIRECTUS_PUBLIC_URL | sed 's#https\?://##')
  web_port=$(get_env WEB_PORT); dir_port=$(get_env DIRECTUS_PORT)
  out="$SCRIPT_DIR/nginx-host/$site_dom.conf"

  cat > "$out" <<NGINX
# Сгенерировано install.sh для ХОСТОВОГО nginx. Сосуществует с другими сайтами.
# Проксирует домены на локальные порты docker-стека «$PROJECT_NAME».
# SSL добавит certbot --nginx (или подставьте свои сертификаты).

# --- Основной сайт (Next.js) ---
server {
    listen 80;
    listen [::]:80;
    server_name $site_dom www.$site_dom;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:$web_port;
        proxy_http_version 1.1;
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade           \$http_upgrade;
        proxy_set_header Connection        "upgrade";
    }
}

# --- Directus (CMS + файлы /assets) ---
server {
    listen 80;
    listen [::]:80;
    server_name $cms_dom;

    # большие загрузки фото/видео из админки
    client_max_body_size 512m;

    location / {
        proxy_pass http://127.0.0.1:$dir_port;
        proxy_http_version 1.1;
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade           \$http_upgrade;   # websockets (realtime)
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 600s;                              # длинные загрузки
    }
}
NGINX
  log "Конфиг nginx: $out"
  echo "$out"
}

install_nginx() {
  local conf="$1" site_dom cms_dom
  site_dom=$(get_env SITE_URL | sed 's#https\?://##'); cms_dom=$(get_env DIRECTUS_PUBLIC_URL | sed 's#https\?://##')
  command -v nginx >/dev/null || die "На хосте нет nginx. Уберите --with-nginx или установите nginx."

  if [ -d /etc/nginx/sites-available ]; then
    $SUDO cp "$conf" "/etc/nginx/sites-available/$site_dom.conf"
    $SUDO ln -sf "/etc/nginx/sites-available/$site_dom.conf" "/etc/nginx/sites-enabled/$site_dom.conf"
  else
    $SUDO cp "$conf" "/etc/nginx/conf.d/$site_dom.conf"
  fi
  info "Проверяю конфигурацию nginx (nginx -t) — не тронет другие сайты…"
  $SUDO nginx -t || die "nginx -t не прошёл. Файл не активирован корректно — проверьте вручную."
  $SUDO systemctl reload nginx || $SUDO nginx -s reload
  log "Хостовый nginx перезагружен."

  if [ "$WITH_SSL" = 1 ]; then
    # certbot + nginx-плагин (без плагина '--nginx' не работает)
    if ! command -v certbot >/dev/null; then
      info "Ставлю certbot + nginx-плагин…"
      $SUDO apt-get update -qq && $SUDO apt-get install -y -qq certbot python3-certbot-nginx \
        || die "Не удалось установить certbot. Установите вручную: apt install certbot python3-certbot-nginx"
    elif ! $SUDO certbot plugins 2>/dev/null | grep -q nginx; then
      info "Доставляю nginx-плагин certbot…"
      $SUDO apt-get update -qq && $SUDO apt-get install -y -qq python3-certbot-nginx \
        || warn "Не удалось доставить python3-certbot-nginx — выпустите сертификат вручную после установки плагина."
    fi
    info "Выпускаю SSL (Let's Encrypt) для доменов…"
    $SUDO certbot --nginx --non-interactive --agree-tos \
      -m "$(get_env ADMIN_EMAIL)" --redirect \
      -d "$site_dom" -d "www.$site_dom" -d "$cms_dom" \
      || warn "certbot не смог выпустить сертификат — проверьте: (1) установлен ли nginx-плагин, (2) A-записи доменов резолвятся на этот сервер (dig +short $site_dom www.$site_dom $cms_dom)."
  fi
}

# ── 7. cron-бэкап + автозапуск при перезагрузке ──────────────────────────────
setup_cron_and_autostart() {
  # Автоподнятие стека после ребута: контейнеры уже restart:always, нужно лишь
  # чтобы сам docker стартовал на загрузке.
  if command -v systemctl >/dev/null 2>&1; then
    $SUDO systemctl enable --now docker >/dev/null 2>&1 \
      && log "Docker включён в автозагрузку (стек поднимется после ребута)." \
      || warn "Не удалось systemctl enable docker — проверьте автозапуск вручную."
  else
    warn "systemd не найден — настройте автозапуск docker самостоятельно."
  fi

  [ "$NO_CRON" = 1 ] && { warn "Пропускаю настройку cron (--no-cron)."; return 0; }

  # Ежедневный бэкап БД+файлов через /etc/cron.d (идемпотентно).
  local cronfile="/etc/cron.d/${PROJECT_NAME}-backup"
  local logf="/var/log/${PROJECT_NAME}-backup.log"
  if [ -d /etc/cron.d ]; then
    $SUDO tee "$cronfile" >/dev/null <<CRON
# Бэкап «$PROJECT_NAME» (БД + файлы Directus). Сгенерировано install.sh.
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
$BACKUP_MIN $BACKUP_HOUR * * * root cd "$SCRIPT_DIR" && COMPOSE_FILE=$COMPOSE_FILE COMPOSE_PROJECT_NAME=$PROJECT_NAME ./backup.sh >> "$logf" 2>&1
CRON
    $SUDO chmod 644 "$cronfile"
    log "Cron-бэкап: ежедневно в $(printf '%02d:%02d' "$BACKUP_HOUR" "$BACKUP_MIN") → $logf"
  else
    warn "Нет /etc/cron.d — добавьте бэкап в crontab вручную (см. backup.sh)."
  fi
}

# ── финальный вывод ──────────────────────────────────────────────────────────
summary() {
  local nginx_conf="$1"
  echo
  log "Установка завершена."
  echo "──────────────────────────────────────────────────────────────────────"
  echo "  Сайт:     $(get_env SITE_URL)"
  echo "  Админка:  $(get_env DIRECTUS_PUBLIC_URL)/admin"
  echo "  Логин:    $(get_env ADMIN_EMAIL)"
  echo "  Пароль:   $(get_env ADMIN_PASSWORD)   ← сохраните и смените при желании"
  echo "  Локально: web 127.0.0.1:$(get_env WEB_PORT) · directus 127.0.0.1:$(get_env DIRECTUS_PORT)"
  echo "──────────────────────────────────────────────────────────────────────"
  if [ "$WITH_NGINX" = 0 ]; then
    echo "  Хостовый nginx НЕ настроен автоматически. Подключите вручную:"
    echo "    sudo cp $nginx_conf /etc/nginx/sites-available/"
    echo "    sudo ln -s /etc/nginx/sites-available/$(basename "$nginx_conf") /etc/nginx/sites-enabled/"
    echo "    sudo nginx -t && sudo systemctl reload nginx"
    echo "    sudo certbot --nginx -d <домены>"
  fi
  echo "  Управление:  docker compose -p $PROJECT_NAME -f $COMPOSE_FILE logs -f"
  if [ "$NO_CRON" = 1 ]; then
    echo "  Бэкапы:      $SCRIPT_DIR/backup.sh  (cron не настроен: --no-cron)"
  else
    echo "  Бэкапы:      ежедневно $(printf '%02d:%02d' "$BACKUP_HOUR" "$BACKUP_MIN") → /etc/cron.d/${PROJECT_NAME}-backup"
  fi
  echo "  Автозапуск:  стек поднимается после ребута (docker enabled + restart:always)"
  echo "  Наполнение:  docs/CONTENT_GUIDE.md"
  echo "──────────────────────────────────────────────────────────────────────"
  warn "ОБЯЗАТЕЛЬНЫЙ ручной шаг — сервисный токен Directus (иначе лиды/подписки"
  warn "пишутся через ограниченную public-роль, без промо-полей):"
  echo "    1. Войдите в $(get_env DIRECTUS_PUBLIC_URL)/admin"
  echo "    2. Создайте сервис-пользователя (НЕ админ): create leads+subscribers, read subscribers"
  echo "    3. Сгенерируйте ему статический Token, впишите в DIRECTUS_ADMIN_TOKEN в deploy/.env"
  echo "    4. Примените: docker compose -p $PROJECT_NAME -f $COMPOSE_FILE --env-file .env up -d web"
  echo "    Подробно: docs/DEPLOY_RUNBOOK.md (шаг 4)"
}

# ── main ─────────────────────────────────────────────────────────────────────
main() {
  ensure_prereqs
  prepare_env
  prepare_dirs
  start_stack
  bootstrap_directus
  local conf=""
  conf=$(write_nginx_conf)
  [ "$WITH_NGINX" = 1 ] && install_nginx "$conf"
  setup_cron_and_autostart
  summary "$conf"
}
main
