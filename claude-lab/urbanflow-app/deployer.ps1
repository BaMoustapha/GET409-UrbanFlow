$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path ".env")) { Write-Host "Fichier .env manquant (copiez .env.example)."; exit 1 }
if (-not (Test-Path "node_modules")) { npm install }
$secrets = @{}
foreach ($l in Get-Content ".env") {
  if ($l -match '^\s*(DIFY_API_KEY|TOMTOM_API_KEY|DIFY_API_URL)\s*=\s*(.+?)\s*$') { $secrets[$Matches[1]] = $Matches[2] }
}
if (-not $secrets["DIFY_API_KEY"]) { Write-Host "DIFY_API_KEY vide dans .env."; exit 1 }
npx wrangler deploy
foreach ($k in $secrets.Keys) { $secrets[$k] | npx wrangler secret put $k }
Write-Host "Termine. Ouvrez le lien workers.dev affiche ci-dessus."
