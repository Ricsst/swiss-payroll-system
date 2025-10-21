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
- Employees: CRUD operations for employee management
- Company: Single company configuration with Swiss social insurance rates
- Payroll: Payment list and detail views
- Monthly/Yearly Reports: Aggregated financial reporting

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
- `/api/payroll/payments`: Payroll payment CRUD with items and deductions
- `/api/reports/monthly` & `/api/reports/yearly`: Aggregated reports

### Data Architecture

**Database**
- PostgreSQL via Neon serverless
- Drizzle ORM for type-safe database access
- Schema-first approach with TypeScript types inferred from schema

**Core Tables**
- `companies`: Single company configuration with Swiss insurance rates (AHV, ALV, SUVA)
- `employees`: Employee master data with Swiss-specific fields (AHV number, gender for SUVA calculation)
- `payroll_payments`: Payment header with period dates and totals
- `payroll_items`: Line items per payment (salary components, hours, bonuses)
- `deductions`: Deductions per payment (taxes, insurance, other)

**Schema Design Principles**
- UUID primary keys for all tables
- Timestamps for audit trails (createdAt, updatedAt)
- Decimal/numeric types for financial data precision
- Foreign key cascades for data integrity
- Enums for type-safe category fields (PAYROLL_ITEM_TYPES, DEDUCTION_TYPES)

**Swiss-Specific Calculations**
- AHV (old-age insurance): Employee and employer rates, rentner allowance
- ALV (unemployment insurance): Two-tier system based on income thresholds
- SUVA (accident insurance): Gender-specific NBU rates with income caps
- All rates configurable per company for flexibility

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