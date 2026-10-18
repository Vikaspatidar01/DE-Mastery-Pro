@echo off
title DE Mastery Pro - Data Engineering Academy 2026
color 0A
cd /d "%~dp0"

echo ======================================================================
echo           DE MASTERY PRO - DATA ENGINEERING ACADEMY 2026
echo                Zero to Hero Fresher Roadmap & Lab
echo ======================================================================
echo.
echo Starting local web server for offline PWA installation...
echo.

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Python detected. Launching app...
    python run_server.py
    goto end
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Python launcher detected. Launching app...
    py run_server.py
    goto end
)

echo [INFO] Python not found in PATH. Opening index.html directly in your default browser...
start "" "index.html"
echo.
echo NOTE: For full PWA installation and offline service workers, run with Python:
echo       python -m http.server 8000
echo.
pause

:end
