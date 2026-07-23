# Faralin admin & support logins

Sign in at [https://admin.faralin.kaana.in/sign-in](https://admin.faralin.kaana.in/sign-in) (local: `http://localhost:3002/sign-in`).

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full platform configuration + support ticketing + agent management |
| **Support agent** | Internal ticketing (create, assign, resolve cases) |

## Demo accounts

Password: GCP Secret Manager `faralin_staff_demo_password` (`STAFF_DEMO_PASSWORD` / `SUPPORT_DEMO_PASSWORD`, currently **`FaralinStaff2026!`**).

Accounts are created with **Client Trust bypassed** (no inbox verification code).

| Role | Email |
|------|-------|
| Admin | admin@faralin.com |
| Support agent 1 | agent-1@faralin.kaana.in |
| Support agent 2 | agent-2@faralin.kaana.in |
| Support agent 3 | agent-3@faralin.kaana.in |
| Support agent 4 | agent-4@faralin.kaana.in |
| Support agent 5 | agent-5@faralin.kaana.in |

## Provision accounts (DB + Clerk)

Local (requires `.env` with `DATABASE_URL`, `CLERK_SECRET_KEY`, `STAFF_DEMO_PASSWORD`):

```bash
pnpm --filter @faralin/db exec tsx prisma/provision-support-clerk.ts
```

GCP (kaana-prod):

```bash
gcloud builds submit --config gcp/cloudbuild.provision-support-clerk.yaml --project kaana-prod
```

The script:

1. Creates or recreates each user in Clerk with a verified email
2. Upserts `ADMIN` for `admin@faralin.com` with `AdminProfile`
3. Upserts five `SUPPORT_AGENT` users with `SupportAgentProfile`

## Sign-in example

1. Email: `agent-1@faralin.kaana.in`
2. Password: value of `STAFF_DEMO_PASSWORD`
3. You should land on the admin dashboard with ticket navigation

Admin users additionally see **Platform** navigation (assessments, rules, universities, moderation, staff invites, agents).
