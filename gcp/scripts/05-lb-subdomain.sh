#!/usr/bin/env bash
set -euo pipefail

# This creates a dedicated HTTPS Load Balancer for ONE subdomain -> ONE Cloud Run service.
# It works even in regions where Cloud Run domain mappings are unavailable.
#
# Required env vars:
#   PROJECT_ID, REGION, SERVICE_NAME, ROOT_DOMAIN, SUBDOMAIN
#
# Optional:
#   LB_NAME (default: "${SERVICE_NAME}-lb")
#   LB_IP_NAME (default: "${SERVICE_NAME}-lb-ip")
#   LB_CERT_NAME (default: "${SERVICE_NAME}-cert")
#
# After running, add DNS A record:
#   ${SUBDOMAIN}.${ROOT_DOMAIN} -> printed IP

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
REGION="${REGION:-asia-south1}"
SERVICE_NAME="${SERVICE_NAME:-}"
ROOT_DOMAIN="${ROOT_DOMAIN:-}"
SUBDOMAIN="${SUBDOMAIN:-}"

if [[ -z "${PROJECT_ID}" || -z "${SERVICE_NAME}" || -z "${ROOT_DOMAIN}" || -z "${SUBDOMAIN}" ]]; then
  echo "Missing required env vars."
  echo "Set: PROJECT_ID REGION SERVICE_NAME ROOT_DOMAIN SUBDOMAIN"
  exit 1
fi

FULL_DOMAIN="${SUBDOMAIN}.${ROOT_DOMAIN}"

LB_NAME="${LB_NAME:-${SERVICE_NAME}-lb}"
LB_IP_NAME="${LB_IP_NAME:-${SERVICE_NAME}-lb-ip}"
LB_CERT_NAME="${LB_CERT_NAME:-${SERVICE_NAME}-cert}"

NEG_NAME="${LB_NAME}-neg"
BACKEND="${LB_NAME}-backend"
URLMAP="${LB_NAME}-map"
HTTPS_PROXY="${LB_NAME}-https-proxy"
HTTP_PROXY="${LB_NAME}-http-proxy"
FWD_HTTPS="${LB_NAME}-https-forwarding"
FWD_HTTP="${LB_NAME}-http-forwarding"

gcloud config set project "${PROJECT_ID}" >/dev/null

echo "Project: ${PROJECT_ID}"
echo "Region:  ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo "Domain:  ${FULL_DOMAIN}"
echo "LB:      ${LB_NAME}"

echo "Ensuring global static IP..."
gcloud compute addresses describe "${LB_IP_NAME}" --global >/dev/null 2>&1 || \
  gcloud compute addresses create "${LB_IP_NAME}" --global >/dev/null
LB_IP="$(gcloud compute addresses describe "${LB_IP_NAME}" --global --format='value(address)')"

echo "Ensuring serverless NEG..."
gcloud compute network-endpoint-groups describe "${NEG_NAME}" --region "${REGION}" >/dev/null 2>&1 || \
  gcloud compute network-endpoint-groups create "${NEG_NAME}" \
    --region "${REGION}" \
    --network-endpoint-type serverless \
    --cloud-run-service "${SERVICE_NAME}" >/dev/null

echo "Ensuring backend service..."
gcloud compute backend-services describe "${BACKEND}" --global >/dev/null 2>&1 || \
  gcloud compute backend-services create "${BACKEND}" --global --protocol=HTTP >/dev/null

echo "Attaching NEG to backend (idempotent)..."
gcloud compute backend-services add-backend "${BACKEND}" --global \
  --network-endpoint-group "${NEG_NAME}" \
  --network-endpoint-group-region "${REGION}" >/dev/null 2>&1 || true

echo "Ensuring URL map..."
gcloud compute url-maps describe "${URLMAP}" >/dev/null 2>&1 || \
  gcloud compute url-maps create "${URLMAP}" --default-service "${BACKEND}" >/dev/null

echo "Ensuring managed SSL certificate..."
gcloud compute ssl-certificates describe "${LB_CERT_NAME}" --global >/dev/null 2>&1 || \
  gcloud compute ssl-certificates create "${LB_CERT_NAME}" --global --domains "${FULL_DOMAIN}" >/dev/null

echo "Ensuring HTTPS proxy..."
gcloud compute target-https-proxies describe "${HTTPS_PROXY}" >/dev/null 2>&1 || \
  gcloud compute target-https-proxies create "${HTTPS_PROXY}" \
    --ssl-certificates "${LB_CERT_NAME}" \
    --url-map "${URLMAP}" >/dev/null

echo "Ensuring HTTP proxy..."
gcloud compute target-http-proxies describe "${HTTP_PROXY}" >/dev/null 2>&1 || \
  gcloud compute target-http-proxies create "${HTTP_PROXY}" --url-map "${URLMAP}" >/dev/null

echo "Ensuring forwarding rules..."
gcloud compute forwarding-rules describe "${FWD_HTTPS}" --global >/dev/null 2>&1 || \
  gcloud compute forwarding-rules create "${FWD_HTTPS}" \
    --global \
    --load-balancing-scheme=EXTERNAL \
    --address "${LB_IP_NAME}" \
    --target-https-proxy "${HTTPS_PROXY}" \
    --ports 443 >/dev/null

gcloud compute forwarding-rules describe "${FWD_HTTP}" --global >/dev/null 2>&1 || \
  gcloud compute forwarding-rules create "${FWD_HTTP}" \
    --global \
    --load-balancing-scheme=EXTERNAL \
    --address "${LB_IP_NAME}" \
    --target-http-proxy "${HTTP_PROXY}" \
    --ports 80 >/dev/null

echo
echo "DONE."
echo "Add DNS record:"
echo "  Type: A"
echo "  Name: ${SUBDOMAIN}"
echo "  Value: ${LB_IP}"
echo "  TTL: 300"
echo
echo "Then wait for SSL to become ACTIVE:"
echo "  gcloud compute ssl-certificates describe \"${LB_CERT_NAME}\" --global --format='yaml(managed.status,managed.domainStatus)'"

