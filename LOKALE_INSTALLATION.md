# Lokale Installation auf eigenem PC

Diese Anleitung zeigt, wie Sie das Swiss Payroll System auf Ihrem **eigenen PC** (Windows, macOS oder Linux) mit **drei separaten Datenbanken** installieren.

**Verwendungszweck**: Entwicklung, Testing oder persönliche Nutzung auf einem Arbeitsplatz-PC

---

## Voraussetzungen

- **Windows 10/11**, **macOS 12+** oder **Linux** (Ubuntu/Debian)
- Internetverbindung für Downloads
- Administratorrechte auf dem PC
- Ca. 2 GB freier Festplattenspeicher

---

## Installation nach Betriebssystem

Wählen Sie Ihr Betriebssystem:
- [🪟 Windows](#windows-installation)
- [🍎 macOS](#macos-installation)
- [🐧 Linux](#linux-installation)

---

# 🪟 Windows Installation

## Schritt 1: PostgreSQL installieren

### 1.1 PostgreSQL herunterladen
1. Besuchen Sie: https://www.postgresql.org/download/windows/
2. Laden Sie den **PostgreSQL 16 Installer** herunter (ca. 300 MB)
3. Führen Sie die .exe-Datei aus

### 1.2 Installation durchführen
- **Passwort festlegen**: Notieren Sie sich das Passwort für den `postgres` Benutzer!
- **Port**: Lassen Sie `5432` (Standard)
- **Locale**: Wählen Sie `German, Switzerland` oder `Default locale`
- Komponenten: Alle Optionen aktiviert lassen

### 1.3 Datenbanken erstellen

**Öffnen Sie die Kommandozeile** (Windows-Taste + R → `cmd` → Enter):

```cmd
cd "C:\Program Files\PostgreSQL\16\bin"
```

**Verbinden Sie sich mit PostgreSQL**:
```cmd
psql -U postgres
```
(Geben Sie Ihr Passwort ein)

**Erstellen Sie die drei Datenbanken**:
```sql
-- Benutzer erstellen
CREATE USER payroll_user WITH PASSWORD 'MeinPasswort123';

-- Drei separate Datenbanken erstellen
CREATE DATABASE payroll_firma_a OWNER payroll_user;
CREATE DATABASE payroll_firma_b OWNER payroll_user;
CREATE DATABASE payroll_firma_c OWNER payroll_user;

-- Rechte vergeben
GRANT ALL PRIVILEGES ON DATABASE payroll_firma_a TO payroll_user;
GRANT ALL PRIVILEGES ON DATABASE payroll_firma_b TO payroll_user;
GRANT ALL PRIVILEGES ON DATABASE payroll_firma_c TO payroll_user;

-- Beenden
\q
```

---

## Schritt 2: Node.js installieren

1. Besuchen Sie: https://nodejs.org/
2. Laden Sie die **LTS-Version** (z.B. 20.x) herunter
3. Führen Sie den Installer aus (Standard-Einstellungen verwenden)

**Überprüfen der Installation**:
Öffnen Sie eine **neue** Kommandozeile:
```cmd
node --version
npm --version
```

---

## Schritt 3: Projekt herunterladen

### Option A: Mit Git (empfohlen)

1. **Git installieren**: https://git-scm.com/download/win
2. **Projekt klonen**:
   ```cmd
   cd C:\Users\%USERNAME%\Documents
   git clone <IHR_GITHUB_REPO_URL> payroll-system
   cd payroll-system
   ```

### Option B: Ohne Git

1. Laden Sie das Projekt als ZIP herunter
2. Entpacken Sie es nach `C:\Users\<IhrName>\Documents\payroll-system`
3. Öffnen Sie die Kommandozeile in diesem Ordner

---

## Schritt 4: Konfiguration

**Erstellen Sie eine `.env` Datei** im Projektordner:

```cmd
notepad .env
```

**Fügen Sie folgenden Inhalt ein** (Passwort anpassen!):

```env
# Drei separate Datenbanken (WICHTIG: Alle drei müssen gesetzt sein!)
DATABASE_URL_FIRMA_A=postgresql://payroll_user:MeinPasswort123@localhost:5432/payroll_firma_a
DATABASE_URL_FIRMA_B=postgresql://payroll_user:MeinPasswort123@localhost:5432/payroll_firma_b
DATABASE_URL_FIRMA_C=postgresql://payroll_user:MeinPasswort123@localhost:5432/payroll_firma_c

# Session-Secret (beliebige lange Zeichenfolge)
SESSION_SECRET=mein-geheimes-session-secret-12345678901234567890

PORT=5000
NODE_ENV=development
```

**Speichern**: Datei → Speichern → Notepad schließen

⚠️ **Wichtig**: Ersetzen Sie `MeinPasswort123` mit dem Passwort aus Schritt 1.3!

---

## Schritt 5: App installieren und starten

```cmd
# Dependencies installieren
npm install

# Datenbank-Schema erstellen
npm run db:push

# App starten
npm run dev
```

**Erwartete Ausgabe**:
```
⚠️  Development mode: Using DATABASE_URL as fallback...
✓ All databases are accessible
serving on port 5000
```

---

## Schritt 6: App verwenden

**Öffnen Sie Ihren Browser**:
```
http://localhost:5000
```

✅ **Fertig!** Sie können jetzt zwischen Firma A, B und C wählen.

---

# 🍎 macOS Installation

## Schritt 1: PostgreSQL installieren

### Option A: Mit Homebrew (empfohlen)

```bash
# Homebrew installieren (falls nicht vorhanden)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# PostgreSQL installieren
brew install postgresql@16

# PostgreSQL starten
brew services start postgresql@16
```

### Option B: Mit Postgres.app

1. Laden Sie **Postgres.app** herunter: https://postgresapp.com/
2. Ziehen Sie die App in den Programme-Ordner
3. Starten Sie Postgres.app

---

### Datenbanken erstellen (beide Optionen)

**Terminal öffnen** (Cmd+Space → "Terminal"):

```bash
# Mit PostgreSQL verbinden
psql postgres

# Benutzer und Datenbanken erstellen
CREATE USER payroll_user WITH PASSWORD 'MeinPasswort123';

CREATE DATABASE payroll_firma_a OWNER payroll_user;
CREATE DATABASE payroll_firma_b OWNER payroll_user;
CREATE DATABASE payroll_firma_c OWNER payroll_user;

GRANT ALL PRIVILEGES ON DATABASE payroll_firma_a TO payroll_user;
GRANT ALL PRIVILEGES ON DATABASE payroll_firma_b TO payroll_user;
GRANT ALL PRIVILEGES ON DATABASE payroll_firma_c TO payroll_user;

\q
```

---

## Schritt 2: Node.js installieren

```bash
# Mit Homebrew
brew install node@20

# Überprüfen
node --version
npm --version
```

Oder laden Sie den Installer herunter: https://nodejs.org/

---

## Schritt 3: Projekt klonen

```bash
# Zum Dokumente-Ordner
cd ~/Documents

# Projekt klonen
git clone <IHR_GITHUB_REPO_URL> payroll-system
cd payroll-system
```

---

## Schritt 4: Konfiguration

**Erstellen Sie eine `.env` Datei**:

```bash
nano .env
```

**Inhalt** (Passwort anpassen!):

```env
DATABASE_URL_FIRMA_A=postgresql://payroll_user:MeinPasswort123@localhost:5432/payroll_firma_a
DATABASE_URL_FIRMA_B=postgresql://payroll_user:MeinPasswort123@localhost:5432/payroll_firma_b
DATABASE_URL_FIRMA_C=postgresql://payroll_user:MeinPasswort123@localhost:5432/payroll_firma_c

SESSION_SECRET=mein-geheimes-session-secret-12345678901234567890

PORT=5000
NODE_ENV=development
```

Speichern: `Ctrl+O` → `Enter` → `Ctrl+X`

---

## Schritt 5: App starten

```bash
# Dependencies installieren
npm install

# Datenbank-Schema erstellen
npm run db:push

# App starten
npm run dev
```

**Browser öffnen**: http://localhost:5000

---

# 🐧 Linux Installation

## Schritt 1: PostgreSQL installieren

### Ubuntu/Debian:

```bash
# System aktualisieren
sudo apt update

# PostgreSQL installieren
sudo apt install postgresql postgresql-contrib

# PostgreSQL-Dienst starten
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Datenbanken erstellen:

```bash
# Als postgres-Benutzer anmelden
sudo -u postgres psql

# SQL-Befehle ausführen
CREATE USER payroll_user WITH PASSWORD 'MeinPasswort123';

CREATE DATABASE payroll_firma_a OWNER payroll_user;
CREATE DATABASE payroll_firma_b OWNER payroll_user;
CREATE DATABASE payroll_firma_c OWNER payroll_user;

GRANT ALL PRIVILEGES ON DATABASE payroll_firma_a TO payroll_user;
GRANT ALL PRIVILEGES ON DATABASE payroll_firma_b TO payroll_user;
GRANT ALL PRIVILEGES ON DATABASE payroll_firma_c TO payroll_user;

\q
```

---

## Schritt 2: Node.js installieren

```bash
# Node.js 20 installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Überprüfen
node --version
npm --version
```

---

## Schritt 3: Projekt klonen

```bash
cd ~
git clone <IHR_GITHUB_REPO_URL> payroll-system
cd payroll-system
```

---

## Schritt 4: Konfiguration

```bash
nano .env
```

**Inhalt**:
```env
DATABASE_URL_FIRMA_A=postgresql://payroll_user:MeinPasswort123@localhost:5432/payroll_firma_a
DATABASE_URL_FIRMA_B=postgresql://payroll_user:MeinPasswort123@localhost:5432/payroll_firma_b
DATABASE_URL_FIRMA_C=postgresql://payroll_user:MeinPasswort123@localhost:5432/payroll_firma_c

SESSION_SECRET=mein-geheimes-session-secret-12345678901234567890

PORT=5000
NODE_ENV=development
```

---

## Schritt 5: App starten

```bash
npm install
npm run db:push
npm run dev
```

**Browser**: http://localhost:5000

---

# 🔧 Allgemeine Hinweise

## Tägliche Verwendung

**App starten**:
```bash
# Zum Projektordner navigieren
cd C:\Users\<Name>\Documents\payroll-system  # Windows
cd ~/Documents/payroll-system                  # macOS/Linux

# App starten
npm run dev
```

**App stoppen**: `Ctrl+C` im Terminal

---

## Datenbanken verwalten

### Datenbank-Backup erstellen

**Windows**:
```cmd
cd "C:\Program Files\PostgreSQL\16\bin"
pg_dump -U payroll_user payroll_firma_a > backup_firma_a.sql
pg_dump -U payroll_user payroll_firma_b > backup_firma_b.sql
pg_dump -U payroll_user payroll_firma_c > backup_firma_c.sql
```

**macOS/Linux**:
```bash
pg_dump -U payroll_user payroll_firma_a > backup_firma_a.sql
pg_dump -U payroll_user payroll_firma_b > backup_firma_b.sql
pg_dump -U payroll_user payroll_firma_c > backup_firma_c.sql
```

### Backup wiederherstellen

```bash
psql -U payroll_user payroll_firma_a < backup_firma_a.sql
```

---

## Datenbank-Inhalte ansehen

**Mit pgAdmin** (grafische Oberfläche):
1. pgAdmin wird mit PostgreSQL installiert
2. Öffnen Sie pgAdmin
3. Verbinden Sie sich mit dem Server
4. Navigieren Sie zu den Datenbanken `payroll_firma_a/b/c`

**Mit SQL** (Kommandozeile):
```bash
# Verbinden
psql -U payroll_user payroll_firma_a

# Tabellen anzeigen
\dt

# Daten anzeigen
SELECT * FROM employees;

# Beenden
\q
```

---

## Updates installieren

Wenn Sie das Projekt von GitHub aktualisieren möchten:

```bash
# Zum Projektordner
cd payroll-system

# Neueste Version holen
git pull

# Dependencies aktualisieren
npm install

# Datenbank aktualisieren
npm run db:push

# App neu starten
npm run dev
```

---

## 🆘 Problemlösung

### PostgreSQL läuft nicht

**Windows**:
1. Windows-Dienste öffnen (`services.msc`)
2. Suchen Sie "postgresql-x64-16"
3. Rechtsklick → Starten

**macOS (Homebrew)**:
```bash
brew services restart postgresql@16
```

**Linux**:
```bash
sudo systemctl restart postgresql
```

---

### Port 5000 bereits belegt

Ändern Sie in der `.env` Datei:
```env
PORT=5001
```

Dann erreichen Sie die App unter: http://localhost:5001

---

### "Database health check failed"

**Überprüfen Sie**:
1. PostgreSQL läuft (siehe oben)
2. Passwort in `.env` ist korrekt
3. Datenbankname ist korrekt geschrieben

**Testen Sie die Verbindung**:
```bash
psql -U payroll_user -d payroll_firma_a
# Wenn das funktioniert, ist die Datenbank OK
```

---

### App startet nicht - "npm: command not found"

Node.js wurde nicht korrekt installiert oder Terminal muss neu gestartet werden.

**Lösung**:
1. Terminal/Kommandozeile schließen
2. Neu öffnen
3. `node --version` testen

---

## 💡 Tipps

### Automatischer Start beim PC-Start

**Windows** (Task-Scheduler):
1. Erstellen Sie eine `start-payroll.bat` Datei:
   ```bat
   cd C:\Users\<Name>\Documents\payroll-system
   npm run dev
   ```
2. Fügen Sie diese zum Autostart hinzu

**macOS/Linux** (ähnlich wie Server-Installation):
Siehe `SCHNELLSTART.md` für systemd-Service Setup

---

### Zugriff von anderen Geräten im Netzwerk

1. **Finden Sie Ihre lokale IP-Adresse**:
   - Windows: `ipconfig` → IPv4-Adresse
   - macOS/Linux: `ifconfig` → inet
   
2. **Firewall-Regel hinzufügen** (Port 5000 erlauben)

3. **Zugriff von anderem Gerät**:
   ```
   http://192.168.1.X:5000
   ```
   (ersetzen Sie X mit Ihrer IP)

---

## 📊 Datentrennung verstehen

Ihre Installation hat **drei vollständig getrennte Datenbanken**:

```
payroll_firma_a → Mitarbeiter, Lohndaten für Firma A
payroll_firma_b → Mitarbeiter, Lohndaten für Firma B  
payroll_firma_c → Mitarbeiter, Lohndaten für Firma C
```

- Jede Firma sieht **nur ihre eigenen Daten**
- Beim Login wählen Sie die Firma
- Die App verbindet sich mit der entsprechenden Datenbank
- **Keine gemeinsame Nutzung** → Maximale Datensicherheit

---

## 📞 Weitere Hilfe

- **Detaillierte Server-Installation**: Siehe `INSTALLATION.md`
- **Schnellstart für Server**: Siehe `SCHNELLSTART.md`
- **Projekt-Dokumentation**: Siehe `README.md`

---

**Viel Erfolg mit Ihrem lokalen Swiss Payroll System! 🇨🇭**
