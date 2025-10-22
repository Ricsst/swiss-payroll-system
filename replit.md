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