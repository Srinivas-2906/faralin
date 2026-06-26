#!/usr/bin/env bash
set -euo pipefail

echo "Checking gcloud installation..."
if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud is not installed."
  echo "Install: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

echo "Checking login status..."
ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null || true)"
if [[ -z "${ACTIVE_ACCOUNT}" ]]; then
  echo "No active gcloud account found."
  echo "Run: gcloud auth login"
  exit 1
fi
echo "Active account: ${ACTIVE_ACCOUNT}"

echo "Checking project..."
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
if [[ -z "${PROJECT_ID}" ]]; then
  echo "No project set."
  echo "Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi
echo "Project: ${PROJECT_ID}"

echo "Checking permissions (basic API call)..."
gcloud projects describe "${PROJECT_ID}" --format='value(projectId)' >/dev/null

echo "OK: gcloud is ready."

