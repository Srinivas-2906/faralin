#!/usr/bin/env bash
# Deploy university portal + map university.faralin.kaana.in
#
# Prerequisites:
#   - gcloud CLI authenticated, project kaana-prod
#   - Code merged to main (or run from branch with cloudbuild.yaml changes)
#   - Clerk publishable key in Secret Manager (faralin_clerk_publishable_key)
#
# Usage:
#   # Option A — full monorepo deploy (web + university + api) via Cloud Build
#   gcloud builds submit --project kaana-prod --config gcp/cloudbuild.yaml .
#
#   # Option B — university service only (after first full deploy created secrets)
#   export PROJECT_ID=kaana-prod REGION=asia-south1
#   export SERVICE_NAME=faralin-university DOCKERFILE=Dockerfile.university
#   export AR_REPO=kaana
#   bash gcp/scripts/02-deploy-manual.sh
#
#   # Then map subdomain (Cloud Run custom domain OR load balancer):
#   export PROJECT_ID=kaana-prod REGION=asia-south1
#   export SERVICE_NAME=faralin-university ROOT_DOMAIN=faralin.kaana.in SUBDOMAIN=university
#   bash gcp/scripts/05-lb-subdomain.sh
#
# DNS (if using load balancer script): add A record
#   university.faralin.kaana.in -> IP printed by 05-lb-subdomain.sh
#
# DNS (if using Cloud Run domain mapping in Console):
#   university.faralin.kaana.in -> CNAME ghs.googlehosted.com (or value shown in Console)
#
# Clerk Dashboard:
#   Add https://university.faralin.kaana.in to allowed redirect URLs

set -euo pipefail

echo "See comments in gcp/scripts/06-university-portal.sh for deploy steps."
echo ""
echo "Quick check after deploy:"
echo "  gcloud run services describe faralin-university --region asia-south1 --format='value(status.url)'"
echo "  curl -I https://university.faralin.kaana.in/"
