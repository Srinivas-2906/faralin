#!/usr/bin/env bash
# Wire Faralin Cloud Run services into the shared kaana-web load balancer (34.36.130.96)
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-kaana-prod}"
REGION="${REGION:-asia-south1}"
URL_MAP="${URL_MAP:-kaana-web-map-multi}"
HTTPS_PROXY="${HTTPS_PROXY:-kaana-web-https-proxy-classic}"
LB_IP="${LB_IP:-34.36.130.96}"

gcloud config set project "${PROJECT_ID}" >/dev/null

create_neg_backend() {
  local name="$1" service="$2"
  gcloud compute network-endpoint-groups describe "${name}-neg" --region "${REGION}" >/dev/null 2>&1 || \
    gcloud compute network-endpoint-groups create "${name}-neg" \
      --region "${REGION}" --network-endpoint-type=serverless --cloud-run-service="${service}"
  gcloud compute backend-services describe "${name}-backend" --global >/dev/null 2>&1 || \
    gcloud compute backend-services create "${name}-backend" --global --load-balancing-scheme=EXTERNAL
  gcloud compute backend-services add-backend "${name}-backend" --global \
    --network-endpoint-group="${name}-neg" --network-endpoint-group-region="${REGION}" >/dev/null 2>&1 || true
}

create_neg_backend "faralin-web" "faralin-web"
create_neg_backend "faralin-api" "faralin-api"
create_neg_backend "faralin-university" "faralin-university"

gcloud compute url-maps add-path-matcher "${URL_MAP}" \
  --path-matcher-name=faralin-web --default-service=faralin-web-backend \
  --new-hosts=faralin.kaana.in >/dev/null 2>&1 || true

gcloud compute url-maps add-path-matcher "${URL_MAP}" \
  --path-matcher-name=faralin-api --default-service=faralin-api-backend \
  --new-hosts=api.faralin.kaana.in >/dev/null 2>&1 || true

gcloud compute url-maps add-path-matcher "${URL_MAP}" \
  --path-matcher-name=faralin-university --default-service=faralin-university-backend \
  --new-hosts=university.faralin.kaana.in >/dev/null 2>&1 || true

gcloud compute ssl-certificates describe faralin-cert-v2 --global >/dev/null 2>&1 || \
  gcloud compute ssl-certificates create faralin-cert-v2 \
    --domains=faralin.kaana.in,api.faralin.kaana.in,university.faralin.kaana.in --global

gcloud compute target-https-proxies update "${HTTPS_PROXY}" --global \
  --ssl-certificates=kaana-all-cert,faralin-cert-v2,kaana-tracker-cert,ajitdentalclinic-cert,kaana-clinic-cert,dentacare-cert,aquafarm-cert,kaana-menu-cert

echo ""
echo "Load balancer configured."
echo "Add this DNS record at your kaana.in DNS provider:"
echo "  Type: A"
echo "  Name: university.faralin"
echo "  Value: ${LB_IP}"
echo "  TTL: 300"
echo ""
echo "SSL cert status:"
gcloud compute ssl-certificates describe faralin-cert-v2 --global \
  --format='yaml(managed.status,managed.domainStatus)'
