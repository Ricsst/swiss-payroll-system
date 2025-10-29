# Windows Update-Anleitung

## Problem
Nach `git pull` wurden die manuellen Windows-Anpassungen überschrieben und die App startet nicht mehr.

## Lösung: Automatisches Update

### Schritt 1: Auf Ihrem PC - Git Pull
```cmd
cd C:\Users\rs\Payroll-Lohnbuchhaltung
git pull
```

**Erwartete Ausgabe:**
```
Updating...
Fast-forward
 server/index.ts | 20 +++++++++++++++-----
 server/db.ts    | ...
```

### Schritt 2: .env Datei prüfen

**Öffnen Sie** `C:\Users\rs\Payroll-Lohnbuchhaltung\.env`

**Inhalt sollte sein:**
```env
# Drei separate Datenbanken für SK, WIF, QCS
DATABASE_URL_FIRMA_A=postgresql://payroll_user:LohnPw2025@localhost:5432/payroll_sk
DATABASE_URL_FIRMA_B=postgresql://payroll_user:LohnPw2025@localhost:5432/payroll_wif
DATABASE_URL_FIRMA_C=postgresql://payroll_user:LohnPw2025@localhost:5432/payroll_qcs

# Session-Secret
SESSION_SECRET=swiss-payroll-secret-2025

PORT=5000
NODE_ENV=development
```

**Falls die Datei fehlt oder falsch ist**, erstellen/korrigieren Sie sie!

### Schritt 3: App starten

```cmd
cd C:\Users\rs\Payroll-Lohnbuchhaltung
LohnbuchhaltungStart.bat
```

**Erwartete Ausgabe:**
```
✓ All databases are accessible
serving on port 5000
```

**Browser öffnet automatisch:** http://localhost:5000

---

## Testdaten importieren (Firma B - WIF)

### Schritt 1: SQL-Datei importieren

**In pgAdmin:**
1. Rechtsklick auf **"payroll_wif"** → **"Query Tool"**
2. **Datei** → **"Open File"** → `C:\Users\rs\Payroll-Lohnbuchhaltung\payroll_wif_complete.sql`
3. **F5** drücken

**Oder mit CMD:**
```cmd
cd "C:\Program Files\PostgreSQL\17\bin"
psql -U payroll_user -d payroll_wif -f "C:\Users\rs\Payroll-Lohnbuchhaltung\payroll_wif_complete.sql"
```
Passwort: `LohnPw2025`

**Erwartete Ausgabe:**
```
CREATE TABLE
CREATE TABLE
...
INSERT 0 1
INSERT 0 1
...
Query returned successfully
```

### Schritt 2: In der App testen

1. Öffnen Sie: http://localhost:5000
2. Wählen Sie: **"Firma B (WIF)"**
3. **Alle Testdaten sollten da sein!** ✅

---

## Wichtige Dateien für Windows

Die folgenden Dateien sind **speziell für Windows angepasst** und werden jetzt automatisch via Git synchronisiert:

- `server/index.ts` - Verwendet `localhost` statt `0.0.0.0` auf Windows
- `server/db.ts` - Unterstützt drei separate Datenbanken
- `LohnbuchhaltungStart.bat` - Windows-Startskript

**Sie müssen diese Dateien NICHT mehr manuell ändern!**

---

## Tägliche Verwendung

```cmd
cd C:\Users\rs\Payroll-Lohnbuchhaltung
LohnbuchhaltungStart.bat
```

**Stoppen:** `Strg+C` im Terminal

---

## Updates in Zukunft

```cmd
cd C:\Users\rs\Payroll-Lohnbuchhaltung
git pull
npm install
LohnbuchhaltungStart.bat
```

**Fertig!** 🇨🇭
