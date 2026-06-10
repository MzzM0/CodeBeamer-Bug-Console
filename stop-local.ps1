$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$healthUrl = "http://127.0.0.1:3080/api/health"
$pidFile = Join-Path $root ".local-server.pid"

function Test-LocalServer {
  try {
    $null = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 2
    return $true
  } catch {
    return $false
  }
}

if (Test-Path -LiteralPath $pidFile) {
  $pidText = Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  $serverPid = 0
  [void][int]::TryParse([string]$pidText, [ref]$serverPid)

  if ($serverPid -gt 0) {
    try {
      $proc = Get-Process -Id $serverPid -ErrorAction Stop
      Stop-Process -Id $proc.Id -Force -ErrorAction Stop
    } catch {
    }
  }

  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
} elseif (Test-LocalServer) {
  $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
  foreach ($proc in ($nodeProcesses | Where-Object { $_ })) {
    try {
      Stop-Process -Id $proc.Id -Force -ErrorAction Stop
    } catch {
    }
  }
} else {
  Write-Output "Local server is not running."
  exit 0
}

Start-Sleep -Milliseconds 500

if (Test-LocalServer) {
  throw "Local server still responds on port 3080. Please close it manually."
}

Write-Output "Local server stopped."
