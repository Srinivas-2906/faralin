#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
REGION="${REGION:-asia-south1}"
AR_REPO="${AR_REPO:-apps}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "PROJECT_ID is not set and gcloud project is not configured."
  echo "Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Project: ${PROJECT_ID}"
echo "Region:  ${REGION}"
echo "AR repo: ${AR_REPO}"

echo "Enabling required APIs (safe to re-run)..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com

echo "Ensuring Artifact Registry Docker repo exists..."
if ! gcloud artifacts repositories describe "${AR_REPO}" --location "${REGION}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${AR_REPO}" \
    --repository-format docker \
    --location "${REGION}" \
    --description "Docker images"
fi

echo "Bootstrap complete."

