# Swiss Payroll Management System

## Overview

A comprehensive payroll management system designed specifically for Swiss businesses to manage employee data, process payroll payments, and generate compliance reports. The application handles Swiss-specific social insurance calculations (AHV, ALV, SUVA) and supports both monthly and yearly reporting requirements.

The system follows a clean architecture with a React frontend using shadcn/ui components and Material Design principles adapted for Swiss business culture, backed by an Express.js API server with PostgreSQL database storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & UI Components**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- shadcn/ui component library (New York style variant) built on Radix UI primitives
- TailwindCSS for styling with custom design tokens
- Wouter for client-side routing (lightweight alternative to React Router)

**State Management**
- TanStack Query (React Query) for server state management and caching
- React Hook Form with Zod validation for form handling
- No global client state management (relies on server state and component state)

**Design System**
- Material Design adapted for Swiss business context
- Professional blue primary color (214 84% 56%) for trust and credibility
- Inter font family for general UI, JetBrains Mono for financial data (IBAN, AHV numbers)
- Light mode primary with optional dark mode support
- Custom CSS variables for theme consistency

**Key Pages**
- Dashboard: Overview statistics (active employees, company status, payroll metrics)
- Employees: CRUD operations for employee management with Lohnausweis generation
- Company: Single company configuration with Swiss social insurance rates
- **Employee Payroll Entry**: Streamlined payroll entry with multiple simultaneous salary types, employee navigation, and automatic calculations
- Payroll: Payment list and detail views with PDF export
- Monthly/Yearly Reports: Aggregated financial reporting with multi-format exports (PDF, Excel, CSV)
- Templates: Reusable payroll templates for recurring payments

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- ESM module system (not CommonJS)
- Custom middleware for request logging and JSON response capture
- Centralized error handling

**API Structure**
- RESTful API design with `/api` prefix
- Route handlers in `server/routes.ts`
- Business logic abstracted into `server/storage.ts` (IStorage interface)
- Zod schema validation using drizzle-zod for request validation
- Consistent error responses with status codes and messages

**Key API Endpoints**
- `/api/dashboard/stats`: Dashboard statistics
- `/api/company`: Company CRUD (single company model)
- `/api/employees`: Employee management
- `/api/payroll/payments`: Payroll payment CRUD with items and deductions (supports multiple simultaneous salary types)
- `/api/reports/monthly` & `/api/reports/yearly`: Aggregated reports
- `/api/pdf/payroll/:id`: PDF export for individual payroll slips
- `/api/pdf/monthly-report`: PDF export for monthly reports
- `/api/pdf/yearly-report`: PDF export for yearly reports
- `/api/pdf/lohnausweis/:employeeId`: Official Swiss salary certificate (Lohnausweis)
- `/api/excel/monthly-report`: Excel/CSV export for monthly reports
- `/api/excel/yearly-report`: Excel/CSV export for yearly reports
- `/api/templates`: Payroll template management

### Data Architecture

**Database**
- PostgreSQL via Neon serverless
- Drizzle ORM for type-safe database access
- Schema-first approach with TypeScript types inferred from schema

**Core Tables**
- `companies`: Single company configuration with Swiss insurance rates (AHV, ALV, SUVA)
- `employees`: Employee master data with Swiss-specific fields (AHV number, banking info)
- `payroll_payments`: Payment header with period dates and totals
- `payroll_items`: Line items per payment supporting multiple simultaneous salary types (Monatslohn, Stundenlohn, Zulagen, Provision, etc.)
- `deductions`: Deductions per payment (AHV, ALV, SUVA, BVG, taxes, etc.)
- `payroll_templates`: Reusable templates with predefined items and deductions in JSON format

**Schema Design Principles**
- UUID primary keys for all tables
- Timestamps for audit trails (createdAt, updatedAt)
- Decimal/numeric types for financial data precision
- Foreign key cascades for data integrity
- Enums for type-safe category fields (PAYROLL_ITEM_TYPES, DEDUCTION_TYPES)
- Separate validation schemas for creation vs update (e.g., `insertPayrollItemWithoutPaymentIdSchema` for client-to-server communication)

**Swiss-Specific Calculations**
- AHV (old-age insurance): Employee and employer rates (5.3%), rentner allowance
- ALV (unemployment insurance): Two-tier system (1.1%) based on income thresholds
- SUVA/NBU (accident insurance): Gender-specific rates (1.168%) with income caps
- BVG (pension fund): Approximately 3.5% of gross salary
- All rates configurable per company for flexibility
- Automatic calculation in employee payroll entry form

## Recent Features (October 2025)

### Employee Payroll Entry Page (`/employee-payroll`)
A streamlined interface for efficient payroll processing with the following capabilities:

**Multiple Simultaneous Salary Types**
- Add unlimited payroll items in a single payment
- Support for all Swiss salary types: Monatslohn, Stundenlohn, Zulagen, Provision, Kommission, Bonus, 13. Monatslohn, Spesen, Naturallohn, Feiertagsentschädigung, Überstundenzuschlag
- Automatic calculation for hourly wages (hours × hourly rate = amount)

**Employee Navigation**
- Previous/Next buttons for quick navigation between active employees
- Displays employee AHV number for verification
- Automatic advancement to next employee after successful save

**Month-Based Period Selection**
- Select a month (e.g., "Oktober 2025")
- Automatically fills period start (1st of month) and period end (last day of month)
- Manual override available for custom periods

**Automatic Calculations**
- Real-time calculation of gross salary (sum of all payroll items)
- Automatic deduction calculations:
  - AHV/IV/EO: 5.3% of gross
  - ALV: 1.1% of gross
  - NBU/SUVA: 1.168% of gross
  - BVG: ~3.5% of gross
- Net salary calculation (gross - total deductions)
- Live preview of all calculations before saving

**Data Validation**
- Uses `insertPayrollItemWithoutPaymentIdSchema` for payroll items (omits `payrollPaymentId` during creation)
- Uses `insertDeductionWithoutPaymentIdSchema` for deductions (omits `payrollPaymentId` during creation)
- Backend adds relationship IDs after creating the payment record
- Form validation ensures all required fields are filled

### Development & Deployment

**Build Process**
- Vite builds client code to `dist/public`
- esbuild bundles server code to `dist/index.js`
- Development mode runs tsx server with hot reload
- Production serves static files from Express

**Code Organization**
- `/client`: Frontend React application
- `/server`: Backend Express application
- `/shared`: Shared TypeScript types and schemas (Drizzle schema, Zod validators)
- Path aliases: `@/` for client src, `@shared/` for shared code

**Type Safety**
- Strict TypeScript configuration
- Drizzle schema generates TypeScript types
- Zod schemas for runtime validation
- React Hook Form with Zod resolver integration

## External Dependencies

### Database & ORM
- **PostgreSQL (Neon Serverless)**: Primary database with WebSocket connection pooling
- **Drizzle ORM**: Type-safe ORM with schema migrations
- **@neondatabase/serverless**: Neon-specific PostgreSQL driver with connection pooling

### UI Framework & Components
- **Radix UI**: Headless accessible component primitives (accordion, dialog, dropdown, select, etc.)
- **shadcn/ui**: Pre-styled component collection built on Radix UI
- **TailwindCSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Forms & Validation
- **React Hook Form**: Performant form state management
- **Zod**: TypeScript-first schema validation
- **@hookform/resolvers**: Integration layer between React Hook Form and Zod
- **drizzle-zod**: Generate Zod schemas from Drizzle ORM schemas

### Data Fetching & State
- **TanStack Query**: Server state management with caching and automatic refetching
- **date-fns**: Date manipulation and formatting library

### Routing & Navigation
- **Wouter**: Minimalist client-side router (1.5KB alternative to React Router)

### Development Tools
- **Vite**: Fast development server and build tool
- **tsx**: TypeScript execution for Node.js
- **esbuild**: JavaScript bundler for production builds
- **Replit plugins**: Runtime error modal, cartographer, dev banner (development only)

### Fonts
- **Google Fonts**: Inter (primary UI font), JetBrains Mono (monospace for financial data)

### Session Management
- **connect-pg-simple**: PostgreSQL session store (imported but session implementation not visible in provided code)