# University staff demo logins

One staff account per seeded university, scoped to that university only. Use these on the university portal at [https://university.faralin.kaana.in/sign-in](https://university.faralin.kaana.in/sign-in).

## Demo accounts

| University | Email | Password |
|------------|-------|----------|
| University of Oxford | staff@oxford.demo | *(set in Clerk — see below)* |
| University of Cambridge | staff@cambridge.demo | *(set in Clerk — see below)* |
| Imperial College London | staff@imperial.demo | *(set in Clerk — see below)* |
| University College London | staff@ucl.demo | *(set in Clerk — see below)* |
| King's College London | staff@kings-college-london.demo | *(set in Clerk — see below)* |
| London School of Economics | staff@lse.demo | *(set in Clerk — see below)* |
| University of Edinburgh | staff@edinburgh.demo | *(set in Clerk — see below)* |
| Durham University | staff@durham.demo | *(set in Clerk — see below)* |
| University of Warwick | staff@warwick.demo | *(set in Clerk — see below)* |
| University of Southampton | staff@southampton.demo | *(set in Clerk — see below)* |
| University of Manchester | staff@manchester.demo | *(set in Clerk — see below)* |
| University of Bristol | staff@bristol.demo | *(set in Clerk — see below)* |
| University of Leeds | staff@leeds.demo | *(set in Clerk — see below)* |
| University of Birmingham | staff@birmingham.demo | *(set in Clerk — see below)* |
| University of Nottingham | staff@nottingham.demo | *(set in Clerk — see below)* |
| University of Sheffield | staff@sheffield.demo | *(set in Clerk — see below)* |
| Newcastle University | staff@newcastle.demo | *(set in Clerk — see below)* |
| Cardiff University | staff@cardiff.demo | *(set in Clerk — see below)* |
| University of Bath | staff@bath.demo | *(set in Clerk — see below)* |
| University of Exeter | staff@exeter.demo | *(set in Clerk — see below)* |

## Database provisioning

Run locally:

```bash
pnpm --filter @faralin/db exec tsx prisma/provision-all-staff.ts
```

Or on GCP (kaana-prod):

```bash
gcloud builds submit --config gcp/cloudbuild.provision-all-staff.yaml --project kaana-prod
```

This creates or upgrades each `staff@{slug}.demo` user with role `UNIVERSITY_STAFF`, job title **Widening Participation Officer**, and a `pending_*` Clerk ID until first sign-in links the account.

## Clerk setup (required once per account)

Demo emails are not real inboxes. For each staff account:

1. Open **Clerk Dashboard** → **Users** → **Create user**
2. Email: `staff@{slug}.demo` (from the table above)
3. Set a shared demo password (or disable email verification on the dev instance)
4. Sign in at [https://university.faralin.kaana.in/sign-in](https://university.faralin.kaana.in/sign-in)

On first sign-in, the API links the Clerk user ID to the pending DB record via email matching (`auth-user.service.ts`).

## Sign-in checklist

1. Confirm the account exists in the database (`provision-all-staff`)
2. Create the matching Clerk user with the same email
3. Sign in at the university portal — you should land on `/dashboard` for that university only
4. Verify **Students** lists followers even when Faralins are zero
5. Verify **Applications** reflects referral clicks from the student web app

## Notes

- Staff cannot access another university’s data; endpoints are scoped by `universityStaffProfile.universityId`.
- To provision a single custom staff email, use `pnpm --filter @faralin/db exec tsx prisma/provision-staff.ts <email> [universitySlug]`.
