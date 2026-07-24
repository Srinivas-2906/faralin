# GCP prod go-live: admin.faralin.kaana.in

Run these steps once to bring the Faralin Admin Ops Hub live in production.

## Prerequisites

- `gcloud` authenticated against project `kaana-prod`
- DNS access for `kaana.in` (Cloudflare or registrar)
- Clerk Dashboard access for **Developers → Domains** (not redirect URLs — see [clerk-production-setup.md](./clerk-production-setup.md))

## 1. Deploy admin Cloud Run service

```powershell
.\gcp\scripts\deploy-admin.ps1
```

Or:

```bash
gcloud builds submit --config gcp/cloudbuild.admin.yaml --project kaana-prod
```

Verify:

```bash
gcloud run services describe faralin-admin --region asia-south1 --format='value(status.url)'
```

## 2. Load balancer routing

```bash
bash gcp/scripts/07-university-lb-routing.sh
```

This creates `faralin-admin-neg`, `faralin-admin-backend`, and host rule for `admin.faralin.kaana.in`.

## 3. DNS

Add at your DNS provider (Hostinger / Cloudflare for `kaana.in`):

| Type | Name | Value |
|------|------|-------|
| A | admin.faralin | 34.36.130.96 |

TTL: 300 seconds.

Verify:

```powershell
.\gcp\scripts\verify-faralin-dns.ps1
```

Until this record propagates, sign in at the Cloud Run URL:

`https://faralin-admin-wtba53dhka-el.a.run.app/sign-in`

## 4. SSL certificate

Faralin uses managed cert **`faralin-cert-v3`** on the shared load balancer. It must include all four hostnames:

- `faralin.kaana.in`
- `api.faralin.kaana.in`
- `university.faralin.kaana.in`
- `admin.faralin.kaana.in`

GCP managed certificates **cannot add domains to an existing cert**. If `admin.faralin.kaana.in` shows `NET::ERR_CERT_COMMON_NAME_INVALID`, recreate the cert:

```bash
# Free quota if at limit (delete unused legacy cert first)
gcloud compute ssl-certificates delete faralin-cert --global --project kaana-prod -q 2>/dev/null || true

gcloud compute ssl-certificates create faralin-cert-v3 \
  --domains=faralin.kaana.in,api.faralin.kaana.in,university.faralin.kaana.in,admin.faralin.kaana.in \
  --global --project kaana-prod

gcloud compute target-https-proxies update kaana-web-https-proxy-classic --global \
  --project kaana-prod \
  --ssl-certificates=kaana-all-cert,faralin-cert-v3,kaana-tracker-cert,ajitdentalclinic-cert,kaana-clinic-cert,dentacare-cert,aquafarm-cert,kaana-menu-cert
```

Wait until all domains are `ACTIVE`:

```bash
gcloud compute ssl-certificates describe faralin-cert-v3 --global --project kaana-prod \
  --format='yaml(managed.status,managed.domainStatus)'
```

Then remove the old cert from the proxy and delete it:

```bash
gcloud compute ssl-certificates delete faralin-cert-v2 --global --project kaana-prod -q
```

Verify: `curl -I https://admin.faralin.kaana.in/sign-in` (no `-k`).

## 5. Clerk (Domains — not redirect URLs)

Clerk Core 2+ **removed** the Dashboard "Allowed redirect URLs" list. Post sign-in redirects are already configured in [`Dockerfile.admin`](../Dockerfile.admin) and the admin `<SignIn />` component.

**In Clerk Dashboard:**

1. **Configure → Developers → Domains** — verify production domain DNS (if using Production instance)
2. Confirm GCP secrets use the same Clerk instance as the Dashboard

Full guide: [clerk-production-setup.md](./clerk-production-setup.md)

No Paths / redirect URL entries are required for embedded sign-in.

## 6. Redeploy API (CORS)

Admin origins are in `gcp/cloudbuild.api.yaml` `_ALLOWED_ORIGINS`. Redeploy API:

```bash
gcloud builds submit --config gcp/cloudbuild.api.yaml --project kaana-prod
```

Local dev CORS: set `ALLOWED_ORIGINS` in `.env` to include `http://localhost:3002`.

## 7. Provision support users

```bash
gcloud builds submit --config gcp/cloudbuild.provision-support-clerk.yaml --project kaana-prod
```

See [support-logins.md](./support-logins.md) for demo accounts.

## 8. Stream Chat (live support)

See [stream-chat-setup.md](./stream-chat-setup.md) for credentials, channel type setup, and webhook configuration.

API key (prod): store in Secret Manager as `faralin_stream_api_key`. Redeploy API after adding secrets.

## 9. Smoke test

1. `curl -I https://admin.faralin.kaana.in/sign-in` → 200
2. Sign in as `agent-1@faralin.kaana.in`
3. Open dashboard and tickets
4. Student: `https://faralin.kaana.in/support` → bot → escalate
5. Agent: admin Live inbox → join conversation

## Related files

- [Dockerfile.admin](../Dockerfile.admin)
- [cloudbuild.admin.yaml](../gcp/cloudbuild.admin.yaml)
- [deploy-admin.ps1](../gcp/scripts/deploy-admin.ps1)
- [07-university-lb-routing.sh](../gcp/scripts/07-university-lb-routing.sh)
