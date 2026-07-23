# Verify Faralin production DNS points at the shared load balancer.
# Usage: .\gcp\scripts\verify-faralin-dns.ps1
$ErrorActionPreference = "Continue"

$lbIp = "34.36.130.96"
$hosts = @(
  "faralin.kaana.in",
  "university.faralin.kaana.in",
  "admin.faralin.kaana.in",
  "api.faralin.kaana.in"
)

Write-Host "Expected load balancer IP: $lbIp"
Write-Host ""

foreach ($hostName in $hosts) {
  try {
    $result = Resolve-DnsName -Name $hostName -Type A -ErrorAction Stop
    $ip = ($result | Where-Object { $_.Type -eq "A" } | Select-Object -First 1).IPAddress
    if ($ip -eq $lbIp) {
      Write-Host "[OK]  $hostName -> $ip"
    } elseif ($ip) {
      Write-Host "[!!]  $hostName -> $ip (expected $lbIp)"
    } else {
      Write-Host "[??]  $hostName -> no A record"
    }
  } catch {
    Write-Host "[MISS] $hostName -> not configured (add A record $hostName -> $lbIp)"
  }
}

Write-Host ""
Write-Host "Admin Cloud Run fallback (works without admin.faralin DNS):"
Write-Host "  https://faralin-admin-wtba53dhka-el.a.run.app/sign-in"
