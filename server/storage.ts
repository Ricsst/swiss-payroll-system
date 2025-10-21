import {
  companies,
  employees,
  payrollPayments,
  payrollItems,
  deductions,
  payrollTemplates,
  type Company,
  type InsertCompany,
  type Employee,
  type InsertEmployee,
  type PayrollPayment,
  type InsertPayrollPayment,
  type PayrollItem,
  type InsertPayrollItem,
  type Deduction,
  type InsertDeduction,
  type PayrollTemplate,
  type InsertPayrollTemplate,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Company
  getCompany(): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(company: InsertCompany): Promise<Company>;

  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: InsertEmployee): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;

  // Payroll Payments
  getPayrollPayments(year?: number, month?: number): Promise<any[]>;
  getPayrollPayment(id: string): Promise<any>;
  createPayrollPayment(
    payment: InsertPayrollPayment,
    items: InsertPayrollItem[],
    deductionsList: InsertDeduction[]
  ): Promise<PayrollPayment>;
  
  // Payroll Templates
  getPayrollTemplates(): Promise<PayrollTemplate[]>;
  getPayrollTemplate(id: string): Promise<PayrollTemplate | undefined>;
  createPayrollTemplate(template: InsertPayrollTemplate): Promise<PayrollTemplate>;
  updatePayrollTemplate(id: string, template: InsertPayrollTemplate): Promise<PayrollTemplate>;
  deletePayrollTemplate(id: string): Promise<void>;
  
  // Reports
  getMonthlyReport(year: number, month: number): Promise<any>;
  getYearlyReport(year: number): Promise<any>;
  getDashboardStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // ============================================================================
  // COMPANY
  // ============================================================================
  async getCompany(): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).limit(1);
    return company || undefined;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(insertCompany: InsertCompany): Promise<Company> {
    const existing = await this.getCompany();
    if (!existing) {
      return this.createCompany(insertCompany);
    }
    const [company] = await db
      .update(companies)
      .set({ ...insertCompany, updatedAt: new Date() })
      .where(eq(companies.id, existing.id))
      .returning();
    return company;
  }

  // ============================================================================
  // EMPLOYEES
  // ============================================================================
  async getEmployees(): Promise<Employee[]> {
    return db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(insertEmployee)
      .returning();
    return employee;
  }

  async updateEmployee(
    id: string,
    insertEmployee: InsertEmployee
  ): Promise<Employee> {
    const [employee] = await db
      .update(employees)
      .set({ ...insertEmployee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  // ============================================================================
  // PAYROLL PAYMENTS
  // ============================================================================
  async getPayrollPayments(year?: number, month?: number): Promise<any[]> {
    let query = db
      .select({
        id: payrollPayments.id,
        paymentDate: payrollPayments.paymentDate,
        periodStart: payrollPayments.periodStart,
        periodEnd: payrollPayments.periodEnd,
        paymentMonth: payrollPayments.paymentMonth,
        paymentYear: payrollPayments.paymentYear,
        grossSalary: payrollPayments.grossSalary,
        totalDeductions: payrollPayments.totalDeductions,
        netSalary: payrollPayments.netSalary,
        notes: payrollPayments.notes,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
        },
      })
      .from(payrollPayments)
      .innerJoin(employees, eq(payrollPayments.employeeId, employees.id));

    // Build where conditions
    const conditions = [];
    if (year !== undefined) {
      conditions.push(eq(payrollPayments.paymentYear, year));
    }
    if (month !== undefined) {
      conditions.push(eq(payrollPayments.paymentMonth, month));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(payrollPayments.paymentDate)) as any;

    return query;
  }

  async getPayrollPayment(id: string): Promise<any> {
    const [payment] = await db
      .select({
        id: payrollPayments.id,
        paymentDate: payrollPayments.paymentDate,
        periodStart: payrollPayments.periodStart,
        periodEnd: payrollPayments.periodEnd,
        paymentMonth: payrollPayments.paymentMonth,
        paymentYear: payrollPayments.paymentYear,
        grossSalary: payrollPayments.grossSalary,
        totalDeductions: payrollPayments.totalDeductions,
        netSalary: payrollPayments.netSalary,
        notes: payrollPayments.notes,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
        },
      })
      .from(payrollPayments)
      .innerJoin(employees, eq(payrollPayments.employeeId, employees.id))
      .where(eq(payrollPayments.id, id));

    if (!payment) {
      return undefined;
    }

    const items = await db
      .select()
      .from(payrollItems)
      .where(eq(payrollItems.payrollPaymentId, id));

    const deductionsList = await db
      .select()
      .from(deductions)
      .where(eq(deductions.payrollPaymentId, id));

    return {
      ...payment,
      payrollItems: items,
      deductions: deductionsList,
    };
  }

  async createPayrollPayment(
    payment: InsertPayrollPayment,
    items: InsertPayrollItem[],
    deductionsList: InsertDeduction[]
  ): Promise<PayrollPayment> {
    // Calculate totals
    const grossSalary = items.reduce(
      (sum, item) => sum + parseFloat(item.amount),
      0
    );
    const totalDeductions = deductionsList.reduce(
      (sum, d) => sum + parseFloat(d.amount),
      0
    );
    const netSalary = grossSalary - totalDeductions;

    const [paymentRecord] = await db
      .insert(payrollPayments)
      .values({
        ...payment,
        grossSalary: grossSalary.toFixed(2),
        totalDeductions: totalDeductions.toFixed(2),
        netSalary: netSalary.toFixed(2),
      })
      .returning();

    // Insert payroll items
    if (items.length > 0) {
      await db.insert(payrollItems).values(
        items.map((item) => ({
          ...item,
          payrollPaymentId: paymentRecord.id,
        }))
      );
    }

    // Insert deductions
    if (deductionsList.length > 0) {
      await db.insert(deductions).values(
        deductionsList.map((d) => ({
          ...d,
          payrollPaymentId: paymentRecord.id,
        }))
      );
    }

    return paymentRecord;
  }

  // ============================================================================
  // REPORTS
  // ============================================================================
  async getMonthlyReport(year: number, month: number): Promise<any> {
    const payments = await db
      .select({
        employeeId: employees.id,
        employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
        grossSalary: payrollPayments.grossSalary,
        totalDeductions: payrollPayments.totalDeductions,
        netSalary: payrollPayments.netSalary,
      })
      .from(payrollPayments)
      .innerJoin(employees, eq(payrollPayments.employeeId, employees.id))
      .where(
        and(
          eq(payrollPayments.paymentYear, year),
          eq(payrollPayments.paymentMonth, month)
        )
      );

    // Group by employee
    const employeeMap = new Map<string, any>();
    
    for (const payment of payments) {
      const existing = employeeMap.get(payment.employeeId);
      if (existing) {
        existing.totalGrossSalary = (
          parseFloat(existing.totalGrossSalary) +
          parseFloat(payment.grossSalary)
        ).toFixed(2);
        existing.totalDeductions = (
          parseFloat(existing.totalDeductions) +
          parseFloat(payment.totalDeductions)
        ).toFixed(2);
        existing.totalNetSalary = (
          parseFloat(existing.totalNetSalary) +
          parseFloat(payment.netSalary)
        ).toFixed(2);
        existing.paymentsCount += 1;
      } else {
        employeeMap.set(payment.employeeId, {
          employeeId: payment.employeeId,
          employeeName: payment.employeeName,
          totalGrossSalary: payment.grossSalary,
          totalDeductions: payment.totalDeductions,
          totalNetSalary: payment.netSalary,
          paymentsCount: 1,
        });
      }
    }

    const employeesList = Array.from(employeeMap.values());

    const totals = employeesList.reduce(
      (acc, emp) => ({
        grossSalary: (
          parseFloat(acc.grossSalary) +
          parseFloat(emp.totalGrossSalary)
        ).toFixed(2),
        deductions: (
          parseFloat(acc.deductions) +
          parseFloat(emp.totalDeductions)
        ).toFixed(2),
        netSalary: (
          parseFloat(acc.netSalary) +
          parseFloat(emp.totalNetSalary)
        ).toFixed(2),
      }),
      { grossSalary: "0", deductions: "0", netSalary: "0" }
    );

    return {
      month,
      year,
      employees: employeesList,
      totals,
    };
  }

  async getYearlyReport(year: number): Promise<any> {
    const monthNames = [
      "Januar", "Februar", "März", "April", "Mai", "Juni",
      "Juli", "August", "September", "Oktober", "November", "Dezember"
    ];

    const allMonths = [];
    for (let month = 1; month <= 12; month++) {
      const payments = await db
        .select({
          grossSalary: payrollPayments.grossSalary,
          totalDeductions: payrollPayments.totalDeductions,
          netSalary: payrollPayments.netSalary,
        })
        .from(payrollPayments)
        .where(
          and(
            eq(payrollPayments.paymentYear, year),
            eq(payrollPayments.paymentMonth, month)
          )
        );

      const monthTotals = payments.reduce(
        (acc, payment) => ({
          grossSalary: (
            parseFloat(acc.grossSalary) +
            parseFloat(payment.grossSalary)
          ).toFixed(2),
          deductions: (
            parseFloat(acc.deductions) +
            parseFloat(payment.totalDeductions)
          ).toFixed(2),
          netSalary: (
            parseFloat(acc.netSalary) +
            parseFloat(payment.netSalary)
          ).toFixed(2),
        }),
        { grossSalary: "0", deductions: "0", netSalary: "0" }
      );

      allMonths.push({
        month,
        monthName: monthNames[month - 1],
        grossSalary: monthTotals.grossSalary,
        deductions: monthTotals.deductions,
        netSalary: monthTotals.netSalary,
        paymentsCount: payments.length,
      });
    }

    const yearTotals = allMonths.reduce(
      (acc, month) => ({
        grossSalary: (
          parseFloat(acc.grossSalary) +
          parseFloat(month.grossSalary)
        ).toFixed(2),
        deductions: (
          parseFloat(acc.deductions) +
          parseFloat(month.deductions)
        ).toFixed(2),
        netSalary: (
          parseFloat(acc.netSalary) +
          parseFloat(month.netSalary)
        ).toFixed(2),
        paymentsCount: acc.paymentsCount + month.paymentsCount,
      }),
      { grossSalary: "0", deductions: "0", netSalary: "0", paymentsCount: 0 }
    );

    return {
      year,
      months: allMonths,
      totals: yearTotals,
    };
  }

  async getDashboardStats(): Promise<any> {
    const allEmployees = await db.select().from(employees);
    const activeEmployees = allEmployees.filter((e) => e.isActive).length;

    const company = await this.getCompany();

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const currentMonthPayments = await db
      .select()
      .from(payrollPayments)
      .where(
        and(
          eq(payrollPayments.paymentYear, currentYear),
          eq(payrollPayments.paymentMonth, currentMonth)
        )
      );

    const totalPayrollThisMonth = currentMonthPayments.reduce(
      (sum, p) => sum + parseFloat(p.netSalary),
      0
    );

    return {
      activeEmployees,
      hasCompany: !!company,
      paymentsThisMonth: currentMonthPayments.length,
      totalPayrollThisMonth: totalPayrollThisMonth.toFixed(2),
    };
  }

  // ============================================================================
  // PAYROLL TEMPLATES
  // ============================================================================
  async getPayrollTemplates(): Promise<PayrollTemplate[]> {
    return db.select().from(payrollTemplates).orderBy(desc(payrollTemplates.createdAt));
  }

  async getPayrollTemplate(id: string): Promise<PayrollTemplate | undefined> {
    const [template] = await db
      .select()
      .from(payrollTemplates)
      .where(eq(payrollTemplates.id, id));
    return template || undefined;
  }

  async createPayrollTemplate(insertTemplate: InsertPayrollTemplate): Promise<PayrollTemplate> {
    const [template] = await db
      .insert(payrollTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updatePayrollTemplate(
    id: string,
    insertTemplate: InsertPayrollTemplate
  ): Promise<PayrollTemplate> {
    const [template] = await db
      .update(payrollTemplates)
      .set({ ...insertTemplate, updatedAt: new Date() })
      .where(eq(payrollTemplates.id, id))
      .returning();
    return template;
  }

  async deletePayrollTemplate(id: string): Promise<void> {
    await db.delete(payrollTemplates).where(eq(payrollTemplates.id, id));
  }
}

export const storage = new DatabaseStorage();
