@echo off
cd /d "%~dp0"
where py >nul 2>nul && (start http://localhost:8080 & py -m http.server 8080 & exit /b)
where python >nul 2>nul && (start http://localhost:8080 & python -m http.server 8080 & exit /b)
echo Python est requis. Installez Python 3 puis relancez ce fichier.
pause
