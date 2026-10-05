$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path ".env")) { Write-Host "Fichier .env manquant (copiez .env.example)."; exit 1 }
if (-not (Test-Path "node_modules")) { npm install }
$secrets = @{}
foreach ($l in Get-Content ".env") {
  if ($l -match '^\s*(DIFY_API_KEY|TOMTOM_API_KEY|DIFY_API_URL|GEMINI_API_KEY|GEMINI_MODEL)\s*=\s*(.+?)\s*$') { $secrets[$Matches[1]] = $Matches[2] }
}
if (-not $secrets["DIFY_API_KEY"]) { Write-Host "DIFY_API_KEY vide dans .env."; exit 1 }
npx wrangler deploy
if ($LASTEXITCODE -ne 0) { Write-Host "Le deploiement a echoue : les cles n'ont pas ete envoyees."; exit $LASTEXITCODE }
# Les cles partent dans un fichier JSON temporaire (UTF-8 sans BOM, supprime ensuite) et non par un tube :
# `valeur | npx wrangler secret put` ajoutait des octets parasites selon la facon de lancer le script,
# et le Worker recevait des cles invalides (TomTom et Dify indisponibles apres le deploiement).
$tmp = Join-Path $env:TEMP ("urbanflow-secrets-" + [guid]::NewGuid().ToString("N") + ".json")
try {
  [System.IO.File]::WriteAllText($tmp, ($secrets | ConvertTo-Json -Compress), (New-Object System.Text.UTF8Encoding($false)))
  npx wrangler secret bulk $tmp
  if ($LASTEXITCODE -ne 0) { Write-Host "L'envoi des cles a echoue."; exit $LASTEXITCODE }
} finally {
  Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
}
Write-Host "Termine. Ouvrez le lien workers.dev affiche ci-dessus."
