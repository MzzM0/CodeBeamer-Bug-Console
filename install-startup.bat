@echo off
setlocal

powershell -ExecutionPolicy Bypass -File "%~dp0install-startup.ps1"

endlocal
