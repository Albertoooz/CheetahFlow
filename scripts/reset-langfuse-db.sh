#!/usr/bin/env bash
# Recreate only the Langfuse database inside the existing Postgres container.
#
# zsh: If you paste shell tips from chat, avoid bare "~10" (tilde+digit) — zsh treats
# that as "cd to Nth directory stack entry" and errors with "not enough directory stack entries".
# Requires: docker compose, repo root .env with POSTGRES_* (same as docker-compose).
#
# Usage (from repo root):
#   chmod +x scripts/reset-langfuse-db.sh
#   ./scripts/reset-langfuse-db.sh
#
# If you see "role ... does not exist", your postgres volume was initialized with
# a different POSTGRES_USER. Either fix .env to match the old user, or reset the
# volume (destructive): docker compose down && docker volume rm cheetahflow_postgres_data

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ -f .env ]; then
  # shellcheck disable=SC1091
  set -a && source .env && set +a
fi

PG_USER="${POSTGRES_USER:-cheetahflow}"
PG_PASS="${POSTGRES_PASSWORD:-cheetahflow}"
export PGPASSWORD="$PG_PASS"

echo "Waiting for postgres to accept connections..."
for _ in $(seq 1 60); do
  if docker compose exec -T postgres pg_isready -U "$PG_USER" -d postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker compose exec -T -e PGPASSWORD="$PG_PASS" postgres \
  psql -U "$PG_USER" -d postgres -c "SELECT 1" >/dev/null 2>&1; then
  echo "ERROR: cannot connect as PostgreSQL user '$PG_USER'."
  echo "The volume postgres_data was probably created earlier with a different POSTGRES_USER."
  echo "Destructive fix (wipes ALL Postgres data in this project):"
  echo "  docker compose --profile langfuse down"
  echo "  docker volume rm cheetahflow_postgres_data"
  echo "  docker compose up -d postgres && ./scripts/reset-langfuse-db.sh"
  exit 1
fi

echo "Recreating database langfuse as user $PG_USER..."
docker compose exec -T -e PGPASSWORD="$PG_PASS" postgres \
  psql -U "$PG_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'langfuse' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS langfuse;
CREATE DATABASE langfuse;
SQL

echo "Done. Restart Langfuse: docker compose --profile langfuse up -d --force-recreate langfuse-web langfuse-worker"
