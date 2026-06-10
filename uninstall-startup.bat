@echo off
setlocal

powershell -ExecutionPolicy Bypass -File "%~dp0uninstall-startup.ps1"

endlocal
