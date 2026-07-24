#!/usr/bin/env bash
# Wire Faralin Cloud Run services into the shared kaana-web load balancer (34.36.130.96)
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-kaana-prod}"
REGION="${REGION:-asia-south1}"
URL_MAP="${URL_MAP:-kaana-web-map-multi}"
HTTPS_PROXY="${HTTPS_PROXY:-kaana-web-https-proxy-classic}"
LB_IP="${LB_IP:-34.36.130.96}"
FARALIN_CERT="${FARALIN_CERT:-faralin-cert-v3}"
FARALIN_DOMAINS="faralin.kaana.in,api.faralin.kaana.in,university.faralin.kaana.in,admin.faralin.kaana.in"

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
create_neg_backend "faralin-admin" "faralin-admin"

gcloud compute url-maps add-path-matcher "${URL_MAP}" \
  --path-matcher-name=faralin-web --default-service=faralin-web-backend \
  --new-hosts=faralin.kaana.in >/dev/null 2>&1 || true

gcloud compute url-maps add-path-matcher "${URL_MAP}" \
  --path-matcher-name=faralin-api --default-service=faralin-api-backend \
  --new-hosts=api.faralin.kaana.in >/dev/null 2>&1 || true

gcloud compute url-maps add-path-matcher "${URL_MAP}" \
  --path-matcher-name=faralin-university --default-service=faralin-university-backend \
  --new-hosts=university.faralin.kaana.in >/dev/null 2>&1 || true

gcloud compute url-maps add-path-matcher "${URL_MAP}" \
  --path-matcher-name=faralin-admin --default-service=faralin-admin-backend \
  --new-hosts=admin.faralin.kaana.in >/dev/null 2>&1 || true

# GCP managed certs cannot add SANs to an existing cert. When adding a hostname,
# create a new cert (e.g. faralin-cert-v3), attach it to the proxy, wait for
# ACTIVE, then remove the old cert. Project SSL cert quota is 10 — delete unused
# certs (e.g. legacy faralin-cert) before creating a replacement.
gcloud compute ssl-certificates describe "${FARALIN_CERT}" --global >/dev/null 2>&1 || \
  gcloud compute ssl-certificates create "${FARALIN_CERT}" \
    --domains="${FARALIN_DOMAINS}" --global

gcloud compute target-https-proxies update "${HTTPS_PROXY}" --global \
  --ssl-certificates=kaana-all-cert,${FARALIN_CERT},kaana-tracker-cert,ajitdentalclinic-cert,kaana-clinic-cert,dentacare-cert,aquafarm-cert,kaana-menu-cert

echo ""
echo "Load balancer configured."
echo "Add this DNS record at your kaana.in DNS provider:"
echo "  Type: A"
echo "  Name: university.faralin"
echo "  Value: ${LB_IP}"
echo "  TTL: 300"
echo ""
echo "  Type: A"
echo "  Name: admin.faralin"
echo "  Value: ${LB_IP}"
echo "  TTL: 300"
echo ""
echo "SSL cert status (${FARALIN_CERT}):"
gcloud compute ssl-certificates describe "${FARALIN_CERT}" --global \
  --format='yaml(managed.status,managed.domainStatus)'
