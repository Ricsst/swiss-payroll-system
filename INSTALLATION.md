# Server-Installation: Swiss Payroll Management System

**Version:** Option B1 - Eine App-Installation + Drei separate PostgreSQL-Datenbanken

Diese Anleitung führt Sie durch die komplette Installation des Lohnprogramms auf Ihrem Firmenserver.

---

## Übersicht

Das System besteht aus:
- **Einer App-Installation** (Code wird nur einmal installiert)
- **Drei separaten PostgreSQL-Datenbanken** (eine für jede Firma)
- **Automatischen Updates über GitHub**
- **Zugriff von allen Arbeitsstationen im Netzwerk**

---

## Voraussetzungen

### Server-Anforderungen
- **Betriebssystem:** Ubuntu 20.04 LTS oder neuer (empfohlen) oder Debian 11+
- **RAM:** Mindestens 2 GB
- **Festplatte:** Mindestens 10 GB freier Speicher
- **Netzwerk:** Feste IP-Adresse im lokalen Netzwerk (z.B. 192.168.1.100)

### Arbeitsstationen
- **Browser:** Chrome, Firefox oder Edge (aktuellste Version)
- **Netzwerk:** Verbindung zum Server über LAN/WLAN

---

## Teil 1: Server-Vorbereitung

### Schritt 1: Server aktualisieren

Melden Sie sich am Server an (z.B. per SSH) und führen Sie folgende Befehle aus:

```bash
sudo apt update
sudo apt upgrade -y
```

### Schritt 2: PostgreSQL installieren

PostgreSQL ist die Datenbank, die alle Firmendaten speichert.

```bash
# PostgreSQL installieren
sudo apt install postgresql postgresql-contrib -y

# PostgreSQL-Dienst starten
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Status prüfen (sollte "active (running)" anzeigen)
sudo systemctl status postgresql
```

### Schritt 3: Datenbanken erstellen

Jetzt erstellen wir drei separate Datenbanken für die drei Firmen:

```bash
# Als PostgreSQL-Benutzer anmelden
sudo -u postgres psql

# Folgende Befehle in der PostgreSQL-Konsole eingeben:
```

In der PostgreSQL-Konsole (erkennbar an `postgres=#`):

```sql
-- Benutzer erstellen
CREATE USER payroll_user WITH PASSWORD 'IHR_SICHERES_PASSWORT_HIER';

-- Datenbank für Firma A
CREATE DATABASE payroll_firma_a OWNER payroll_user;

-- Datenbank für Firma B
CREATE DATABASE payroll_firma_b OWNER payroll_user;

-- Datenbank für Firma C
CREATE DATABASE payroll_firma_c OWNER payroll_user;

-- Berechtigungen erteilen
GRANT ALL PRIVILEGES ON DATABASE payroll_firma_a TO payroll_user;
GRANT ALL PRIVILEGES ON DATABASE payroll_firma_b TO payroll_user;
GRANT ALL PRIVILEGES ON DATABASE payroll_firma_c TO payroll_user;

-- PostgreSQL-Konsole verlassen
\q
```

**Wichtig:** Ersetzen Sie `IHR_SICHERES_PASSWORT_HIER` durch ein sicheres Passwort (mindestens 16 Zeichen, Buchstaben, Zahlen, Sonderzeichen).

### Schritt 4: Node.js installieren

Node.js ist die Laufzeitumgebung für die App.

```bash
# Node.js 20 LTS installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installation prüfen
node --version   # Sollte v20.x.x anzeigen
npm --version    # Sollte 10.x.x anzeigen
```

### Schritt 5: Git installieren

Git wird für Updates verwendet.

```bash
sudo apt install git -y

# Installation prüfen
git --version
```

---

## Teil 2: App-Installation

### Schritt 1: Benutzer erstellen

Erstellen Sie einen eigenen Benutzer für die App (aus Sicherheitsgründen):

```bash
# Benutzer erstellen
sudo adduser payroll

# Sie werden nach einem Passwort gefragt - wählen Sie ein sicheres Passwort
# Die anderen Fragen können Sie mit Enter überspringen
```

### Schritt 2: Code von GitHub holen

```bash
# Als payroll-Benutzer anmelden
sudo su - payroll

# In das Home-Verzeichnis wechseln
cd /home/payroll

# Code von GitHub klonen
git clone https://github.com/IHR-GITHUB-USERNAME/swiss-payroll-management.git app
# Ersetzen Sie IHR-GITHUB-USERNAME mit Ihrem tatsächlichen GitHub-Benutzernamen

# In das App-Verzeichnis wechseln
cd app
```

**Hinweis:** Wenn Ihr Repository privat ist, müssen Sie sich bei GitHub authentifizieren. GitHub wird Sie nach Benutzername und Passwort/Token fragen.

### Schritt 3: Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env`-Datei mit den Datenbankverbindungen:

```bash
nano .env
```

Fügen Sie folgenden Inhalt ein (ersetzen Sie die Platzhalter):

```env
# WICHTIG: Alle drei DATABASE_URLs MÜSSEN gesetzt sein!
# Jede Firma MUSS ihre eigene separate Datenbank haben!
DATABASE_URL_FIRMA_A=postgresql://payroll_user:IHR_PASSWORT@localhost:5432/payroll_firma_a
DATABASE_URL_FIRMA_B=postgresql://payroll_user:IHR_PASSWORT@localhost:5432/payroll_firma_b
DATABASE_URL_FIRMA_C=postgresql://payroll_user:IHR_PASSWORT@localhost:5432/payroll_firma_c

# Session-Secret (zufällige Zeichenfolge, mindestens 32 Zeichen)
# Generieren Sie mit: openssl rand -hex 32
SESSION_SECRET=GENERIEREN_SIE_EINE_ZUFÄLLIGE_ZEICHENFOLGE_HIER

# Port
PORT=5000

# Umgebung
NODE_ENV=production
```

**⚠️ SEHR WICHTIG - Datensicherheit:**
- **ALLE DREI** `DATABASE_URL_FIRMA_*` Variablen MÜSSEN gesetzt sein!
- Jede URL MUSS auf eine **unterschiedliche Datenbank** zeigen!
- Die App startet NICHT, wenn:
  - Eine der URLs fehlt
  - Zwei Firmen dieselbe Datenbank verwenden
- Dies garantiert die **komplette Datentrennung** zwischen den Firmen

**Konfiguration:**
- Ersetzen Sie `IHR_PASSWORT` mit dem PostgreSQL-Passwort aus Schritt 3 von Teil 1
- Generieren Sie `SESSION_SECRET` mit: `openssl rand -hex 32`

Speichern und schließen: `Ctrl+O`, `Enter`, `Ctrl+X`

### Schritt 4: Konfiguration testen

Bevor Sie fortfahren, testen Sie die Konfiguration:

```bash
# Prüfen, ob alle Umgebungsvariablen gesetzt sind
cat .env | grep DATABASE_URL_FIRMA

# Sie sollten drei Zeilen sehen:
# DATABASE_URL_FIRMA_A=...
# DATABASE_URL_FIRMA_B=...
# DATABASE_URL_FIRMA_C=...

# SESSION_SECRET generieren (falls noch nicht gemacht)
openssl rand -hex 32
# Kopieren Sie das Ergebnis in die .env-Datei
```

### Schritt 5: App-Abhängigkeiten installieren

```bash
# Dependencies installieren
npm install

# Produktionsbuild erstellen
npm run build

# Datenbank-Schema initialisieren
npm run db:push
```

**Wichtig:** 
- Die App validiert beim Start, dass alle drei Datenbank-URLs gesetzt und unterschiedlich sind
- Wenn eine URL fehlt oder dupliziert ist, startet die App NICHT (Sicherheitsfeature)
- `npm run db:push` erstellt die Tabellen in allen drei Datenbanken

**Bei Fehlern:**
Wenn Sie eine Fehlermeldung wie "Missing required database configuration" erhalten:
1. Prüfen Sie, ob alle drei `DATABASE_URL_FIRMA_*` in `.env` gesetzt sind
2. Stellen Sie sicher, dass die Datenbanknamen unterschiedlich sind
3. Testen Sie die Verbindung: `sudo -u postgres psql -d payroll_firma_a`

### Schritt 5: App testen

Testen Sie, ob die App funktioniert:

```bash
npm start
```

Die App sollte jetzt laufen. Sie sehen eine Ausgabe wie:
```
serving on port 5000
```

Öffnen Sie einen Browser auf dem Server und gehen Sie zu: `http://localhost:5000`

Wenn die Firma-Auswahl-Seite erscheint, funktioniert alles!

Beenden Sie die App mit `Ctrl+C`.

---

## Teil 3: Systemdienst einrichten

Damit die App automatisch beim Serverstart läuft und immer im Hintergrund aktiv ist:

### Schritt 1: Systemd-Service-Datei erstellen

Beenden Sie die Sitzung als `payroll`-Benutzer:

```bash
exit  # Zurück zum normalen Benutzer
```

Erstellen Sie eine Service-Datei:

```bash
sudo nano /etc/systemd/system/payroll.service
```

Fügen Sie folgenden Inhalt ein:

```ini
[Unit]
Description=Swiss Payroll Management System
After=network.target postgresql.service

[Service]
Type=simple
User=payroll
WorkingDirectory=/home/payroll/app
ExecStart=/usr/bin/node /home/payroll/app/server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Speichern und schließen: `Ctrl+O`, `Enter`, `Ctrl+X`

### Schritt 2: Dienst aktivieren und starten

```bash
# Systemd neu laden
sudo systemctl daemon-reload

# Dienst beim Serverstart aktivieren
sudo systemctl enable payroll

# Dienst jetzt starten
sudo systemctl start payroll

# Status prüfen
sudo systemctl status payroll
```

Der Status sollte **"active (running)"** anzeigen.

### Schritt 3: Logs anzeigen

Um die App-Logs anzuzeigen:

```bash
# Aktuelle Logs anzeigen
sudo journalctl -u payroll -n 50

# Logs live verfolgen
sudo journalctl -u payroll -f
```

---

## Teil 4: Firewall konfigurieren (optional aber empfohlen)

Wenn Ihr Server eine Firewall hat, müssen Sie Port 5000 öffnen:

```bash
# UFW Firewall (Ubuntu)
sudo ufw allow 5000/tcp
sudo ufw reload

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

---

## Teil 5: Zugriff von Arbeitsstationen

### Schritt 1: Server-IP-Adresse ermitteln

Auf dem Server:

```bash
ip addr show
```

Suchen Sie nach der IP-Adresse im Format `192.168.x.x` oder `10.x.x.x`.

Beispiel: `192.168.1.100`

### Schritt 2: Von Arbeitsstation zugreifen

Auf jedem PC/Laptop im Firmennetzwerk:

1. **Browser öffnen** (Chrome, Firefox oder Edge)
2. **In die Adresszeile eingeben:**
   ```
   http://192.168.1.100:5000
   ```
   (Ersetzen Sie `192.168.1.100` mit der tatsächlichen IP-Adresse Ihres Servers)
3. **Enter drücken**
4. **Firma auswählen** (Firma A, B oder C)
5. **Mit der Arbeit beginnen!**

### Schritt 3: Lesezeichen erstellen (empfohlen)

Damit Mitarbeiter nicht jedes Mal die IP-Adresse eingeben müssen:

1. Öffnen Sie die App im Browser
2. Drücken Sie `Ctrl+D` (oder Stern-Symbol)
3. Speichern Sie das Lesezeichen als "Lohnprogramm"

---

## Teil 6: Updates durchführen

Wenn eine neue Version der App verfügbar ist:

### Automatisches Update-Skript

Erstellen Sie ein Update-Skript:

```bash
sudo su - payroll
nano ~/update-app.sh
```

Inhalt:

```bash
#!/bin/bash
cd /home/payroll/app
git pull
npm install
npm run build
npm run db:push
sudo systemctl restart payroll
echo "Update abgeschlossen!"
```

Speichern und schließen, dann ausführbar machen:

```bash
chmod +x ~/update-app.sh
exit
```

### Update durchführen

```bash
sudo su - payroll
~/update-app.sh
```

Das Update wird automatisch durchgeführt und die App neu gestartet.

---

## Problembehandlung

### App startet nicht

```bash
# Logs prüfen
sudo journalctl -u payroll -n 100

# Häufige Probleme:
# - Datenbank läuft nicht: sudo systemctl start postgresql
# - Falsches Passwort in .env
# - Port 5000 bereits belegt: sudo lsof -i :5000
```

### Datenbank-Verbindungsfehler

```bash
# PostgreSQL-Status prüfen
sudo systemctl status postgresql

# Datenbanken auflisten
sudo -u postgres psql -l

# Verbindung testen
sudo -u postgres psql -d payroll_firma_a
```

### Arbeitsstationen können nicht zugreifen

1. **Ping-Test:**
   ```bash
   ping 192.168.1.100
   ```
   Sollte Antworten erhalten

2. **Firewall prüfen:**
   ```bash
   sudo ufw status
   ```

3. **App läuft:**
   ```bash
   sudo systemctl status payroll
   ```

---

## Sicherheitshinweise

1. **Regelmäßige Backups:**
   ```bash
   # Datenbank sichern
   sudo -u postgres pg_dump payroll_firma_a > backup_firma_a_$(date +%Y%m%d).sql
   sudo -u postgres pg_dump payroll_firma_b > backup_firma_b_$(date +%Y%m%d).sql
   sudo -u postgres pg_dump payroll_firma_c > backup_firma_c_$(date +%Y%m%d).sql
   ```

2. **SSL/HTTPS einrichten (empfohlen):**
   - Verwenden Sie einen Reverse Proxy wie NGINX
   - Installieren Sie ein SSL-Zertifikat (z.B. Let's Encrypt)

3. **Starke Passwörter:**
   - Verwenden Sie unterschiedliche Passwörter für jede Firma
   - Ändern Sie Passwörter regelmäßig

4. **Zugriffsbeschränkung:**
   - Beschränken Sie den Zugriff auf vertrauenswürdige IP-Adressen

---

## Zusammenfassung

✅ **Installiert:**
- PostgreSQL mit 3 separaten Datenbanken
- Node.js und die Lohn-App
- Systemdienst für automatischen Start

✅ **Zugriff:**
- Von allen Arbeitsstationen: `http://SERVER-IP:5000`
- Firma-Auswahl beim ersten Zugriff

✅ **Updates:**
- Einfach per Git Pull und Neustart
- Alle Firmen gleichzeitig aktualisiert

✅ **Datenschutz:**
- Drei komplett separate Datenbanken
- Alle Daten bleiben auf Ihrem Server

---

## Support

Bei Fragen oder Problemen:
1. Überprüfen Sie die Logs: `sudo journalctl -u payroll -n 100`
2. Prüfen Sie die Datenbank-Verbindung
3. Stellen Sie sicher, dass alle Dienste laufen

**Viel Erfolg mit Ihrem Lohnprogramm!**
