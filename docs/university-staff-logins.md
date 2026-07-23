# University staff demo logins

One staff account per seeded university, scoped to that university only. Sign in at [https://university.faralin.kaana.in/sign-in](https://university.faralin.kaana.in/sign-in).

## Demo accounts

All accounts share the password stored in GCP Secret Manager as `faralin_staff_demo_password` (`STAFF_DEMO_PASSWORD`, currently **`FaralinStaff2026!`**).

Demo accounts are created with **Client Trust bypassed** so sign-in does not require an email inbox verification code.

| University | Email |
|------------|-------|
| University of Oxford | staff-oxford@faralin.kaana.in |
| University of Cambridge | staff-cambridge@faralin.kaana.in |
| Imperial College London | staff-imperial@faralin.kaana.in |
| University College London | staff-ucl@faralin.kaana.in |
| King's College London | staff-kings-college-london@faralin.kaana.in |
| London School of Economics | staff-lse@faralin.kaana.in |
| University of Edinburgh | staff-edinburgh@faralin.kaana.in |
| Durham University | staff-durham@faralin.kaana.in |
| University of Warwick | staff-warwick@faralin.kaana.in |
| University of Southampton | staff-southampton@faralin.kaana.in |
| University of Manchester | staff-manchester@faralin.kaana.in |
| University of Bristol | staff-bristol@faralin.kaana.in |
| University of Leeds | staff-leeds@faralin.kaana.in |
| University of Birmingham | staff-birmingham@faralin.kaana.in |
| University of Nottingham | staff-nottingham@faralin.kaana.in |
| University of Sheffield | staff-sheffield@faralin.kaana.in |
| Newcastle University | staff-newcastle@faralin.kaana.in |
| Cardiff University | staff-cardiff@faralin.kaana.in |
| University of Bath | staff-bath@faralin.kaana.in |
| University of Exeter | staff-exeter@faralin.kaana.in |

Pattern: **`staff-{university-slug}@faralin.kaana.in`**

> Legacy `staff@{slug}.demo` emails are rejected by Clerk and are migrated away automatically by the provisioning script.

## Provision accounts (DB + Clerk)

Local (requires `.env` with `DATABASE_URL`, `CLERK_SECRET_KEY`, `STAFF_DEMO_PASSWORD`):

```bash
pnpm --filter @faralin/db exec tsx prisma/provision-staff-clerk.ts
```

GCP (kaana-prod):

```bash
gcloud builds submit --config gcp/cloudbuild.provision-staff-clerk.yaml --project kaana-prod
```

The script:

1. Creates each user in Clerk with a verified email (no inbox needed)
2. Upserts the matching `UNIVERSITY_STAFF` row with the real Clerk user ID
3. Removes legacy `staff@{slug}.demo` pending rows

## Sign-in example

1. Email: `staff-oxford@faralin.kaana.in`
2. Password: value of `STAFF_DEMO_PASSWORD` / `faralin_staff_demo_password` secret
3. URL: https://university.faralin.kaana.in/sign-in

## Notes

- Staff are scoped to one university via `universityStaffProfile.universityId`.
- DB-only provisioning (no Clerk): `pnpm --filter @faralin/db exec tsx prisma/provision-all-staff.ts`
- Single custom email: `pnpm --filter @faralin/db exec tsx prisma/provision-staff.ts <email> [universitySlug]`
