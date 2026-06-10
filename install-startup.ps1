$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$startupDir = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupDir "CodeBeamer Bug Workflow Tool.lnk"
$targetPath = Join-Path $root "launch-local.bat"

if (-not (Test-Path -LiteralPath $targetPath)) {
  throw "Cannot find launch-local.bat in $root"
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.WorkingDirectory = $root
$shortcut.WindowStyle = 7
$shortcut.Description = "Start CodeBeamer Bug Workflow Tool"
$shortcut.Save()

Write-Output "Startup shortcut installed for current user:"
Write-Output $shortcutPath
