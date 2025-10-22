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

### Employee List Sorting (Latest - October 22, 2025)
The employee list now supports sorting by last name and gender:

**Sortable Columns:**
- Name (sorts by last name)
- Geschlecht (gender: Frau/Mann)

**Sorting Behavior:**
- Initial state: No sorting, list shows in database order
- First click: Sort ascending (A-Z or Frau-Mann)
- Second click: Sort descending (Z-A or Mann-Frau)
- Click different column: Switch to new sorting field (ascending)

**Visual Indicators:**
- ArrowUpDown icon: Column not currently sorted
- ArrowUp icon: Column sorted ascending
- ArrowDown icon: Column sorted descending

**User Experience:**
- Clickable column headers with hover effect
- Visual feedback shows current sort state
- Smooth transitions between sort states

**Technical Implementation:**
- State management: sortField ('lastName' | 'gender' | null) and sortOrder ('asc' | 'desc')
- Client-side sorting using localeCompare for proper alphabetical ordering
- Icons from lucide-react for visual indicators

**Additional Sorting:**
- Lohnerfassung (Payroll Entry) page: Employee dropdown sorted by last name descending (Z-A)
- Employee navigation buttons follow the same Z-A order for consistent user experience

### Employee Payroll Overview Page (October 22, 2025)
A new page displays a comprehensive yearly payroll overview for individual employees:

**Key Features:**
- Employee selector showing all employees (active and inactive)
- Dynamic year selection (current year -5 to +2 years)
- Comprehensive table with monthly breakdown:
  - 12 monthly columns + 13th month salary + total column
  - All wage types with codes and names
  - BRUTTOLOHN subtotal row
  - All deductions (AHV, ALV, NBU, BVG, QST)
  - TOTAL ABZÜGE subtotal row
  - NETTOLOHN final row (gross - deductions)

**Navigation:**
- Sidebar menu item: "Lohnauszahlung pro MA"
- Located between "Lohnauszahlungen" and "Monatsabrechnung"

**Data Presentation:**
- All amounts formatted with 2 decimal places
- Right-aligned monetary values with monospace font
- Inactive employees marked with "(Inaktiv)" label
- Employee details displayed in card header (AHV number, entry/exit dates)

**Technical Implementation:**
- Backend: `getEmployeePayrollOverview` function aggregates all payroll data per employee per year
- API endpoint: GET `/api/reports/employee-payroll-overview?employeeId={id}&year={year}`
- Frontend: Responsive table layout with proper data-testid attributes for testing

**Benefits:**
- Complete annual payroll overview for individual employees
- Easy access to historical data for audits and reviews
- Clear separation of wage types, deductions, and net salary
- Support for both active and inactive employees

### Smart Payroll Entry with Context-Aware Calculations (October 22, 2025)
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

### Payroll Payment Editing (October 22, 2025)
Unlocked payroll payments can now be edited to correct errors or make adjustments:

**Edit Functionality:**
- Edit button available on payroll detail page (only for unlocked payments)
- Access via `/payroll/:id/edit` route
- Full editing capabilities for payment dates, period, notes, and wage types

**Features:**
- Pre-filled form with existing payroll data
- Intelligent deduction calculations based on payroll item type flags
- Support for AHV (with Rentner allowance), ALV, NBU/SUVA, BVG, and QST
- Real-time preview of gross salary, deductions, and net salary
- Automatic recalculation when amounts change

**Backend Implementation:**
- PATCH `/api/payroll/payments/:id` endpoint
- Updates existing payment, deletes old items/deductions, inserts new ones
- Validates payment is not locked before allowing changes
- Recalculates totals automatically

**User Experience:**
- Simple, focused interface for editing payroll data
- Clear feedback on calculated deductions
- Returns to detail view after successful save
- Prevents editing of locked payments with clear messaging

**Benefits:**
- Correct payroll errors without deleting and recreating payments
- Maintain payment history and ID references
- Full audit trail via updated timestamps
- Consistent deduction calculations matching payroll entry page

### Improved Monthly Report Layout (October 22, 2025)
The monthly report PDF has been completely redesigned with a clean vertical layout:

**New Layout Structure:**
- One page per employee in the monthly report
- Title: "Lohnabrechnung" with month and year
- Employee name and address displayed in the right window position (envelope-compatible)
- Vertical single-column format (same as individual payroll slips)

**Content Sections:**
1. **LOHNBESTANDTEILE** - All wage types with codes and descriptions
2. **BRUTTOLOHN** - Total gross salary (highlighted)
3. **ABZÜGE** - Detailed deductions with calculation basis (e.g., "AHV Abzug (5.30% von CHF 6'500.00)")
4. **TOTAL ABZÜGE** - Total deductions (highlighted)
5. **NETTOLOHN** - Net salary (highlighted)

**Features:**
- Clean, professional layout matching the payroll slip design
- Each employee gets their own page in the monthly report
- Deduction details show percentage and base amount for transparency
- Right-aligned amounts with Swiss currency formatting
- Separator lines between sections for clarity

**Benefits:**
- Consistent design across all PDF reports
- Easy to read and understand
- Professional appearance suitable for official documentation
- One PDF file contains all employees for the month

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