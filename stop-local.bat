@echo off
setlocal

powershell -ExecutionPolicy Bypass -File "%~dp0stop-local.ps1"

endlocal
