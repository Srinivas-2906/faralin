# Stream Chat setup (live support)

Faralin live support uses [GetStream Chat](https://getstream.io/chat/) with channel type `faralin-support`.

## Credentials

| Variable | Where to get it |
|----------|-----------------|
| `STREAM_API_KEY` | GetStream Dashboard → App → API Keys (already set locally: `k79w5p76avfb`) |
| `STREAM_API_SECRET` | Same page — **Secret** (never commit; add to `.env` and GCP Secret Manager) |
| `STREAM_WEBHOOK_SECRET` | **Not used by Stream Chat** — webhooks are signed with your API Secret via the `X-Signature` header. Leave blank. |

### Local `.env`

```env
STREAM_API_KEY=<your key>
STREAM_API_SECRET=<paste from GetStream dashboard>
# Leave blank — Stream signs webhooks with API Secret
STREAM_WEBHOOK_SECRET=
```

### GCP Secret Manager (production)

```bash
echo -n "k79w5p76avfb" | gcloud secrets create faralin_stream_api_key --data-file=- --project kaana-prod
echo -n "<secret>" | gcloud secrets create faralin_stream_api_secret --data-file=- --project kaana-prod
```

API Cloud Run already references these in `gcp/cloudbuild.api.yaml`.

## One-time app setup

After adding `STREAM_API_SECRET` to `.env`:

```bash
pnpm --filter api setup:stream
```

This creates:

- Channel type `faralin-support`
- Service user `faralin-bot`

## Webhook

In GetStream Dashboard → **Chat** → **Webhooks**:

| Field | Value |
|-------|--------|
| URL | `https://api.faralin.kaana.in/api/support/stream/webhook` |
| Events | `message.new` (minimum) |

For local testing, use a tunnel (ngrok) pointing to `http://localhost:3001/api/support/stream/webhook`.

## Verify

1. Start API: `pnpm --filter api dev`
2. Student: open `http://localhost:3000/support` → bot → **Talk to an agent**
3. Agent: open `http://localhost:3002/live` → join conversation
4. Messages should appear in Stream Chat UI on both sides

If live chat shows “not configured”, confirm both `STREAM_API_KEY` and `STREAM_API_SECRET` are set and restart the API.
