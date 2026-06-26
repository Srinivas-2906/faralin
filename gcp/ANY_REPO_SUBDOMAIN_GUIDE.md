# Host any repo as a subdomain on GCP (non‑technical, step‑by‑step)

This guide shows how to put **any website/API** on the internet as:

- `https://your-subdomain.yourdomain.com`

using **Google Cloud Run** (for running the app) and either:

- **Option A (simpler)**: Cloud Run “Custom domains” (only supported in some regions)
- **Option B (works everywhere)**: a Google **HTTPS Load Balancer** + a static IP (this is what we used when Cloud Run domain mapping was unavailable)

It also includes **scripts you can run** from your laptop so you don’t need to remember commands.

---

## What you need before you start

### A) Accounts / access
- You can log in to:
  - **Google Cloud Console** for the target project
  - **Your DNS provider** (where your domain is managed: GoDaddy / Cloudflare / Route53 / etc.)
- You have a **domain name** (example: `example.com`).

### B) On your laptop
- Install **Google Cloud CLI** (`gcloud`)
- Optional but helpful: **git**

---

## Big picture (what will happen)

You will do these steps in order:

1) Make sure your laptop is connected to GCP (login + project set)
2) Enable required GCP APIs + create a Docker image repository (one time)
3) Deploy your app to Cloud Run (you get a `.run.app` URL)
4) Point your **subdomain** to the app:
   - Try Cloud Run domain mapping (Option A)
   - If it says “not allowed in this region”, use Load Balancer (Option B)
5) (Optional) turn on “deploy on every push to GitHub”

If anything fails, follow the **“If you see this error…”** notes at the end of each step.

---

## Step 0 — Fill these values (copy/paste and edit)

Pick your values once and keep them for the whole setup.

```bash
# REQUIRED
export PROJECT_ID="your-gcp-project-id"
export REGION="asia-south1"          # choose your region
export SERVICE_NAME="my-service"     # Cloud Run service name
export AR_REPO="apps"                # Artifact Registry repo name

# Your domain
export ROOT_DOMAIN="example.com"
export SUBDOMAIN="app"               # "app" makes app.example.com

# Docker
export DOCKERFILE="Dockerfile"       # path to your Dockerfile
export PORT="8080"                   # container listens on this port
```

The full domain becomes:

```bash
export FULL_DOMAIN="${SUBDOMAIN}.${ROOT_DOMAIN}"
echo "$FULL_DOMAIN"
```

---

## Step 1 — Connect your laptop to GCP (if disconnected)

Run:

```bash
bash gcp/scripts/00-gcloud-doctor.sh
```

It will:
- confirm `gcloud` exists
- confirm you are logged in
- confirm your project is set

### If you see “You do not currently have an active account selected”
Run:

```bash
gcloud auth login
```

### If you see “project is not configured”
Run:

```bash
gcloud config set project "$PROJECT_ID"
```

---

## Step 2 — One‑time GCP bootstrap (APIs + Artifact Registry)

Run:

```bash
bash gcp/scripts/01-bootstrap.sh
```

This enables required APIs and ensures your Docker image repository exists.

### If this fails with permissions
You need project access (Owner/Editor) or ask your admin to grant:
- Cloud Run Admin
- Cloud Build Editor
- Artifact Registry Admin

---

## Step 3 — Deploy to Cloud Run (manual deploy, first time)

Run from the repo root:

```bash
bash gcp/scripts/02-deploy-manual.sh
```

You should see a URL like:
- `https://<service>-<hash>-<region>.a.run.app`

### If you see “container failed to start and listen”
Usually one of these:
- your app is not listening on `$PORT`
- your app binds to `localhost` instead of `0.0.0.0`

Fix checklist:
- server listens on `process.env.PORT` (Node) or whatever your runtime requires
- bind host `0.0.0.0`
- container exposes/uses the same port you deploy with (default here is `8080`)

---

## Step 4 — Map a subdomain (choose A or B)

### Option A (try first): Cloud Run Custom Domain mapping

Try:

```bash
gcloud beta run domain-mappings create \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --service "$SERVICE_NAME" \
  --domain "$FULL_DOMAIN"
```

If it works, get the DNS records to add:

```bash
gcloud beta run domain-mappings describe \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --domain "$FULL_DOMAIN" \
  --format="yaml(status.resourceRecords,status.conditions)"
```

Add those DNS records at your DNS provider and wait for SSL to become active.

#### If you see: “Creating domain mappings is not allowed in <region>”
That means Option A is not supported in that region. Use **Option B**.

---

### Option B (works everywhere): HTTPS Load Balancer + static IP

Run:

```bash
bash gcp/scripts/05-lb-subdomain.sh
```

That script:
- creates a **serverless NEG** pointing to your Cloud Run service
- creates a backend + URL map routing `FULL_DOMAIN` to that backend
- creates a managed SSL cert for the domain
- creates/uses a **global static IP** and HTTPS forwarding rule

After it runs, it prints the **static IP** you must use in DNS.

#### DNS record to add (typical)
- **Type**: `A`
- **Name/Host**: your subdomain (example: `app`)
- **Value**: the printed IP
- **TTL**: 300 seconds

SSL will show `PROVISIONING` until DNS points correctly; then it becomes `ACTIVE`.

---

## Step 5 — Auto deploy on push (Cloud Build trigger)

You can set up automatic deployments so pushing to `main` triggers build+deploy.

### What you need in your repo
- a `gcp/cloudbuild.yaml` (template is in `gcp/templates/cloudbuild.single.yaml`)
- a Dockerfile (or Docker build step)

### What you do in GCP Console (non‑technical)
1) Open **Cloud Build → Triggers**
2) Click **Connect repository** (GitHub)
3) Click **Create trigger**
4) Event: push to branch
5) Branch: `^main$`
6) Config file: `gcp/cloudbuild.yaml`
7) Save

If the console says “Repository mapping not found”, it means the repo was not connected yet—go back and click **Connect repository** first.

---

## Troubleshooting quick list

### “Not secure” in the browser
- SSL cert is still **PROVISIONING** (wait 5–60 minutes)
- confirm DNS points to the correct IP

Check cert status:

```bash
gcloud compute ssl-certificates describe "$LB_CERT_NAME" --global --format="yaml(managed.status,managed.domainStatus)"
```

### “403” from API endpoints
Your API may require auth (Bearer token). This is not a deployment failure.

### “Permission denied” running scripts
Make scripts executable:

```bash
chmod +x gcp/scripts/*.sh
```

---

