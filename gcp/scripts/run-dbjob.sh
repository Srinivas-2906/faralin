#!/usr/bin/env bash
set -euo pipefail

PROJECT=kaana-prod
REGION=asia-south1
JOB=faralin-dbjob
IMAGE=asia-south1-docker.pkg.dev/kaana-prod/kaana/faralin-dbjob:latest
CONN="$(gcloud sql instances describe faralin-pg --project "${PROJECT}" --format='value(connectionName)')"

gcloud run jobs update "${JOB}" \
  --project "${PROJECT}" \
  --region "${REGION}" \
  --image "${IMAGE}" \
  --add-cloudsql-instances "${CONN}" \
  --set-secrets "DATABASE_URL=faralin_database_url:latest"

gcloud run jobs execute "${JOB}" \
  --project "${PROJECT}" \
  --region "${REGION}" \
  --wait

echo "DB job completed successfully."
