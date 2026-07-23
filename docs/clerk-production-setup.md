# Clerk production setup (Faralin)

Clerk **Core 2+** no longer has an "Allowed redirect URLs" field in the Dashboard. Redirect behavior is configured in **application code and env vars**; production domains are registered under **Developers → Domains**.

References:
- [Customize redirect URLs](https://clerk.com/docs/guides/development/customize-redirect-urls)
- [Deploy to production](https://clerk.com/docs/guides/development/deployment/production)
- [Clerk environment variables](https://clerk.com/docs/guides/development/clerk-environment-variables)

## Dashboard: what to configure

| Location | Purpose | Faralin |
|----------|---------|---------|
| **Developers → Domains** | Register production root domain + Clerk DNS records | Required for Production instance with custom domains |
| **Developers → Paths** | Account Portal component paths | **Not used** — we embed `<SignIn />` on each app |
| **Account Portal → Redirects** | Fallback when users hit `accounts.dev` directly | Optional — not used for normal sign-in flow |

## Redirect behavior (already in code)

Post sign-in redirects are **not** set in the Dashboard. They are configured via:

**Build-time env vars** (see [`Dockerfile.admin`](../Dockerfile.admin), [`Dockerfile.university`](../Dockerfile.university), [`Dockerfile.web`](../Dockerfile.web)):

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
```

**Component props** — e.g. admin [`SignIn`](../apps/admin/src/app/sign-in/[[...sign-in]]/page.tsx) uses `forceRedirectUrl="/dashboard"`.

No Dashboard changes needed for redirect-after-login.

## Domains checklist (Clerk Dashboard)

1. Open **Configure → Developers → Domains**
2. Confirm the instance matches GCP Secret Manager keys (`faralin_clerk_publishable_key`)
3. For **Production** instance with `*.faralin.kaana.in`:
   - Add root domain (e.g. `kaana.in` or `faralin.kaana.in`)
   - Add DNS records Clerk displays (Frontend API CNAME, etc.)
   - Deploy certificates when prompted
4. Sessions then work across subdomains: `faralin.kaana.in`, `university.faralin.kaana.in`, `admin.faralin.kaana.in`

**Development instance:** works with `*.accounts.dev` and embedded components without custom domain DNS. University portal sign-in confirms this setup is functional.

## DNS verification (load balancer)

Run from repo root:

```powershell
.\gcp\scripts\verify-faralin-dns.ps1
```

Expected for production LB (`34.36.130.96`):

| Host | Status |
|------|--------|
| `faralin.kaana.in` | A → 34.36.130.96 |
| `university.faralin.kaana.in` | A → 34.36.130.96 |
| `admin.faralin.kaana.in` | A → 34.36.130.96 (add at registrar if missing) |

Until `admin.faralin` DNS exists, use Cloud Run URL:

`https://faralin-admin-wtba53dhka-el.a.run.app/sign-in`

## Moving Development → Production

When ready for live traffic:

1. Clerk Dashboard → **Create production instance** (or use **Go to prod**)
2. Update GCP secrets: `faralin_clerk_publishable_key`, `faralin_clerk_secret_key`
3. Complete **Developers → Domains** + DNS
4. Redeploy web, university, admin, and api
5. Re-run provisioning jobs for staff/agents (Clerk user IDs change per instance)
