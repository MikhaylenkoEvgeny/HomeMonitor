#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/homemonitor-ruview}"
RUVIEW_IMAGE="${RUVIEW_IMAGE:-ruvnet/wifi-densepose}"
RUVIEW_TAG="${RUVIEW_TAG:-latest}"
CSI_SOURCE="${CSI_SOURCE:-simulated}"
RUST_LOG="${RUST_LOG:-info}"
PUBLIC_HTTP_PORT="${PUBLIC_HTTP_PORT:-80}"
ESP32_UDP_PORT="${ESP32_UDP_PORT:-5005}"
HOMEMONITOR_BASIC_AUTH="${HOMEMONITOR_BASIC_AUTH:-1}"
HOMEMONITOR_BASIC_AUTH_USER="${HOMEMONITOR_BASIC_AUTH_USER:-admin}"
HOMEMONITOR_BASIC_AUTH_PASSWORD="${HOMEMONITOR_BASIC_AUTH_PASSWORD:-}"
RUVIEW_API_TOKEN="${RUVIEW_API_TOKEN:-}"
HOMEMONITOR_PUBLIC_HOST="${HOMEMONITOR_PUBLIC_HOST:-}"
SENSING_ALLOWED_HOSTS="${SENSING_ALLOWED_HOSTS:-}"
HOMEMONITOR_RAW_BASE="${HOMEMONITOR_RAW_BASE:-https://raw.githubusercontent.com/MikhaylenkoEvgeny/HomeMonitor/main}"

if [ "${EUID}" -ne 0 ]; then
  echo "Please run this installer with sudo/root, for example:"
  echo "  curl -fsSL https://raw.githubusercontent.com/MikhaylenkoEvgeny/HomeMonitor/main/scripts/install-ruview-vm.sh | sudo bash"
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  apt-get update
  apt-get install -y curl ca-certificates
fi

install_docker() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    return
  fi

  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
}

random_password() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 24 | tr -d '\n'
  else
    tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32
  fi
}

detect_public_ip() {
  curl -fsS --max-time 3 https://ifconfig.me 2>/dev/null \
    || curl -fsS --max-time 3 https://api.ipify.org 2>/dev/null \
    || hostname -I 2>/dev/null | awk '{print $1}' \
    || echo "<VM_PUBLIC_IP>"
}

fetch_repo_file() {
  local path="$1"
  local url="${HOMEMONITOR_RAW_BASE%/}/${path}"

  if [ -n "${GITHUB_TOKEN:-}" ]; then
    curl -fsSL -H "Authorization: Bearer ${GITHUB_TOKEN}" "${url}"
  else
    curl -fsSL "${url}"
  fi
}

download_overlay_file() {
  local source_path="$1"
  local target_path="$2"

  if ! fetch_repo_file "${source_path}" > "${target_path}"; then
    echo "Failed to download ${source_path}." >&2
    echo "If this repository is private, rerun with GITHUB_TOKEN and sudo -E." >&2
    exit 1
  fi
}

inject_i18n_script() {
  local page_path="$1"

  if [ -f "${page_path}" ] && ! grep -q './utils/i18n.js' "${page_path}"; then
    sed -i 's#</body>#  <script type="module" src="./utils/i18n.js"></script>\n</body>#' "${page_path}"
  fi
}

prepare_ruview_ui() {
  echo "Preparing Russian RuView UI overlay..."

  rm -rf ui
  mkdir -p ui

  local container_id
  container_id="$(docker create "${RUVIEW_IMAGE}:${RUVIEW_TAG}")"
  docker cp "${container_id}:/app/ui/." ui/
  docker rm "${container_id}" >/dev/null

  mkdir -p ui/utils
  download_overlay_file "deploy/ruview-vm/ui-overrides/i18n.js" "ui/utils/i18n.js"
  download_overlay_file "deploy/ruview-vm/ui-overrides/sw.js" "ui/sw.js"

  inject_i18n_script "ui/observatory.html"
  inject_i18n_script "ui/pose-fusion.html"
  inject_i18n_script "ui/viz.html"
}

install_docker

mkdir -p "${INSTALL_DIR}/data/models" "${INSTALL_DIR}/data/state" "${INSTALL_DIR}/data/recordings"
cd "${INSTALL_DIR}"

DETECTED_PUBLIC_IP="$(detect_public_ip)"
PUBLIC_HOST="${HOMEMONITOR_PUBLIC_HOST:-${DETECTED_PUBLIC_IP}}"
if [ -z "${SENSING_ALLOWED_HOSTS}" ]; then
  SENSING_ALLOWED_HOSTS="localhost,localhost:3000,localhost:3001,127.0.0.1,127.0.0.1:3000,127.0.0.1:3001,ruview,ruview:3000,ruview:3001,${PUBLIC_HOST},${PUBLIC_HOST}:${PUBLIC_HTTP_PORT}"
fi

if [ "${HOMEMONITOR_BASIC_AUTH}" = "1" ]; then
  if [ -z "${HOMEMONITOR_BASIC_AUTH_PASSWORD}" ]; then
    HOMEMONITOR_BASIC_AUTH_PASSWORD="$(random_password)"
  fi

  echo "Creating Caddy basic-auth hash..."
  docker pull caddy:2.8 >/dev/null
  BASIC_AUTH_HASH="$(
    docker run --rm caddy:2.8 caddy hash-password --plaintext "${HOMEMONITOR_BASIC_AUTH_PASSWORD}"
  )"
  BASIC_AUTH_BLOCK="basic_auth {
    ${HOMEMONITOR_BASIC_AUTH_USER} ${BASIC_AUTH_HASH}
  }"
else
  BASIC_AUTH_BLOCK=""
fi

cat > Caddyfile <<EOF_CADDY
:80 {
  encode gzip zstd
  header /ui/* Cache-Control "no-store"

  ${BASIC_AUTH_BLOCK}

  rewrite / /ui/index.html
  redir /observatory /ui/observatory.html 302
  redir /pose-fusion /ui/pose-fusion.html 302
  redir /viz /ui/viz.html 302

  @sensing_ws path /ws/sensing*
  reverse_proxy @sensing_ws ruview:3001 {
    header_up Host ruview:3001
  }

  reverse_proxy ruview:3000 {
    header_up Host ruview:3000
  }
}
EOF_CADDY

cat > .env <<EOF_ENV
RUVIEW_IMAGE=${RUVIEW_IMAGE}
RUVIEW_TAG=${RUVIEW_TAG}
CSI_SOURCE=${CSI_SOURCE}
RUST_LOG=${RUST_LOG}
PUBLIC_HTTP_PORT=${PUBLIC_HTTP_PORT}
ESP32_UDP_PORT=${ESP32_UDP_PORT}
RUVIEW_API_TOKEN=${RUVIEW_API_TOKEN}
SENSING_ALLOWED_HOSTS=${SENSING_ALLOWED_HOSTS}
EOF_ENV

cat > docker-compose.yml <<'EOF_COMPOSE'
services:
  caddy:
    image: caddy:2.8
    restart: unless-stopped
    ports:
      - "${PUBLIC_HTTP_PORT:-80}:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - ruview

  ruview:
    image: "${RUVIEW_IMAGE:-ruvnet/wifi-densepose}:${RUVIEW_TAG:-latest}"
    restart: unless-stopped
    environment:
      CSI_SOURCE: "${CSI_SOURCE:-simulated}"
      MODELS_DIR: "/app/data/models"
      RUST_LOG: "${RUST_LOG:-info}"
      RUVIEW_API_TOKEN: "${RUVIEW_API_TOKEN:-}"
      SENSING_ALLOWED_HOSTS: "${SENSING_ALLOWED_HOSTS:-localhost,localhost:3000,localhost:3001,127.0.0.1,127.0.0.1:3000,127.0.0.1:3001,ruview,ruview:3000,ruview:3001}"
    expose:
      - "3000"
      - "3001"
    ports:
      - "${ESP32_UDP_PORT:-5005}:5005/udp"
    volumes:
      - ./ui:/app/ui:ro
      - ./data:/app/data

volumes:
  caddy_data:
  caddy_config:
EOF_COMPOSE

echo "Pulling RuView image..."
docker compose pull
prepare_ruview_ui
docker compose up -d

if command -v ufw >/dev/null 2>&1; then
  ufw allow "${PUBLIC_HTTP_PORT}/tcp" >/dev/null || true
  ufw allow "${ESP32_UDP_PORT}/udp" >/dev/null || true
fi

PUBLIC_IP="${DETECTED_PUBLIC_IP}"
if [ "${PUBLIC_HTTP_PORT}" = "80" ]; then
  PUBLIC_URL="http://${PUBLIC_HOST}/"
else
  PUBLIC_URL="http://${PUBLIC_HOST}:${PUBLIC_HTTP_PORT}/"
fi

cat <<EOF_DONE

RuView is running.

URL:
  ${PUBLIC_URL}

Local files:
  ${INSTALL_DIR}

Commands:
  cd ${INSTALL_DIR} && docker compose ps
  cd ${INSTALL_DIR} && docker compose logs -f ruview
  cd ${INSTALL_DIR} && docker compose pull && docker compose up -d

CSI source:
  ${CSI_SOURCE}

RuView allowed hosts:
  ${SENSING_ALLOWED_HOSTS}

EOF_DONE

if [ "${HOMEMONITOR_BASIC_AUTH}" = "1" ]; then
  cat <<EOF_AUTH
Basic auth:
  username: ${HOMEMONITOR_BASIC_AUTH_USER}
  password: ${HOMEMONITOR_BASIC_AUTH_PASSWORD}

Save this password now. It is not printed by Docker later.

EOF_AUTH
fi

cat <<EOF_PORTS
Yandex Cloud security group:
  open TCP ${PUBLIC_HTTP_PORT}
  open UDP ${ESP32_UDP_PORT} later, when ESP32 starts streaming CSI

EOF_PORTS
