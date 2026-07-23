# Deploy admin portal to GCP (run in PowerShell after: gcloud auth login)
$ErrorActionPreference = "Stop"

$gcloud = "$env:LocalAppData\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (-not (Test-Path $gcloud)) {
  $gcloud = "gcloud"
}

Write-Host "Setting project to kaana-prod..."
& $gcloud config set project kaana-prod

Write-Host "Submitting Cloud Build (admin portal only)..."
& $gcloud builds submit --config gcp/cloudbuild.admin.yaml .

Write-Host ""
Write-Host "Done. Next steps:"
Write-Host "1. Get Cloud Run URL:"
Write-Host "   gcloud run services describe faralin-admin --region asia-south1 --format='value(status.url)'"
Write-Host ""
Write-Host "2. Get DNS record for admin.faralin.kaana.in:"
Write-Host "   gcloud beta run domain-mappings describe --domain admin.faralin.kaana.in --region asia-south1"
Write-Host "   Add the CNAME shown there in your kaana.in DNS."
Write-Host ""
Write-Host "3. Add https://admin.faralin.kaana.in to Clerk allowed redirect URLs."
Write-Host "4. Re-deploy API with updated ALLOWED_ORIGINS including admin.faralin.kaana.in"
