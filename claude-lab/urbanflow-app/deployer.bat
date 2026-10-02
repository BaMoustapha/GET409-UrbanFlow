@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File deployer.ps1
pause
