@echo off
chcp 65001 >nul
cls

echo ===================================
echo Swiss Payroll System
echo ===================================
echo.

echo Aktuelles Verzeichnis:
cd
echo.

echo Node.js gefunden:
node --version
echo.

echo Konfiguration:
echo - Datenbanken: SK, WIF, QCS
echo - Port: 5000
echo.

echo Starte App...
echo Browser oeffnen: http://localhost:5000
echo.
echo Zum Beenden: Strg+C oder Fenster schliessen
echo ===================================
echo.

REM Set environment variables
set NODE_ENV=development
set DATABASE_URL_FIRMA_A=postgresql://payroll_user:LohnPw2025@localhost:5432/payroll_sk
set DATABASE_URL_FIRMA_B=postgresql://payroll_user:LohnPw2025@localhost:5432/payroll_wif
set DATABASE_URL_FIRMA_C=postgresql://payroll_user:LohnPw2025@localhost:5432/payroll_qcs
set DATABASE_URL=postgresql://payroll_user:LohnPw2025@localhost:5432/payroll_sk
set SESSION_SECRET=swiss-payroll-secret-key-2025-min-32-chars
set PORT=5000

REM Start the application
npm run dev

pause
