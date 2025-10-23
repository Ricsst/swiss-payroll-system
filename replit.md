# Swiss Payroll Management System

## Overview

A comprehensive payroll management system for Swiss businesses, designed to manage employee data, process payroll, and generate compliance reports. It handles Swiss-specific social insurance calculations (AHV, ALV, SUVA) and supports both monthly and yearly reporting. The system aims to simplify payroll management and ensure compliance with Swiss regulations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, TypeScript, and Vite, utilizing `shadcn/ui` (New York style) and TailwindCSS for a modern aesthetic. It adheres to Material Design principles adapted for a professional Swiss context, featuring a blue primary color, Inter font for UI, and JetBrains Mono for financial data. It supports a light mode with an optional dark mode. Key pages include Dashboard, Employee Management (with CRUD and Lohnausweis generation), Company Configuration, Streamlined Employee Payroll Entry, Payroll List/Detail (with PDF export), Monthly/Yearly Reports (multi-format export), and Payroll Templates. Recent enhancements include a "Mitarbeiter-Gesamttabelle" for batch editing of employee payroll data, enhanced sorting on employee lists, and a dedicated Employee Payroll Overview page for yearly summaries.

### Technical Implementations
The backend is an Express.js application written in TypeScript (ESM) with a RESTful API. It uses Zod for schema validation. Data is stored in PostgreSQL and accessed via Drizzle ORM for type safety. The system supports dynamic wage type mapping for child allowances, context-aware calculations in payroll entry for various wage types (Monatslohn, Stundenlohn, Bonus, etc.), and includes a lock/unlock mechanism for payroll payments to ensure data integrity. PDF reports, such as monthly reports and individual payroll slips, have a consistent, professional vertical layout.

### Feature Specifications
The system manages employee and company data, payroll item types (configurable wage types with deduction applicability), and payroll payments. It handles Swiss-specific calculations for AHV, ALV, SUVA, and BVG, with smart base amount calculations for deductions. Payroll entry features auto-fill, dynamic wage types, employee navigation, month-based period selection, automatic calculations, and intelligent deduction previews. The system allows for editing of unlocked payroll payments and generates window envelope-compatible payroll slips and various reports.

### System Design Choices
UUIDs are used for primary keys, along with timestamps and decimal types for financial data. The schema includes tables for `companies`, `employees`, `payroll_item_types`, `payroll_payments`, `payroll_items`, `deductions`, and `payroll_templates`. Development utilizes Vite for the client, esbuild for the server, and tsx for hot reloading. Code is organized into `/client`, `/server`, and `/shared` with path aliases for maintainability. Strict TypeScript, Drizzle schema types, and Zod are employed for comprehensive type and runtime validation.

## External Dependencies

### Database & ORM
- **PostgreSQL (Neon Serverless)**
- **Drizzle ORM**
- **@neondatabase/serverless**

### UI Framework & Components
- **Radix UI**
- **shadcn/ui**
- **TailwindCSS**
- **Lucide React**

### Forms & Validation
- **React Hook Form**
- **Zod**
- **@hookform/resolvers**
- **drizzle-zod**

### Data Fetching & State
- **TanStack Query**
- **date-fns**

### Routing & Navigation
- **Wouter**

### Development Tools
- **Vite**
- **tsx**
- **esbuild**
- **Replit plugins**

### Fonts
- **Google Fonts** (Inter, JetBrains Mono)

## Recent Features (October 2025)

### Kumulative ALV-Berechnung mit Höchstlohn-Limit (Oktober 23, 2025)
Das System berechnet jetzt automatisch die ALV (Arbeitslosenversicherung) unter Berücksichtigung des jährlichen Höchstlohns von CHF 148'200.

**Funktionalität:**
- **Automatische kumulative Berechnung**: ALV wird basierend auf dem kumulativen ALV-pflichtigen Einkommen des gesamten Jahres berechnet
- **Höchstlohn-Limit**: Nach Erreichen von CHF 148'200 wird keine ALV mehr abgezogen
- **Automatische Kompensation**: Bei Gehaltsfluktuationen wird der verbleibende ALV-pflichtige Betrag automatisch berechnet
- **Rückwirkende Konsistenz**: Änderungen an vergangenen Lohnauszahlungen werden korrekt verarbeitet

**Beispiel-Szenario:**
- Januar 2025: CHF 6'500 → ALV CHF 71.50 (Basis: CHF 6'500)
- Februar 2025: CHF 8'000 → ALV CHF 88.00 (Basis: CHF 8'000, kumulativ: CHF 14'500)
- März 2025: CHF 140'000 → ALV CHF 1'470.70 (Basis: CHF 133'700, kumulativ: CHF 148'200 - Limit erreicht!)
- April 2025: CHF 10'000 → ALV CHF 0.00 (Basis: CHF 0, über Limit)

**Technische Implementierung:**
- **Backend-Berechnung**: `applyCumulativeAlvLimit()` Hilfsfunktion in storage.ts
  - Lädt alle Lohnauszahlungen des Mitarbeiters für das Jahr
  - Berechnet kumulatives ALV-pflichtiges Einkommen
  - Wendet Höchstlohn-Limit an: `baseAmount = min(currentAmount, 148200 - previousAmount)`
  - Berechnet ALV: `amount = baseAmount * 1.1%`
- **API-Endpunkt**: `/api/payroll/cumulative-alv` für Abfrage kumulativer Daten
- **Automatische Anwendung**: Wird bei jedem Erstellen/Bearbeiten einer Lohnauszahlung ausgeführt
- **Frontend-Vorschau**: Einfache ALV-Vorschau (Backend berechnet finale Werte)

**Edge Cases abgedeckt:**
- Mehrere Zahlungen pro Monat
- Updates an vergangenen Lohnauszahlungen (exkludiert aktuelle Zahlung bei Neuberechnung)
- Unterschiedliche Lohnarten mit `subjectToAlv` Flag

**Datenintegrität:**
- Deductions werden mit jedem Payment gespeichert (historische Genauigkeit)
- Backend-Authority: Alle kumulativen Berechnungen erfolgen im Backend
- Konsistenz über Edits: Bei Änderungen werden Deductions neu berechnet (außer BVG)

### Monatsabrechnung-Aggregation und BVG-Korrekturen (Oktober 23, 2025)

**Monatsabrechnung-Export korrigiert:**
- PDF/Excel-Export zeigt jetzt korrekt **Monatstotals pro Mitarbeiter** statt einzelne Lohnabrechnungen
- Payroll Items werden nach Typ aggregiert und summiert (z.B. alle "Monatslohn" Einträge zusammengefasst)
- Deductions werden nach Typ aggregiert und summiert (z.B. alle "AHV" Abzüge zusammen)
- **Intelligente hourlyRate-Berechnung**: Bei Stundenlohn wird ein gewichteter Durchschnitt berechnet (totalAmount / totalHours)
- Robuste Handhabung von gemischten hourly/non-hourly Items mit demselben Typ
- Beispiel: Michelle Müller mit 5 Lohnauszahlungen im Oktober → PDF zeigt 1 aggregierte Zeile pro Lohnart

**BVG-Berechnung korrigiert:**
- Wenn `bvgDeductionPercentage` explizit auf 0 gesetzt wird, wird **kein BVG** mehr berechnet
- Vorher: BVG wurde mit CHF 0.00 angezeigt auch wenn auf 0 gesetzt
- Jetzt: BVG erscheint nur wenn tatsächlich ein Betrag oder Prozentsatz > 0 definiert ist
- Standard bleibt 3.5% wenn weder Betrag noch Prozentsatz gesetzt

**Technische Details:**
- Aggregations-Maps für effiziente Gruppierung nach employeeId + type
- Separate Tracking von `totalHourlyAmount` für korrekte Rate-Berechnung
- BVG-Logik prüft jetzt explizit auf > 0 statt nur auf Vorhandensein

### Kompakte Lohnauszahlungs-Detail-Ansicht mit Navigation (Oktober 23, 2025)
Die Lohnauszahlungs-Detail-Seite wurde kompakter gestaltet und mit Navigation durch gefilterte Payments erweitert:

**Kompakteres Layout:**
- Kleinere Überschriften und Texte (text-xl für Titel, text-xs für Details)
- Reduziertes Padding in Cards (py-2 px-4 statt py-4 px-6)
- Kompakte Tabellen mit h-7 Zeilen und text-xs Schrift
- Kleinere Buttons und Badges (size="sm", h-5)
- Engere Abstände zwischen Elementen (space-y-3 statt space-y-6)
- Mehr Inhalt auf einem Bildschirm sichtbar

**Navigation durch gefilterte Lohnauszahlungen:**
- Vor/Zurück-Buttons (ChevronLeft/ChevronRight) zum Durchblättern
- Positionsanzeige (z.B. "3 / 10") zeigt aktuelle Position in der gefilterten Liste
- Filter-Parameter (Jahr/Monat) werden über URL weitergegeben und beibehalten
- Navigation nur sichtbar wenn mehr als eine Zahlung in der gefilterten Liste
- Buttons automatisch deaktiviert am Anfang/Ende der Liste

**Technische Umsetzung:**
- URL-Parameter (?year=2025&month=10) werden von der Payroll-Liste an Detail-Seite übergeben
- Detail-Seite lädt gefilterte Payments für Navigation-Context
- Navigation erhält Filter-Parameter bei jedem Seitenwechsel
- Interface-Korrekturen: `hourlyRate` (statt rate), `percentage` und `baseAmount` für Deductions

**Benutzerfreundlichkeit:**
- Schnelles Durchblättern durch alle Auszahlungen eines Monats
- Keine Rückkehr zur Liste nötig zum Vergleichen mehrerer Auszahlungen
- Filter bleiben aktiv beim Zurückkehren zur Liste
- Kompakte Darstellung ermöglicht besseren Überblick

### PDF-Layout-Anpassung an Referenzdokument (Oktober 23, 2025)
Das Layout der Lohnabrechnung (PDF) wurde an das Referenzdokument angepasst:

**Layout-Verbesserungen:**
- Titel "Lohnabrechnung" ist jetzt größer und prominenter (18pt statt 16pt)
- Monat/Jahr ist größer (12pt statt 10pt)
- Mitarbeitername und Adresse rechtsbündig für Fensterkuvert
- Professionelles, übersichtliches vertikales Layout

**Abzugsbeschreibungen:**
- AHV, ALV, NBU, QST zeigen Prozentsatz mit Basisbetrag: "AHV - AHV/IV/EO Abzug (5.30% von CHF 6'500.00)"
- BVG zeigt Beschreibung ohne Prozentsatz: "BVG - Pensionskasse"
- Alle Abzugsbeträge mit Minuszeichen

**Datenstruktur-Korrekturen:**
- Deductions verwenden jetzt korrekt `percentage` und `baseAmount` Felder (statt `rate`)
- PayrollItems verwenden `hourlyRate` Feld korrekt
- Frontend (payroll-detail.tsx) aktualisiert für korrekte Feldnamen
- Keine "NaN" Werte mehr in der UI

**Adressformatierung für Fensterkuvert:**
- Adresse wird auf drei separate Zeilen aufgeteilt für bessere Lesbarkeit
- Format: Name / Strasse Nr / PLZ Ort
- Automatische Aufteilung von "Strasse Nr, PLZ Ort" Format

**PDF-Struktur:**
```
Lohnabrechnung
Oktober 2025                                    Hans Müller
                                                Bahnhofstrasse 12
                                                8001 Zürich

LOHNBESTANDTEILE
01 (Grundgehalt Oktober)                        CHF 6'500.00

BRUTTOLOHN                                      CHF 6'500.00

ABZÜGE
AHV - AHV/IV/EO Abzug (5.30% von CHF 6'500.00)  - CHF 344.50
ALV - ALV Abzug (1.10% von CHF 6'500.00)        - CHF 71.50
NBU - NBU/SUVA Abzug (1.17% von CHF 6'500.00)   - CHF 75.92
BVG - Pensionskasse                              - CHF 223.58

TOTAL ABZÜGE                                    - CHF 715.50

NETTOLOHN                                       CHF 5'784.50

Periode: 01.10.2025 - 31.10.2025 | AHV-Nr: 756... | Auszahlung: 31.10.2025
```

## Recent Features (October 2025)

### Bearbeiten-Button in Lohnauszahlungs-Liste (Oktober 22, 2025)
Die Lohnauszahlungs-Liste wurde um einen direkten Bearbeiten-Button erweitert:

**Funktionalität:**
- Bleistift-Icon (Pencil) in der Aktionen-Spalte
- Nur für offene (nicht abgeschlossene) Lohnauszahlungen sichtbar
- Direkter Zugriff auf das Bearbeitungsformular
- Navigation zu `/payroll/{id}/edit` beim Klick

**Button-Reihenfolge in Aktionen:**
1. Abschließen/Entsperren (Lock/Unlock)
2. **Bearbeiten (Pencil)** - NEU
3. Anzeigen (Eye)
4. Löschen (Trash)

**Kompaktes Bearbeitungs-Layout:**
- Identisches enges Raster-Layout wie die Lohnerfassungsseite
- Alle Formularfelder in einer Zeile: Auszahlungsdatum, von, bis, Bemerkung, Zurück & Speichern
- Kompakte Tabelle mit h-7 Inputs und text-xs Schrift
- Spalten: Lohnart, Beschreibung, Std., Ansatz, Betrag (CHF)
- Platzsparendes Design für schnelle Bearbeitung

**Benutzerfreundlichkeit:**
- Schneller Zugriff auf Bearbeitungsfunktion
- Klare visuelle Trennung zwischen Anzeigen und Bearbeiten
- Intuitives Bleistift-Symbol für Bearbeitungsfunktion
- Nur für bearbeitbare (offene) Zahlungen verfügbar
- Kompaktes Layout ermöglicht schnelle Änderungen

### Mitarbeiter-Gesamttabelle mit Sortierung und Stundenlohn (Oktober 22, 2025)
Eine erweiterte Tabellen-Ansicht auf der Mitarbeiter-Seite ermöglicht die gleichzeitige Bearbeitung von Lohndaten für alle Mitarbeiter:

**Funktionalität:**
- Tab-basierte Ansicht: "Mitarbeiterliste" und "Gesamttabelle"
- Inline-Bearbeitung für alle Mitarbeiter gleichzeitig
- Editierbare Felder: 100% Monatslohn, **Stundenlohn (neu)**, Beschäftigungsgrad (%), BVG Abzug (CHF)
- **Sortierung nach Nachname** mit visuellen Auf-/Absteigend-Indikatoren
- Batch-Update-Funktion mit einem Speichern-Button

**Neue Features:**
- Sortierbare Name-Spalte: Klick auf den Tabellenkopf sortiert alphabetisch auf- oder absteigend
- Stundenlohn-Eingabefeld: Direkteingabe des Stundenlohns für jeden Mitarbeiter
- Visuelle Sortierindikatoren: Pfeile zeigen die aktuelle Sortierrichtung an

**Technische Umsetzung:**
- Separate Sortierung für Gesamttabelle (`summarySortOrder` State)
- Sortierung nach Nachname (alphabetisch)
- Erweiterter `editableData` State um `hourlyRate`
- Batch-Update speichert alle geänderten Felder inklusive Stundenlohn
- Responsive Design für alle Spalten

**Benutzerfreundlichkeit:**
- Schnelle Sortierung durch Klick auf Name-Spalte
- Direkteingabe von Stundenlöhnen ohne Einzelbearbeitung
- Übersichtliche Darstellung aller relevanten Lohndaten
- Konsistente Batch-Speicherung für alle Änderungen