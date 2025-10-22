# Swiss Payroll Management System

## Overview

A comprehensive payroll management system for Swiss businesses, designed to manage employee data, process payroll, and generate compliance reports. It handles Swiss-specific social insurance calculations (AHV, ALV, SUVA) and supports both monthly and yearly reporting. The system features a React frontend with shadcn/ui and Material Design principles, an Express.js API, and a PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & UI Components:** React 18 with TypeScript, Vite, shadcn/ui (New York style), TailwindCSS, Wouter for routing.
**State Management:** TanStack Query for server state, React Hook Form with Zod for forms.
**Design System:** Material Design adapted for Swiss context, professional blue primary color, Inter font (UI) and JetBrains Mono (financial data), light mode with optional dark mode.
**Key Pages:** Dashboard, Employee Management (CRUD, Lohnausweis), Company Configuration, Streamlined Employee Payroll Entry with auto-fill and calculations, Payroll List/Detail with PDF export, Monthly/Yearly Reports (multi-format export), Payroll Templates.

### Backend Architecture

**Server Framework:** Express.js with TypeScript (ESM), custom middleware, centralized error handling.
**API Structure:** RESTful API (`/api` prefix), business logic abstracted into `server/storage.ts`, Zod schema validation (drizzle-zod).
**Key API Endpoints:** Dashboard stats, Company CRUD, Employee management, Payroll payment CRUD (multiple salary types), Monthly/Yearly reports, PDF exports (payroll slips, reports, Lohnausweis), Excel/CSV exports, Payroll template management.

### Data Architecture

**Database:** PostgreSQL via Neon serverless, Drizzle ORM for type-safe access.
**Core Tables:** `companies`, `employees` (with Swiss-specific fields), `payroll_item_types` (configurable wage types with deduction applicability), `payroll_payments`, `payroll_items`, `deductions`, `payroll_templates`.
**Schema Design Principles:** UUID primary keys, timestamps, decimal for financial data, foreign keys, enums, separate validation schemas.
**Swiss-Specific Calculations:** Configurable rates for AHV, ALV, SUVA, BVG. Smart base amount calculation for deductions based on `payroll_item_types` flags. Automatic calculations in payroll entry with real-time preview.
**Key Features:** Window envelope compatible payroll slips (PDF), employee default payroll values (monthly salary, employment level, hourly rate, BVG, child allowance), configurable payroll item types (Lohnarten) with smart deduction engine, streamlined employee payroll entry (auto-fill, dynamic wage types, employee navigation, month-based period selection, automatic calculations, intelligent deduction preview, data validation).

### Development & Deployment

**Build Process:** Vite for client, esbuild for server, tsx for development hot reload.
**Code Organization:** `/client`, `/server`, `/shared` (types, schemas). Path aliases for easy imports.
**Type Safety:** Strict TypeScript, Drizzle schema types, Zod for runtime validation, React Hook Form with Zod resolver.

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

### Smart Payroll Entry with Context-Aware Calculations (Latest - October 22, 2025)
The payroll entry form now intelligently handles different wage types with automatic calculations:

**Monatslohn (Monthly Salary):**
- Std field: Displays monthly salary amount
- Ansatz field: Shows employment level percentage (Anstellungsgrad)
- Betrag: Automatically calculated as Monatslohn × Anstellungsgrad / 100
- Auto-fills from employee defaults when employee is selected

**Stundenlohn (Hourly Wage):**
- Std field: Number of hours worked
- Ansatz field: Hourly rate (CHF/hour)
- Betrag: Automatically calculated as Hours × Rate

**Überstundenzuschlag (Overtime Premium):**
- Std field: Number of overtime hours
- Ansatz field: Premium percentage
- Betrag: Automatically calculated

**Bonus:**
- Std field: Base bonus amount
- Ansatz field: Bonus rate percentage
- Betrag: Automatically calculated as Bonus × Rate / 100

**13. Monatslohn & Unfalltaggeld:**
- Std field: Base amount (monthly salary for 13th month)
- Ansatz field: Percentage
- Betrag: Automatically calculated as Base × Percentage / 100

**Benefits:**
- Context-aware field behavior based on wage type
- Real-time automatic calculations reduce errors
- Consistent calculation logic across all wage types
- Clear visual feedback with appropriate placeholders

**Additional Features:**
- Delete button for individual payroll payments (only for unlocked payments)
- Narrower sidebar navigation (14rem instead of 20rem)
- Payroll item types sorted by code in overview
- Yearly report shows both code and name for wage types

### Payroll Payment Lock/Unlock (October 22, 2025)
Payroll payments can now be locked to prevent modifications after finalization, ensuring data integrity and compliance:

**Lock/Unlock Functionality:**
- Added `isLocked` boolean field to `payroll_payments` table
- Lock button on payroll list page converts "Offen" payments to "Abgeschlossen" status
- Unlock button allows reopening locked payments if corrections are needed
- Locked payments display warning alert in detail view

**API Endpoints:**
- POST `/api/payroll/payments/:id/lock` - Locks a payment
- POST `/api/payroll/payments/:id/unlock` - Unlocks a payment
- DELETE endpoint blocks deletion of locked payments

**User Interface:**
- Status badges: "Offen" (green, unlocked) and "Abgeschlossen" (gray, locked)
- Lock/unlock icons in payroll list actions column
- Alert box in detail view explaining locked status
- Optimistic UI updates via TanStack Query cache invalidation

**Technical Implementation:**
- Query keys structured as arrays: `['/api/payroll/payments', { year, month }]`
- Proper cache invalidation ensures immediate UI updates without manual reload
- Backend validation prevents editing/deleting locked payments

**Benefits:**
- Prevents accidental modification of finalized payroll data
- Clear visual indicators of payment status
- Maintains audit trail and data integrity
- Flexible unlock capability for authorized corrections

### Improved Monthly Report Layout
The monthly report PDF has been redesigned for better clarity and readability:

**Lohnarten Names Instead of Codes:**
- Payroll item types now display full names (e.g., "Monatslohn", "Kinderzulagen") instead of codes (e.g., "01", "15")
- Makes reports easier to read and understand
- Automatically maps codes to names from the payroll item types configuration

**Single-Column Layout for Totals:**
- All totals displayed in a vertical, single-column format (like payroll slips)
- Clear structure: Lohnarten → TOTAL BRUTTOLOHN → Abzüge → TOTAL ABZÜGE → NETTOLOHN
- Separator lines between sections for improved visual clarity
- Right-aligned amounts with consistent formatting

**Benefits:**
- Professional, easy-to-read layout
- Consistent design across payroll slips and reports
- Better suited for printing and archival

### Dynamic Wage Type Mapping for Child Allowances
Child allowances now automatically appear under the correct wage type "Kinderzulagen" instead of generic "Zulagen":

**How It Works:**
- The system dynamically searches for a wage type with "Kinderzulagen" in the name (case-insensitive)
- No hardcoded wage type codes - users can create "Kinderzulagen" with any code they prefer
- When an employee with child allowance data is selected in payroll entry, the amount and note auto-fill under "Kinderzulagen"
- Flexible and adaptable to different company configurations

**Benefits:**
- Accurate categorization of child allowances as separate wage type
- Better reporting and deduction calculations
- Users can configure "Kinderzulagen" as not subject to social insurance deductions
- Clear separation from generic "Zulagen" (allowances)

**Implementation:**
- Database: "Kinderzulagen" wage type (code 15) created, not subject to AHV/ALV/NBU/BVG/QST
- Frontend: Auto-fill logic searches dynamically by wage type name in `client/src/pages/employee-payroll.tsx`
- Tested successfully with employee defaults auto-filling correctly