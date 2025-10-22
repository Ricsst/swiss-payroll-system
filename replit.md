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

### Dynamic Wage Type Mapping for Child Allowances (Latest)
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