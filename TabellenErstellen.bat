@echo off
echo =============================================
echo Swiss Payroll System - Tabellen erstellen
echo =============================================
echo.

REM Tabellen für SK erstellen
echo [1/3] Erstelle Tabellen fuer Firma SK...
set DATABASE_URL=postgresql://payroll_user:LohnPw2025@localhost:5432/payroll_sk
call npm run db:push
if errorlevel 1 (
    echo FEHLER beim Erstellen der SK Tabellen!
    pause
    exit /b 1
)
echo Fertig: SK Tabellen erstellt!
echo.

REM Tabellen für WIF erstellen
echo [2/3] Erstelle Tabellen fuer Firma WIF...
set DATABASE_URL=postgresql://payroll_user:LohnPw2025@localhost:5432/payroll_wif
call npm run db:push
if errorlevel 1 (
    echo FEHLER beim Erstellen der WIF Tabellen!
    pause
    exit /b 1
)
echo Fertig: WIF Tabellen erstellt!
echo.

REM Tabellen für QCS erstellen
echo [3/3] Erstelle Tabellen fuer Firma QCS...
set DATABASE_URL=postgresql://payroll_user:LohnPw2025@localhost:5432/payroll_qcs
call npm run db:push
if errorlevel 1 (
    echo FEHLER beim Erstellen der QCS Tabellen!
    pause
    exit /b 1
)
echo Fertig: QCS Tabellen erstellt!
echo.

echo =============================================
echo ERFOLG! Alle Tabellen wurden erstellt!
echo =============================================
echo.
echo Sie koennen jetzt die Testdaten importieren:
echo 1. pgAdmin oeffnen
echo 2. Rechtsklick auf "payroll_wif" -^> "Query Tool"
echo 3. Datei oeffnen: replit_export.sql
echo 4. F5 druecken
echo.
pause
