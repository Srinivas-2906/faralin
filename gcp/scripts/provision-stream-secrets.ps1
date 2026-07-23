# Upsert Stream Chat secrets from repo-root .env into GCP Secret Manager.
# Usage: .\gcp\scripts\provision-stream-secrets.ps1
$ErrorActionPreference = "Stop"

$gcloud = "$env:LocalAppData\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (-not (Test-Path $gcloud)) { $gcloud = "gcloud" }

$project = "kaana-prod"
$envFile = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) ".env"

if (-not (Test-Path $envFile)) {
  Write-Error ".env not found at $envFile"
}

function Read-EnvValue([string]$Key) {
  foreach ($line in Get-Content $envFile) {
    if ($line -match "^\s*$([regex]::Escape($Key))=(.*)$") {
      return $matches[1].Trim()
    }
  }
  return $null
}

function Test-SecretExists([string]$Name) {
  $output = cmd /c "`"$gcloud`" secrets describe $Name --project $project 2>nul"
  return $LASTEXITCODE -eq 0
}

function Upsert-Secret([string]$Name, [string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    Write-Error "Missing value for $Name in .env"
  }
  if (Test-SecretExists $Name) {
    $Value | & $gcloud secrets versions add $Name --project $project --data-file=-
    Write-Host "Updated secret: $Name"
  } else {
    $Value | & $gcloud secrets create $Name --project $project --replication-policy=automatic --data-file=-
    Write-Host "Created secret: $Name"
  }
}

function Grant-Accessor([string]$SecretName) {
  $projectNumber = (& $gcloud projects describe $project --format="value(projectNumber)").Trim()
  $runSa = "$projectNumber-compute@developer.gserviceaccount.com"
  & $gcloud secrets add-iam-policy-binding $SecretName `
    --project $project `
    --member="serviceAccount:$runSa" `
    --role="roles/secretmanager.secretAccessor" `
    --quiet | Out-Null
  Write-Host "Granted accessor on $SecretName to Cloud Run default SA"
}

Write-Host "Setting project to $project..."
& $gcloud config set project $project | Out-Null

$apiKey = Read-EnvValue "STREAM_API_KEY"
$apiSecret = Read-EnvValue "STREAM_API_SECRET"

Write-Host "Upserting Stream secrets from .env..."
Upsert-Secret "faralin_stream_api_key" $apiKey
Upsert-Secret "faralin_stream_api_secret" $apiSecret

Grant-Accessor "faralin_stream_api_key"
Grant-Accessor "faralin_stream_api_secret"

Write-Host ""
Write-Host "Done. Run .\gcp\scripts\deploy-api.ps1 to redeploy API with Stream env."
