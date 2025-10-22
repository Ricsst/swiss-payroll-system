import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date, boolean, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// COMPANY (Firma)
// ============================================================================
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  ahvAccountingNumber: text("ahv_accounting_number").notNull(), // AHV-Abrechnungsnummer
  suvaCustomerNumber: text("suva_customer_number"), // SUVA-Kundennummer
  
  // Social insurance contribution rates (Beiträge Sozialversicherung)
  ahvEmployeeRate: numeric("ahv_employee_rate", { precision: 5, scale: 4 }).notNull().default("5.3000"), // 5.3%
  ahvEmployerRate: numeric("ahv_employer_rate", { precision: 5, scale: 4 }).notNull().default("5.3000"), // 5.3%
  ahvRentnerAllowance: numeric("ahv_rentner_allowance", { precision: 10, scale: 2 }).notNull().default("1400.00"), // CHF pro Monat
  
  alvEmployeeRate: numeric("alv_employee_rate", { precision: 5, scale: 4 }).notNull().default("1.1000"), // 1.1%
  alvEmployerRate: numeric("alv_employer_rate", { precision: 5, scale: 4 }).notNull().default("1.1000"), // 1.1%
  alvMaxIncomePerYear: numeric("alv_max_income_per_year", { precision: 10, scale: 2 }).notNull().default("148200.00"), // CHF pro Jahr
  alvEmployee2Rate: numeric("alv_employee_2_rate", { precision: 5, scale: 4 }).notNull().default("0.5000"), // 0.5%
  alvEmployer2Rate: numeric("alv_employer_2_rate", { precision: 5, scale: 4 }).notNull().default("0.5000"), // 0.5%
  
  suvaNbuMaleRate: numeric("suva_nbu_male_rate", { precision: 5, scale: 4 }).notNull().default("1.1680"), // 1.168%
  suvaNbuFemaleRate: numeric("suva_nbu_female_rate", { precision: 5, scale: 4 }).notNull().default("1.1680"), // 1.168%
  suvaMaxIncomePerYear: numeric("suva_max_income_per_year", { precision: 10, scale: 2 }).notNull().default("148200.00"), // CHF pro Jahr
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// ============================================================================
// EMPLOYEES (Mitarbeiter)
// ============================================================================
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Personal information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  birthDate: date("birth_date").notNull(),
  address: text("address").notNull(),
  email: text("email").notNull(),
  
  // Employment dates
  entryDate: date("entry_date").notNull(), // Eintritt
  exitDate: date("exit_date"), // Austritt (optional)
  
  // AHV and insurance
  ahvNumber: text("ahv_number").notNull(), // AHV Nr (format: 756.1234.5678.97)
  
  // Insurance flags
  hasAccidentInsurance: boolean("has_accident_insurance").notNull().default(true), // Unfallversicherung
  hasAhv: boolean("has_ahv").notNull().default(true), // AHV
  hasAlv: boolean("has_alv").notNull().default(true), // ALV
  isNbuInsured: boolean("is_nbu_insured").notNull().default(true), // NBU (Nichtbetriebs-Unfallversicherung)
  isRentner: boolean("is_rentner").notNull().default(false), // Rentner (AHV-Freibetrag)
  
  // Banking information
  bankName: text("bank_name").notNull(), // Name Bank und Ort
  bankIban: text("bank_iban").notNull(), // IBAN
  bankBic: text("bank_bic"), // BIC (optional)
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employeesRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  payrollPayments: many(payrollPayments),
}));

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

// ============================================================================
// PAYROLL ITEM TYPES (Lohnarten)
// Configuration for different types of salary items
// ============================================================================
export const payrollItemTypes = pgTable("payroll_item_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  code: text("code").notNull(), // e.g., "01", "02", "03"
  name: text("name").notNull(), // e.g., "Monatslohn", "Stundenlohn"
  
  // Which deductions apply to this payroll item type
  subjectToAhv: boolean("subject_to_ahv").notNull().default(true), // J/N for AHV
  subjectToAlv: boolean("subject_to_alv").notNull().default(true), // J/N for ALV
  subjectToNbu: boolean("subject_to_nbu").notNull().default(true), // J/N for NBU
  subjectToBvg: boolean("subject_to_bvg").notNull().default(true), // J/N for BVG
  subjectToQst: boolean("subject_to_qst").notNull().default(true), // J/N for QST (Quellensteuer)
  
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPayrollItemTypeSchema = createInsertSchema(payrollItemTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPayrollItemType = z.infer<typeof insertPayrollItemTypeSchema>;
export type PayrollItemType = typeof payrollItemTypes.$inferSelect;

// ============================================================================
// PAYROLL PAYMENTS (Lohnauszahlungen)
// Multiple payments can be made per month (e.g., weekly)
// ============================================================================
export const payrollPayments = pgTable("payroll_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: 'cascade' }),
  
  // Payment period
  paymentDate: date("payment_date").notNull(), // Actual payment date
  periodStart: date("period_start").notNull(), // Start of work period (e.g., week start)
  periodEnd: date("period_end").notNull(), // End of work period (e.g., week end)
  
  // For grouping into monthly/yearly reports
  paymentMonth: integer("payment_month").notNull(), // 1-12
  paymentYear: integer("payment_year").notNull(), // e.g., 2025
  
  // Calculated totals (stored for performance)
  grossSalary: numeric("gross_salary", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalDeductions: numeric("total_deductions", { precision: 10, scale: 2 }).notNull().default("0.00"),
  netSalary: numeric("net_salary", { precision: 10, scale: 2 }).notNull().default("0.00"),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payrollPaymentsRelations = relations(payrollPayments, ({ one, many }) => ({
  employee: one(employees, {
    fields: [payrollPayments.employeeId],
    references: [employees.id],
  }),
  payrollItems: many(payrollItems),
  deductions: many(deductions),
}));

export const insertPayrollPaymentSchema = createInsertSchema(payrollPayments).omit({
  id: true,
  grossSalary: true,
  totalDeductions: true,
  netSalary: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPayrollPayment = z.infer<typeof insertPayrollPaymentSchema>;
export type PayrollPayment = typeof payrollPayments.$inferSelect;

// ============================================================================
// PAYROLL ITEMS (Lohnarten)
// Individual salary components for each payment
// ============================================================================
export const payrollItems = pgTable("payroll_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payrollPaymentId: varchar("payroll_payment_id").notNull().references(() => payrollPayments.id, { onDelete: 'cascade' }),
  
  // Type of payroll item (Lohnart)
  type: text("type").notNull(), // e.g., "Monatslohn", "Stundenlohn", "Zulagen", "Provision", etc.
  description: text("description"), // Optional description
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  
  // For hourly wages
  hours: numeric("hours", { precision: 8, scale: 2 }), // Number of hours worked
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }), // Rate per hour
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payrollItemsRelations = relations(payrollItems, ({ one }) => ({
  payrollPayment: one(payrollPayments, {
    fields: [payrollItems.payrollPaymentId],
    references: [payrollPayments.id],
  }),
}));

export const insertPayrollItemSchema = createInsertSchema(payrollItems).omit({
  id: true,
  createdAt: true,
});

// Schema for creating payroll items without payrollPaymentId (used when creating payment)
export const insertPayrollItemWithoutPaymentIdSchema = createInsertSchema(payrollItems).omit({
  id: true,
  payrollPaymentId: true,
  createdAt: true,
});

export type InsertPayrollItem = z.infer<typeof insertPayrollItemSchema>;
export type InsertPayrollItemWithoutPaymentId = z.infer<typeof insertPayrollItemWithoutPaymentIdSchema>;
export type PayrollItem = typeof payrollItems.$inferSelect;

// ============================================================================
// DEDUCTIONS (Lohnabzüge)
// Individual deductions for each payment (AHV, ALV, SUVA, etc.)
// ============================================================================
export const deductions = pgTable("deductions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payrollPaymentId: varchar("payroll_payment_id").notNull().references(() => payrollPayments.id, { onDelete: 'cascade' }),
  
  // Type of deduction
  type: text("type").notNull(), // e.g., "AHV-Abzug", "ALV-Abzug", "NBU-Abzug", "Quellensteuer", "BVG/Pensionskasse", etc.
  description: text("description"),
  
  // Calculation details
  percentage: numeric("percentage", { precision: 5, scale: 4 }), // Rate used (e.g., 5.3% for AHV)
  baseAmount: numeric("base_amount", { precision: 10, scale: 2 }), // Amount on which % is calculated
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(), // Actual deduction amount
  
  // For tracking
  isAutoCalculated: boolean("is_auto_calculated").notNull().default(false), // vs. manually entered
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deductionsRelations = relations(deductions, ({ one }) => ({
  payrollPayment: one(payrollPayments, {
    fields: [deductions.payrollPaymentId],
    references: [payrollPayments.id],
  }),
}));

export const insertDeductionSchema = createInsertSchema(deductions).omit({
  id: true,
  createdAt: true,
});

// Schema for creating deductions without payrollPaymentId (used when creating payment)
export const insertDeductionWithoutPaymentIdSchema = createInsertSchema(deductions).omit({
  id: true,
  payrollPaymentId: true,
  createdAt: true,
});

export type InsertDeduction = z.infer<typeof insertDeductionSchema>;
export type InsertDeductionWithoutPaymentId = z.infer<typeof insertDeductionWithoutPaymentIdSchema>;
export type Deduction = typeof deductions.$inferSelect;

// ============================================================================
// PAYROLL TEMPLATES (Lohnvorlagen)
// Templates for recurring payments with predefined items and deductions
// ============================================================================
export const payrollTemplates = pgTable("payroll_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Template name (e.g., "Monatslohn Standard")
  description: text("description"), // Optional description
  
  // Template items (JSON array of payroll items)
  items: text("items").notNull(), // Stored as JSON string
  
  // Template deductions (JSON array of deductions)
  deductions: text("deductions").notNull(), // Stored as JSON string
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Validation schemas for template items and deductions
const templateItemSchema = z.object({
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  amount: z.string().or(z.number()).optional(),
  hours: z.string().or(z.number()).optional(),
  hourlyRate: z.string().or(z.number()).optional(),
});

const templateDeductionSchema = z.object({
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  percentage: z.string().or(z.number()).optional(),
  baseAmount: z.string().or(z.number()).optional(),
  amount: z.string().or(z.number()).optional(),
  isAutoCalculated: z.boolean().optional(),
});

export const insertPayrollTemplateSchema = createInsertSchema(payrollTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  items: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.every((item) => templateItemSchema.safeParse(item).success);
    } catch {
      return false;
    }
  }, "Items must be valid JSON array"),
  deductions: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.every((item) => templateDeductionSchema.safeParse(item).success);
    } catch {
      return false;
    }
  }, "Deductions must be valid JSON array"),
});

export type InsertPayrollTemplate = z.infer<typeof insertPayrollTemplateSchema>;
export type PayrollTemplate = typeof payrollTemplates.$inferSelect;

// Helper types for structured template data
export type TemplateItem = z.infer<typeof templateItemSchema>;
export type TemplateDeduction = z.infer<typeof templateDeductionSchema>;

// ============================================================================
// PAYROLL ITEM TYPES (Constants for dropdown/validation)
// ============================================================================
export const PAYROLL_ITEM_TYPES = [
  "Monatslohn",
  "Stundenlohn",
  "Zulagen",
  "Provision",
  "13. Monatslohn",
  "Feriengeld",
  "Korrektur Vormonate",
  "Kinderzulagen",
  "Mutterschaftsentschädigung",
  "ALV Entschädigung",
  "Unfall Taggeld",
  "Überstundenzuschläge",
] as const;

export const DEDUCTION_TYPES = [
  "AHV-Abzug",
  "ALV-Abzug",
  "NBU-Abzug",
  "BVG/Pensionskasse",
  "Quellensteuer",
  "Krankengeld",
  "Korrektur von Vormonat",
] as const;
