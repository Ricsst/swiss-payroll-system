# Swiss Payroll Management System

Ein umfassendes Lohnprogramm für Schweizer Unternehmen mit automatischen Sozialversicherungs-Berechnungen, Lohnausweis-Generierung und mehrmandantenfähiger Architektur.

## Features

- 🏢 **Multi-Tenant-Architektur** - Eine Installation für mehrere Firmen
- 💰 **Schweizer Sozialversicherungen** - AHV, ALV, SUVA, BVG mit kumulativen Berechnungen
- 📊 **Lohnausweis-Generierung** - Automatische PDF-Erstellung
- 📄 **QCS PDF Import** - Import von bestehenden Lohndaten
- 📈 **Monats- und Jahresberichte** - Umfassende Auswertungen
- 🔒 **Datensicherheit** - Separate Datenbanken pro Firma

## Architektur

**Option B1: Multi-Tenant mit separaten Datenbanken**

```
Eine App-Installation
├── PostgreSQL Datenbank: Firma A
├── PostgreSQL Datenbank: Firma B
└── PostgreSQL Datenbank: Firma C
```

**Vorteile:**
- ✅ Zentrale Code-Verwaltung
- ✅ Updates mit einem Klick für alle Firmen
- ✅ Maximale Datentrennung (separate DBs)
- ✅ Schweizer Datenschutz-konform
- ✅ Einfache Skalierung

## Installation

### Entwicklung (Replit)

1. Repository klonen
2. Dependencies installieren:
   ```bash
   npm install
   ```
3. Umgebungsvariablen setzen (`.env`):
   ```env
   DATABASE_URL=postgresql://...
   SESSION_SECRET=your-secret-here
   ```
4. Datenbank-Schema erstellen:
   ```bash
   npm run db:push
   ```
5. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

### Produktion (Self-Hosted Server)

**Vollständige Anleitung:** Siehe [INSTALLATION.md](./INSTALLATION.md)

**Kurzanleitung:**
1. PostgreSQL installieren und 3 Datenbanken erstellen
2. Node.js 20 LTS installieren
3. Code von GitHub klonen
4. Dependencies installieren: `npm install`
5. Build erstellen: `npm run build`
6. Als Systemdienst einrichten
7. Von Arbeitsstationen zugreifen: `http://server-ip:5000`

## Technologie-Stack

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js
- **Datenbank:** PostgreSQL (Neon Serverless)
- **ORM:** Drizzle ORM
- **Validierung:** Zod
- **PDF-Generierung:** pdf-lib, jsPDF
- **Session-Management:** express-session + memorystore

### Frontend
- **Framework:** React 18 + TypeScript
- **Build-Tool:** Vite
- **UI-Komponenten:** shadcn/ui (Radix UI)
- **Styling:** TailwindCSS
- **State Management:** TanStack Query
- **Routing:** Wouter
- **Forms:** React Hook Form + Zod

## Struktur

```
├── client/               # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/       # Seiten-Komponenten
│   │   ├── components/  # UI-Komponenten
│   │   └── lib/         # Helper & Utilities
├── server/              # Backend (Express)
│   ├── routes.ts        # API-Endpunkte
│   ├── storage.ts       # Datenbank-Logik
│   ├── db.ts            # Multi-Tenant DB-Verbindungen
│   ├── middleware/      # Express-Middleware
│   ├── services/        # Business-Logik
│   └── utils/           # PDF/Excel-Generierung
├── shared/              # Gemeinsamer Code
│   └── schema.ts        # Drizzle-Schema & Zod-Validierung
└── INSTALLATION.md      # Server-Installationsanleitung
```

## Verwendung

### 1. Firma auswählen

Beim ersten Zugriff erscheint die Firma-Auswahl:
- Firma A
- Firma B
- Firma C

Jede Firma hat ihre eigene, komplett separate Datenbank.

### 2. Firmendaten konfigurieren

Gehen Sie zu **Firma** und erfassen Sie:
- Firmenadresse
- AHV-Abrechnungsnummer
- SUVA-Kundennummer
- Beitragssätze (AHV, ALV, SUVA, etc.)

### 3. Mitarbeiter erfassen

Gehen Sie zu **Mitarbeiter** und erfassen Sie:
- Personalien
- AHV-Nummer
- Bankverbindung
- Versicherungseinstellungen
- Standard-Lohnwerte

### 4. Lohn erfassen

Gehen Sie zu **Lohnerfassung** und erfassen Sie:
- Monatslohn oder Stundenlohn
- Zulagen
- Abzüge
- Kinderzulagen

Das System berechnet automatisch:
- Bruttolohn
- AHV/ALV/SUVA-Abzüge
- BVG-Abzüge
- Nettolohn

### 5. Berichte generieren

- **Monatslohnblätter:** Einzelne PDFs pro Mitarbeiter
- **Monatsabrechnung:** Zusammenfassung aller Löhne
- **Jahresabrechnung:** Jahresübersicht
- **Lohnausweise:** Automatische Generierung

## Updates

### Via GitHub (Production)

```bash
# Als payroll-User
cd /home/payroll/app
git pull
npm install
npm run build
npm run db:push
sudo systemctl restart payroll
```

Oder verwenden Sie das Update-Skript:

```bash
~/update-app.sh
```

### Via Replit (Development)

Updates werden automatisch erkannt und die App neu geladen.

## Datenschutz & Sicherheit

- ✅ Separate Datenbanken pro Firma
- ✅ Alle Daten bleiben auf Ihrem Server
- ✅ Session-basierte Authentifizierung
- ✅ Keine Cloud-Speicherung von Lohndaten
- ✅ Schweizer Datenschutzgesetz-konform

## Support

Bei Fragen oder Problemen:

1. **Logs prüfen:**
   ```bash
   sudo journalctl -u payroll -n 100
   ```

2. **Datenbank-Status:**
   ```bash
   sudo systemctl status postgresql
   ```

3. **App-Status:**
   ```bash
   sudo systemctl status payroll
   ```

## Lizenz

Proprietär - Alle Rechte vorbehalten

## Entwickelt mit

- ❤️ Für Schweizer KMU
- 🇨🇭 Nach Schweizer Standards
- 🔒 Mit Fokus auf Datenschutz
