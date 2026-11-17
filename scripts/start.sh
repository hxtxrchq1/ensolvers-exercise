#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

check_command() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 no está instalado o no está disponible en PATH."
}

check_version() {
  local name=$1
  local actual=$2
  local minimum=$3

  if ! node - "$actual" "$minimum" <<'NODE'
const [actual, minimum] = process.argv.slice(2);
const parse = (value) => {
  const match = value.match(/\d+(?:\.\d+){0,2}/);
  return match ? match[0].split('.').map(Number) : null;
};
const current = parse(actual);
const required = parse(minimum);

if (!current || !required) process.exit(2);
for (let index = 0; index < required.length; index += 1) {
  const difference = (current[index] ?? 0) - (required[index] ?? 0);
  if (difference > 0) process.exit(0);
  if (difference < 0) process.exit(1);
}
process.exit(0);
NODE
  then
    fail "$name $actual no cumple la versión mínima $minimum."
  fi
}

check_command node
check_command npm
check_command docker

node_version=$(node --version) || fail "No se pudo consultar la versión de Node.js."
npm_version=$(npm --version) || fail "No se pudo consultar la versión de npm."
docker_version=$(docker --version) || fail "No se pudo consultar la versión de Docker."
compose_version=$(docker compose version) || fail "Docker Compose v2 no está disponible."

check_version "Node.js" "$node_version" "22.12.0"
check_version "npm" "$npm_version" "10.0.0"
check_version "Docker" "$docker_version" "24.0.0"
check_version "Docker Compose" "$compose_version" "2.20.0"

required_files=(
  ".env.example"
  "docker-compose.yml"
  "backend/.env.example"
  "backend/package.json"
  "backend/package-lock.json"
  "backend/prisma/schema.prisma"
  "frontend/.env.example"
  "frontend/package.json"
  "frontend/package-lock.json"
)

for file in "${required_files[@]}"; do
  [ -f "$ROOT_DIR/$file" ] || fail "Falta el archivo requerido: $file"
done

create_env_file() {
  local example=$1
  local target=$2

  if [ ! -e "$ROOT_DIR/$target" ]; then
    cp "$ROOT_DIR/$example" "$ROOT_DIR/$target"
    printf 'Creado %s desde %s.\n' "$target" "$example"
  fi
}

create_env_file ".env.example" ".env"
create_env_file "backend/.env.example" "backend/.env"
create_env_file "frontend/.env.example" "frontend/.env"

read_env_value() {
  local file=$1
  local key=$2
  local default_value=$3
  local value

  value=$(sed -n "s/^${key}=//p" "$ROOT_DIR/$file" | tail -n 1)
  printf '%s' "${value:-$default_value}"
}

if [ ! -x "$ROOT_DIR/backend/node_modules/.bin/nest" ]; then
  printf 'Instalando dependencias del backend...\n'
  (cd "$ROOT_DIR/backend" && npm ci)
fi

if [ ! -x "$ROOT_DIR/frontend/node_modules/.bin/vite" ]; then
  printf 'Instalando dependencias del frontend...\n'
  (cd "$ROOT_DIR/frontend" && npm ci)
fi

printf 'Generando Prisma Client...\n'
(cd "$ROOT_DIR/backend" && npm run prisma:generate)

printf 'Iniciando PostgreSQL y esperando su healthcheck...\n'
(cd "$ROOT_DIR" && docker compose up -d --wait --wait-timeout 60 database)

if [ -d "$ROOT_DIR/backend/prisma/migrations" ] &&
  [ -n "$(find "$ROOT_DIR/backend/prisma/migrations" -type f -name migration.sql -print)" ]; then
  printf 'Aplicando migraciones de Prisma...\n'
  (cd "$ROOT_DIR/backend" && npm run prisma:migrate)
else
  printf 'No hay migraciones de Prisma; se omite su ejecución.\n'
fi

backend_port=$(read_env_value "backend/.env" "PORT" "3000")
postgres_port=$(read_env_value ".env" "POSTGRES_PORT" "5432")
frontend_api_url=$(read_env_value "frontend/.env" "VITE_API_URL" "http://localhost:3000/api")

printf 'Backend: http://localhost:%s/api\n' "$backend_port"
printf 'Frontend: http://localhost:5173\n'
printf 'API configurada en el frontend: %s\n' "$frontend_api_url"
printf 'PostgreSQL: localhost:%s\n' "$postgres_port"

backend_pid=
frontend_pid=

stop_services() {
  for process_id in "$backend_pid" "$frontend_pid"; do
    if [ -n "$process_id" ] && kill -0 "$process_id" 2>/dev/null; then
      kill "$process_id" 2>/dev/null || true
    fi
  done

  for process_id in "$backend_pid" "$frontend_pid"; do
    if [ -n "$process_id" ]; then
      wait "$process_id" 2>/dev/null || true
    fi
  done
}

handle_signal() {
  stop_services
  exit 130
}

trap handle_signal INT TERM

(cd "$ROOT_DIR/backend" && npm run start:dev) &
backend_pid=$!
(cd "$ROOT_DIR/frontend" && npm run dev -- --host 0.0.0.0) &
frontend_pid=$!

while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$frontend_pid" 2>/dev/null; do
  sleep 1
done

if ! kill -0 "$backend_pid" 2>/dev/null; then
  printf 'El proceso del backend terminó inesperadamente.\n' >&2
fi
if ! kill -0 "$frontend_pid" 2>/dev/null; then
  printf 'El proceso del frontend terminó inesperadamente.\n' >&2
fi

stop_services
exit 1
