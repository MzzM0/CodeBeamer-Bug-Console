$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = "http://127.0.0.1:3080"
$healthUrl = "$url/api/health"
$pidFile = Join-Path $root ".local-server.pid"

function Resolve-NodePath {
  $bundledNode = Join-Path $root "runtime\\node.exe"
  if (Test-Path -LiteralPath $bundledNode) {
    return $bundledNode
  }

  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) {
    return $node.Source
  }

  throw "Node.js not found. Please install Node.js first, or use a package that includes runtime\\node.exe."
}

function Test-LocalServer {
  try {
    $null = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 2
    return $true
  } catch {
    return $false
  }
}

function Start-LocalServer {
  $nodePath = Resolve-NodePath
  $proc = Start-Process -FilePath $nodePath -ArgumentList "server.js" -WorkingDirectory $root -WindowStyle Hidden -PassThru
  Set-Content -LiteralPath $pidFile -Value $proc.Id -Encoding ASCII
}

if (-not (Test-LocalServer)) {
  Start-LocalServer

  $started = $false
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-LocalServer) {
      $started = $true
      break
    }
  }

  if (-not $started) {
    if (Test-Path -LiteralPath $pidFile) {
      Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
    }
    throw "Local server failed to start. Run 'node server.js' in the project folder to inspect the error."
  }
}

Start-Process $url
