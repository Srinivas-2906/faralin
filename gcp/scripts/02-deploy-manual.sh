#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
REGION="${REGION:-asia-south1}"
AR_REPO="${AR_REPO:-apps}"
SERVICE_NAME="${SERVICE_NAME:-}"
DOCKERFILE="${DOCKERFILE:-Dockerfile}"
PORT="${PORT:-8080}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "PROJECT_ID is not set and gcloud project is not configured."
  echo "Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

if [[ -z "${SERVICE_NAME}" ]]; then
  echo "SERVICE_NAME is required."
  echo "Example: export SERVICE_NAME=my-service"
  exit 1
fi

if [[ ! -f "${DOCKERFILE}" ]]; then
  echo "Dockerfile not found: ${DOCKERFILE}"
  exit 1
fi

IMAGE_BASE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE_NAME}"

TAG="${TAG:-}"
if [[ -z "${TAG}" ]]; then
  if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    TAG="$(git rev-parse --short HEAD)"
  else
    TAG="$(date +%Y%m%d-%H%M%S)"
  fi
fi

echo "Project:  ${PROJECT_ID}"
echo "Region:   ${REGION}"
echo "Service:  ${SERVICE_NAME}"
echo "Image:    ${IMAGE_BASE}:${TAG}"
echo "Dockerfile: ${DOCKERFILE}"
echo "Port:     ${PORT}"

echo "Submitting Docker build to Cloud Build..."
gcloud builds submit \
  --project "${PROJECT_ID}" \
  --tag "${IMAGE_BASE}:${TAG}" \
  --timeout "20m" \
  .

echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --image "${IMAGE_BASE}:${TAG}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port "${PORT}" \
  --min-instances 0 \
  --max-instances 5 \
  --memory 512Mi \
  --cpu 1

echo "Deploy complete."

