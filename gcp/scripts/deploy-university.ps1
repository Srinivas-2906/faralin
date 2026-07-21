# Deploy university portal to GCP (run in PowerShell after: gcloud auth login)
$ErrorActionPreference = "Stop"

$gcloud = "$env:LocalAppData\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (-not (Test-Path $gcloud)) {
  $gcloud = "gcloud"
}

Write-Host "Setting project to kaana-prod..."
& $gcloud config set project kaana-prod

Write-Host "Submitting Cloud Build (university portal only)..."
& $gcloud builds submit --config gcp/cloudbuild.university.yaml .

Write-Host ""
Write-Host "Done. Next steps:"
Write-Host "1. Get Cloud Run URL:"
Write-Host "   gcloud run services describe faralin-university --region asia-south1 --format='value(status.url)'"
Write-Host ""
Write-Host "2. Get DNS record for university.faralin.kaana.in:"
Write-Host "   gcloud beta run domain-mappings describe --domain university.faralin.kaana.in --region asia-south1"
Write-Host "   Add the CNAME shown there in your kaana.in DNS."
Write-Host ""
Write-Host "3. Add https://university.faralin.kaana.in to Clerk allowed redirect URLs."
