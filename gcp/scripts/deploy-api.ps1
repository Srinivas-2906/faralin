# Deploy Faralin API to GCP (includes Stream Chat secrets)
# Usage: .\gcp\scripts\deploy-api.ps1
$ErrorActionPreference = "Stop"

$gcloud = "$env:LocalAppData\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (-not (Test-Path $gcloud)) { $gcloud = "gcloud" }

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

Write-Host "Setting project to kaana-prod..."
& $gcloud config set project kaana-prod

Write-Host "Submitting Cloud Build (API only)..."
Push-Location $repoRoot
try {
  & $gcloud builds submit --config gcp/cloudbuild.api.yaml .
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Done. Webhook URL: https://api.faralin.kaana.in/api/support/stream/webhook"
