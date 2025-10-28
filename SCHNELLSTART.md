# Schnellstart-Anleitung: Swiss Payroll System

## System-Übersicht

**Architektur**: Option B1 (Multi-Tenant mit separaten Datenbanken)
- **1 App-Installation** verwaltet **3 separate PostgreSQL-Datenbanken**
- Jede Firma (A, B, C) hat ihre eigene isolierte Datenbank
- Zentrale Updates über GitHub
- Zugriff von Arbeitsstationen via Browser (http://server-ip:5000)

---

## Voraussetzungen

- Linux-Server (Ubuntu/Debian empfohlen)
- PostgreSQL 14+
- Node.js 20+
- Git

---

## Installation in 5 Schritten

### 1️⃣ PostgreSQL einrichten

```bash
# PostgreSQL installieren
sudo apt update
sudo apt install postgresql postgresql-contrib

# Datenbanken erstellen
sudo -u postgres psql
```

```sql
-- Benutzer erstellen
CREATE USER payroll_user WITH PASSWORD 'IhrSicheresPasswort123';

-- Drei separate Datenbanken erstellen
CREATE DATABASE payroll_firma_a OWNER payroll_user;
CREATE DATABASE payroll_firma_b OWNER payroll_user;
CREATE DATABASE payroll_firma_c OWNER payroll_user;

-- Rechte vergeben
GRANT ALL PRIVILEGES ON DATABASE payroll_firma_a TO payroll_user;
GRANT ALL PRIVILEGES ON DATABASE payroll_firma_b TO payroll_user;
GRANT ALL PRIVILEGES ON DATABASE payroll_firma_c TO payroll_user;

\q
```

---

### 2️⃣ Node.js installieren

```bash
# Node.js 20 installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Überprüfen
node --version  # sollte v20.x.x zeigen
npm --version
```

---

### 3️⃣ App herunterladen und konfigurieren

```bash
# Repository klonen
cd /opt
sudo git clone <IHR_GITHUB_REPO_URL> payroll-system
cd payroll-system
sudo chown -R $USER:$USER /opt/payroll-system

# .env-Datei erstellen
nano .env
```

**.env Inhalt** (KRITISCH - alle drei URLs müssen unterschiedlich sein!):

```env
# ⚠️ WICHTIG: Alle drei DATABASE_URLs MÜSSEN gesetzt und unterschiedlich sein!
DATABASE_URL_FIRMA_A=postgresql://payroll_user:IhrSicheresPasswort123@localhost:5432/payroll_firma_a
DATABASE_URL_FIRMA_B=postgresql://payroll_user:IhrSicheresPasswort123@localhost:5432/payroll_firma_b
DATABASE_URL_FIRMA_C=postgresql://payroll_user:IhrSicheresPasswort123@localhost:5432/payroll_firma_c

# Session-Secret generieren mit: openssl rand -hex 32
SESSION_SECRET=<HIER_ZUFÄLLIGE_ZEICHENFOLGE_EINFÜGEN>

PORT=5000
NODE_ENV=production
```

**Session-Secret generieren**:
```bash
openssl rand -hex 32
# Ergebnis in .env kopieren
```

---

### 4️⃣ App installieren und testen

```bash
# Dependencies installieren
npm install

# Build erstellen
npm run build

# Datenbank-Schema initialisieren
npm run db:push

# Test-Start (sollte "✓ All databases are accessible" zeigen)
npm run dev
```

**Erwartete Ausgabe**:
```
✓ All databases are accessible
serving on port 5000
```

Drücken Sie `Ctrl+C` um zu stoppen.

---

### 5️⃣ Systemdienst einrichten (Auto-Start)

```bash
# Systemd-Service erstellen
sudo nano /etc/systemd/system/payroll.service
```

**Inhalt**:
```ini
[Unit]
Description=Swiss Payroll System
After=network.target postgresql.service

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/opt/payroll-system
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Ersetzen Sie `YOUR_USERNAME` mit Ihrem Benutzernamen (z.B. `ubuntu`)

**Service aktivieren**:
```bash
# Service neu laden
sudo systemctl daemon-reload

# Service starten
sudo systemctl start payroll

# Status prüfen
sudo systemctl status payroll

# Auto-Start aktivieren
sudo systemctl enable payroll
```

---

## ✅ Zugriff von Arbeitsstationen

1. **Server-IP ermitteln**:
   ```bash
   ip addr show | grep "inet "
   # z.B. 192.168.1.100
   ```

2. **Von Arbeitsstation** Browser öffnen:
   ```
   http://192.168.1.100:5000
   ```

3. **Firma auswählen** → Anmelden → Loslegen!

---

## 🔄 Updates durchführen

Updates werden zentral über GitHub verteilt:

```bash
# Zum App-Verzeichnis
cd /opt/payroll-system

# Neueste Version holen
git pull origin main

# Dependencies aktualisieren (falls nötig)
npm install

# Neuen Build erstellen
npm run build

# Datenbank-Schema aktualisieren
npm run db:push

# Service neu starten
sudo systemctl restart payroll

# Status prüfen
sudo systemctl status payroll
```

**Ein Update → Alle drei Firmen profitieren sofort!**

---

## 🔧 Nützliche Befehle

### Service verwalten
```bash
sudo systemctl status payroll    # Status anzeigen
sudo systemctl restart payroll   # Neu starten
sudo systemctl stop payroll      # Stoppen
sudo systemctl start payroll     # Starten
sudo journalctl -u payroll -f    # Logs live anzeigen
```

### Datenbank prüfen
```bash
# Als Firma A verbinden
sudo -u postgres psql -d payroll_firma_a

# Tabellen anzeigen
\dt

# Verbindung beenden
\q
```

---

## ⚠️ Wichtige Sicherheitshinweise

1. **Separate Datenbanken sind Pflicht**
   - Die App startet NICHT, wenn eine DATABASE_URL fehlt
   - In Produktion müssen alle URLs unterschiedlich sein
   - Dies garantiert komplette Datentrennung

2. **Regelmäßige Backups**
   ```bash
   # Backup erstellen (für jede Firma)
   pg_dump -U payroll_user payroll_firma_a > backup_firma_a.sql
   pg_dump -U payroll_user payroll_firma_b > backup_firma_b.sql
   pg_dump -U payroll_user payroll_firma_c > backup_firma_c.sql
   ```

3. **Firewall konfigurieren**
   ```bash
   # Port 5000 nur für lokales Netzwerk öffnen
   sudo ufw allow from 192.168.1.0/24 to any port 5000
   ```

---

## 🆘 Problemlösung

### App startet nicht
```bash
# Logs prüfen
sudo journalctl -u payroll -n 50

# Häufige Ursachen:
# - Fehlende DATABASE_URL_FIRMA_* in .env
# - PostgreSQL läuft nicht: sudo systemctl start postgresql
# - Falsche Datenbank-Passwörter
```

### "Database health check failed"
```bash
# Datenbank-Verbindung testen
sudo -u postgres psql -d payroll_firma_a

# Falls Fehler: Passwort in .env überprüfen
```

### Port bereits belegt
```bash
# Anderen Port in .env setzen:
PORT=5001

# Service neu starten
sudo systemctl restart payroll
```

---

## 📞 Support

Bei Fragen zur Installation konsultieren Sie die ausführliche **INSTALLATION.md** Datei.

---

**Viel Erfolg mit Ihrem Swiss Payroll System! 🇨🇭**
