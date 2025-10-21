# Design Guidelines: Swiss Payroll Management System

## Design Approach
**Selected Framework:** Material Design adapted for Swiss business context
**Justification:** This is a utility-focused, information-dense application requiring clarity, consistency, and professional credibility. Material Design provides excellent form components, data tables, and established patterns for complex data entry workflows.

## Core Design Principles
- **Clarity First:** Every element serves data entry or display - no decorative distractions
- **Swiss Professionalism:** Clean, precise, trustworthy aesthetic matching Swiss business culture
- **Data Hierarchy:** Clear visual distinction between input forms, data tables, and reports
- **Workflow Efficiency:** Minimize clicks, provide clear navigation between employee/company/payroll sections

## Color Palette

**Light Mode (Primary):**
- Primary Brand: 214 84% 56% (Professional blue - trustworthy, business-like)
- Primary Hover: 214 84% 48%
- Secondary: 214 20% 25% (Dark slate for text)
- Background: 0 0% 98% (Soft white, reduces eye strain)
- Surface: 0 0% 100% (Pure white for cards/forms)
- Border: 214 20% 88%
- Text Primary: 214 20% 15%
- Text Secondary: 214 15% 45%
- Success: 142 76% 36% (For completed payrolls)
- Warning: 38 92% 50% (For pending actions)
- Error: 0 84% 60% (For validation errors)

**Dark Mode (Optional for evening work):**
- Background: 214 20% 12%
- Surface: 214 18% 16%
- Text on dark: 214 20% 95%

## Typography

**Font Families:**
- Primary: 'Inter', system-ui, sans-serif (Clean, highly legible for forms and tables)
- Monospace: 'JetBrains Mono', monospace (For IBAN, AHV numbers, financial data)

**Scale:**
- Headings: font-semibold (Pages: text-2xl, Sections: text-xl, Cards: text-lg)
- Body: text-base (Forms, tables)
- Labels: text-sm font-medium
- Captions: text-xs (Hints, metadata)

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Form fields: gap-4, p-4
- Section spacing: py-8, px-6
- Card padding: p-6
- Table cells: px-4 py-3

**Grid Structure:**
- Container: max-w-7xl mx-auto px-4
- Two-column forms: grid grid-cols-1 md:grid-cols-2 gap-4
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Data tables: Full width with horizontal scroll on mobile

## Component Library

### Navigation
- **Top Navigation Bar:** Fixed, shadow-sm, white background with logo left, user menu right
- **Sidebar Navigation:** Sticky left sidebar (desktop), drawer (mobile) with sections: Dashboard, Mitarbeiter, Firma, Lohnabrechnungen, Berichte
- **Breadcrumbs:** Below top nav showing current location

### Forms & Inputs
- **Input Fields:** Rounded-md, border-2, focus ring-2 in primary color, clear labels above fields
- **Date Pickers:** Calendar icon, clear format indicator (DD.MM.YYYY)
- **Checkboxes:** For insurance status (AHV Ja/Nein, etc.) - large, clearly labeled
- **Select Dropdowns:** For choosing employees, months, payment types
- **Form Sections:** Grouped with subtle background (bg-slate-50), clear section headers
- **Validation:** Inline error messages in red below fields, success states in green

### Data Display
- **Employee Cards:** Compact cards showing name, photo placeholder, key info, quick actions
- **Data Tables:** Striped rows (alternate subtle bg), sortable headers, sticky header on scroll, row hover state
- **Summary Cards:** For totals - larger numbers, subtle colored backgrounds matching context (green for net, blue for gross)
- **Badge Components:** For status (Aktiv/Inaktiv), payment frequency, insurance status

### Reports & Calculations
- **Monthly Summary:** Card-based layout showing payment breakdown, total gross, deductions, net
- **Annual Report:** Table with 12 months as rows, totals in footer, export button
- **Deduction Breakdown:** Nested tables or expandable sections showing AHV, ALV, SUVA calculations
- **Print Layout:** Clean, minimal print styles with company header

### Actions & Buttons
- **Primary Actions:** Solid bg-primary text-white (Speichern, Berechnen, Erstellen)
- **Secondary Actions:** Outlined border-primary text-primary (Abbrechen, Zurück)
- **Icon Buttons:** For edit, delete, print (Heroicons library)
- **Floating Action Button:** For quick "Neue Lohnabrechnung" entry

### Overlays & Modals
- **Confirmation Dialogs:** For delete actions, clear Yes/No options
- **Employee Details Modal:** Full-screen or large modal for viewing/editing all employee data
- **Payment Entry Modal:** Multi-step form for adding weekly payments

## Page-Specific Layouts

### Dashboard
- Top row: Summary cards (Total Employees, This Month Payroll, Pending Approvals)
- Recent payments table
- Quick actions: shortcuts to common tasks

### Employee Management
- Search/filter bar at top
- Employee cards grid or table view toggle
- Add Employee button (prominent, top-right)

### Payroll Entry
- Employee selector
- Payment period selector (Week/Month, date range)
- Tabbed sections: Lohnarten, Abzüge, Zusammenfassung
- Live calculation preview in sticky sidebar

### Reports Section
- Filter controls: Date range, employee selection, report type
- Preview area with print-friendly formatting
- Export buttons (PDF, Excel)

## Animations
**Minimal and Purposeful:**
- Smooth transitions for modal open/close (duration-200)
- Hover state changes (subtle scale or bg change)
- Loading spinners for calculations
- NO scroll animations, parallax, or decorative motion

## Images
**No hero images needed.** This is a utility application. Use:
- Company logo in navigation
- Optional: Small illustration placeholders for empty states ("Keine Mitarbeiter erfasst")
- Profile photo placeholders for employees (circular, 40x40px in cards, 80x80px in details)

## Accessibility & Usability
- High contrast ratios (WCAG AA minimum)
- Keyboard navigation throughout
- Focus indicators clearly visible
- Form labels always visible (no placeholder-only fields)
- Clear error messages with resolution guidance
- Consistent validation timing (on blur + on submit)
- Large click targets (min 44x44px) for mobile use