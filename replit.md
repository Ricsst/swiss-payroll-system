# Swiss Payroll Management System

## Overview
A comprehensive payroll management system for Swiss businesses, designed to manage employee data, process payroll, and generate compliance reports. It handles Swiss-specific social insurance calculations (AHV, ALV, SUVA) and supports both monthly and yearly reporting. The system is designed for self-hosted deployment with Option B1 architecture: single application installation serving multiple companies with separate PostgreSQL databases per company, managed via GitHub for centralized updates.

## User Preferences
Preferred communication style: Simple, everyday language.

## Deployment Architecture
**Option B1: Multi-Tenant with Separate Databases**
- One app installation manages three separate PostgreSQL databases
- Each company (Firma A, B, C) has its own isolated database
- Updates are centralized through GitHub
- Self-hosted on company server for maximum data privacy
- Access from workstations via browser at http://server-ip:5000

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, TypeScript, and Vite, utilizing `shadcn/ui` (New York style) and TailwindCSS for a modern aesthetic. It adheres to Material Design principles, featuring a blue primary color, Inter font for UI, and JetBrains Mono for financial data. It supports light mode and includes key pages like Dashboard, Employee Management (with CRUD and Lohnausweis generation), Company Configuration, Streamlined Employee Payroll Entry, Payroll List/Detail (with PDF export), Monthly/Yearly Reports (multi-format export), and Payroll Templates. Recent enhancements include a "Mitarbeiter-Gesamttabelle" for batch editing of employee payroll data, enhanced sorting on employee lists, and a dedicated Employee Payroll Overview page for yearly summaries.

### Technical Implementations
The backend is an Express.js application written in TypeScript (ESM) with a RESTful API. It uses Zod for schema validation. Data is stored in PostgreSQL and accessed via Drizzle ORM for type safety. The system supports dynamic wage type mapping for child allowances, context-aware calculations in payroll entry for various wage types, and includes a lock/unlock mechanism for payroll payments to ensure data integrity. PDF reports, such as monthly reports and individual payroll slips, have a consistent, professional vertical layout. Swiss-specific deductions like AHV, ALV, SUVA, and BVG are calculated with cumulative limits and smart base amount calculations.

### Feature Specifications
The system manages employee and company data, configurable payroll item types, and payroll payments. It handles Swiss-specific calculations for AHV, ALV, SUVA, and BVG, with smart base amount calculations for deductions and cumulative limit logic for ALV and NBU. Payroll entry features auto-fill, dynamic wage types, employee navigation, month-based period selection, automatic calculations, and intelligent deduction previews. The system allows for editing of unlocked payroll payments and generates window envelope-compatible payroll slips and various aggregated reports (e.g., monthly totals per employee). Employee records track annual flat expenses (Pauschalspesen) which are automatically included in Lohnausweis generation at position 13.2.3 (Übrige Pauschalspesen).

### System Design Choices
UUIDs are used for primary keys, along with timestamps and decimal types for financial data. The schema includes tables for `companies`, `employees`, `payroll_item_types`, `payroll_payments`, `payroll_items`, `deductions`, and `payroll_templates`. Development utilizes Vite for the client, esbuild for the server, and tsx for hot reloading. Code is organized into `/client`, `/server`, and `/shared` with path aliases for maintainability. Strict TypeScript, Drizzle schema types, and Zod are employed for comprehensive type and runtime validation.

## External Dependencies

### Database & ORM
- PostgreSQL (Neon Serverless)
- Drizzle ORM
- @neondatabase/serverless

### UI Framework & Components
- Radix UI
- shadcn/ui
- TailwindCSS
- Lucide React

### Forms & Validation
- React Hook Form
- Zod
- @hookform/resolvers
- drizzle-zod

### Data Fetching & State
- TanStack Query
- date-fns

### Routing & Navigation
- Wouter

### Development Tools
- Vite
- tsx
- esbuild

### Fonts
- Google Fonts (Inter, JetBrains Mono)