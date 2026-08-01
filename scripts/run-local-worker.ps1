param([int]$Port = 8788)

$persistRoot = Join-Path ([System.IO.Path]::GetTempPath()) 'teachplay-wrangler-state'
New-Item -ItemType Directory -Force -Path $persistRoot | Out-Null

& npx.cmd wrangler dev --local --live-reload=false --show-interactive-dev-session=false `
  --persist-to $persistRoot --port $Port
