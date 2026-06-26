## Faralin DB init job (Cloud Run Job)

This creates/updates the schema and seeds universities in Cloud SQL using a Cloud Run Job.

### Build and deploy the Job

```bash
PROJECT=kaana-prod
REGION=asia-south1
JOB=faralin-dbjob
CONN="$(gcloud sql instances describe faralin-pg --project ${PROJECT} --format='value(connectionName)')"

gcloud builds submit --project ${PROJECT} --config gcp/cloudbuild.dbjob.yaml .

IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/kaana/faralin-dbjob:latest"

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

