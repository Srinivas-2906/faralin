#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ROOT}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}"
  exit 1
fi

set -a
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line//$'\r'/}"
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  export "$key=$value"
done < "${ENV_FILE}"
set +a

bash "${ROOT}/gcp/scripts/03-secret-upsert.sh" faralin_clerk_secret_key "${CLERK_SECRET_KEY}"
bash "${ROOT}/gcp/scripts/03-secret-upsert.sh" faralin_clerk_publishable_key "${CLERK_PUBLISHABLE_KEY}"
bash "${ROOT}/gcp/scripts/03-secret-upsert.sh" faralin_clerk_webhook_secret "${CLERK_WEBHOOK_SECRET}"

echo "Clerk secrets synced."
