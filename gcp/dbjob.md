## Faralin DB init job (Cloud Run Job)

This creates/updates the schema and seeds universities in Cloud SQL using a Cloud Run Job.

### Build and deploy the Job

```bash
PROJECT=kaana-prod
REGION=asia-south1
REPO=kaana
JOB=faralin-dbjob
IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/faralin-dbjob:latest"
CONN="$(gcloud sql instances describe faralin-pg --project ${PROJECT} --format='value(connectionName)')"

gcloud builds submit --project ${PROJECT} --tag "${IMAGE}" --file Dockerfile.dbjob .

gcloud run jobs create ${JOB} \
  --project ${PROJECT} \
  --region ${REGION} \
  --image "${IMAGE}" \
  --add-cloudsql-instances "${CONN}" \
  --set-secrets "DATABASE_URL=faralin_database_url:latest" \
  --memory 512Mi --cpu 1 \
  --max-retries 3 \
  --task-timeout 10m
```

If it already exists, update it:

```bash
gcloud run jobs update ${JOB} \
  --project ${PROJECT} \
  --region ${REGION} \
  --image "${IMAGE}" \
  --add-cloudsql-instances "${CONN}" \
  --set-secrets "DATABASE_URL=faralin_database_url:latest"
```

### Run the Job

```bash
gcloud run jobs execute faralin-dbjob --project kaana-prod --region asia-south1 --wait
```

