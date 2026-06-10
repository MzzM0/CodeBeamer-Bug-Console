$ErrorActionPreference = "Stop"

$startupDir = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupDir "CodeBeamer Bug Workflow Tool.lnk"

if (Test-Path -LiteralPath $shortcutPath) {
  Remove-Item -LiteralPath $shortcutPath -Force
  Write-Output "Startup shortcut removed:"
  Write-Output $shortcutPath
} else {
  Write-Output "Startup shortcut is not installed."
}
