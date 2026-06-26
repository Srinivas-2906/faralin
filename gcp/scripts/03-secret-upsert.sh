#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash gcp/scripts/03-secret-upsert.sh SECRET_NAME "secret-value"
#
# Safe to re-run: creates secret if missing, otherwise adds a new version.

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
NAME="${1:-}"
VALUE="${2:-}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "PROJECT_ID is not set and gcloud project is not configured."
  exit 1
fi

if [[ -z "${NAME}" || -z "${VALUE}" ]]; then
  echo "Usage: bash gcp/scripts/03-secret-upsert.sh SECRET_NAME \"secret-value\""
  exit 1
fi

if gcloud secrets describe "${NAME}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  printf "%s" "${VALUE}" | gcloud secrets versions add "${NAME}" --project "${PROJECT_ID}" --data-file=- >/dev/null
  echo "Added new version: ${NAME}"
else
  printf "%s" "${VALUE}" | gcloud secrets create "${NAME}" --project "${PROJECT_ID}" --replication-policy=automatic --data-file=- >/dev/null
  echo "Created secret: ${NAME}"
fi

