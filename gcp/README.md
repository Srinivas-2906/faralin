# Faralin → Cloud Run (Auto deploy on push)

This repo is a **pnpm + Turborepo** monorepo with:
- `apps/web`: **Next.js 15** (React 19)
- `apps/api`: **NestJS** (not deployed by default in this guide)

This guide deploys **only the web app** to Cloud Run and maps a **subdomain** to it.

Assumption for domain mapping:
- Subdomain will be **`faralin.kaana.in`** (Cloud Run custom domain mapping)
- API subdomain will be **`api.faralin.kaana.in`**

---

## 1) What I detected (tech + GCP)

### Tech
- Monorepo: `pnpm-workspace.yaml` + `turbo.json`
- Web: `apps/web` is `next@^15.3.3`
- API: `apps/api` is `nestjs@^11`

### GCP (from your current gcloud config)
- Project: `kaana-prod`
- Region used by existing services: `asia-south1`
- Artifact Registry docker repo: `kaana` in `asia-south1`

---

## 2) One-time setup in GCP project

### APIs
Enable:
- Cloud Run
- Cloud Build
- Artifact Registry

### Permissions
Your Cloud Build trigger will deploy Cloud Run, so Cloud Build’s service account needs permission.
In most setups, granting **Cloud Run Admin** to the Cloud Build SA is enough.

---

## 3) Files added to this repo (deployment)

- `Dockerfile.web` → builds and runs `apps/web` (Next.js) using `output: 'standalone'`
- `Dockerfile.api` → builds and runs `apps/api` (NestJS)
- `.dockerignore`
- `gcp/cloudbuild.yaml` → build + push + deploy Cloud Run services `faralin-web` and `faralin-api`

---

## 4) Create Cloud Build trigger (auto deploy on push)

In GCP Console:
1. Open **Cloud Build → Triggers**
2. **Create trigger**
3. Source: GitHub
4. Repo: `Srinivas-2906/faralin`
5. Branch: `main`
6. Config: **Cloud Build configuration file**
7. Location: `gcp/cloudbuild.yaml`
8. Save

Now every push to `main` deploys Cloud Run.

---

## 5) Create the Cloud Run service once (first deploy)

The first build from the trigger will create:
- Service: `faralin-web`
- Image: `asia-south1-docker.pkg.dev/kaana-prod/kaana/faralin-web:<build>`
and:
- Service: `faralin-api`
- Image: `asia-south1-docker.pkg.dev/kaana-prod/kaana/faralin-api:<build>`

After the first deploy finishes, confirm in Cloud Run:
- Service is public (unauthenticated)
- URL works (the default `*.a.run.app` URL)

---

## 6) Map subdomain (Cloud Run custom domain)

1. Cloud Run → `faralin-web`
2. **Custom domains**
3. Add mapping: `faralin.kaana.in`
4. Follow the DNS instructions shown by Google (usually CNAME)
5. Wait for SSL to provision

Repeat for API:
1. Cloud Run → `faralin-api`
2. **Custom domains**
3. Add mapping: `api.faralin.kaana.in`

---

## 7) Environment variables / secrets (if needed)

`apps/web` uses Clerk. In Cloud Run:
- Add env vars like `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, etc.
- Prefer **Secret Manager** for secrets.

---

## 8) If you also want the API on another subdomain

This is now included:
- `api.faralin.kaana.in` → Cloud Run service `faralin-api`

