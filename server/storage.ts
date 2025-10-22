import {
  companies,
  employees,
  payrollPayments,
  payrollItems,
  payrollItemTypes,
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
  type PayrollItemType,
  type InsertPayrollItemType,
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
  
  // Payroll Item Types (Lohnarten)
  getPayrollItemTypes(): Promise<PayrollItemType[]>;
  getPayrollItemType(id: string): Promise<PayrollItemType | undefined>;
  createPayrollItemType(itemType: InsertPayrollItemType): Promise<PayrollItemType>;
  updatePayrollItemType(id: string, itemType: InsertPayrollItemType): Promise<PayrollItemType>;
  deletePayrollItemType(id: string): Promise<void>;
  
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
        isLocked: payrollPayments.isLocked,
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
        isLocked: payrollPayments.isLocked,
        employeeId: payrollPayments.employeeId,
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

  async lockPayrollPayment(id: string): Promise<PayrollPayment> {
    const [payment] = await db
      .update(payrollPayments)
      .set({ isLocked: true, updatedAt: new Date() })
      .where(eq(payrollPayments.id, id))
      .returning();
    return payment;
  }

  async unlockPayrollPayment(id: string): Promise<PayrollPayment> {
    const [payment] = await db
      .update(payrollPayments)
      .set({ isLocked: false, updatedAt: new Date() })
      .where(eq(payrollPayments.id, id))
      .returning();
    return payment;
  }

  async deletePayrollPayment(id: string): Promise<void> {
    // Check if payment is locked
    const [payment] = await db
      .select({ isLocked: payrollPayments.isLocked })
      .from(payrollPayments)
      .where(eq(payrollPayments.id, id));
    
    if (payment?.isLocked) {
      throw new Error("Abgeschlossene Lohnauszahlungen können nicht gelöscht werden");
    }
    
    await db.delete(payrollPayments).where(eq(payrollPayments.id, id));
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
        paymentId: payrollPayments.id,
      })
      .from(payrollPayments)
      .innerJoin(employees, eq(payrollPayments.employeeId, employees.id))
      .where(
        and(
          eq(payrollPayments.paymentYear, year),
          eq(payrollPayments.paymentMonth, month)
        )
      );

    // Get all deductions for this month
    const allDeductions = await db
      .select()
      .from(deductions)
      .where(
        sql`${deductions.payrollPaymentId} IN (
          SELECT ${payrollPayments.id} 
          FROM ${payrollPayments} 
          WHERE ${payrollPayments.paymentYear} = ${year} 
          AND ${payrollPayments.paymentMonth} = ${month}
        )`
      );

    // Get all payroll items for this month
    const allPayrollItems = await db
      .select()
      .from(payrollItems)
      .where(
        sql`${payrollItems.payrollPaymentId} IN (
          SELECT ${payrollPayments.id} 
          FROM ${payrollPayments} 
          WHERE ${payrollPayments.paymentYear} = ${year} 
          AND ${payrollPayments.paymentMonth} = ${month}
        )`
      );

    // Get payroll item types for name mapping
    const allPayrollItemTypes = await db
      .select()
      .from(payrollItemTypes);

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

    // Calculate totals
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

    // Calculate deduction breakdowns by type
    const deductionBreakdown: Record<string, number> = {};
    for (const deduction of allDeductions) {
      const type = deduction.type;
      const amount = parseFloat(deduction.amount);
      deductionBreakdown[type] = (deductionBreakdown[type] || 0) + amount;
    }

    // Convert to array and sort
    const deductionSummary = Object.entries(deductionBreakdown)
      .map(([type, amount]) => ({
        type,
        amount: amount.toFixed(2),
      }))
      .sort((a, b) => a.type.localeCompare(b.type));

    // Calculate payroll item breakdowns by type
    const payrollItemBreakdown: Record<string, { name: string; amount: number }> = {};
    for (const item of allPayrollItems) {
      const typeCode = item.type;
      const amount = parseFloat(item.amount);
      
      // Find the name of this payroll item type
      const itemType = allPayrollItemTypes.find(t => t.code === typeCode);
      const typeName = itemType ? itemType.name : typeCode;
      
      if (!payrollItemBreakdown[typeCode]) {
        payrollItemBreakdown[typeCode] = { name: typeName, amount: 0 };
      }
      payrollItemBreakdown[typeCode].amount += amount;
    }

    // Convert to array and sort by code
    const payrollItemSummary = Object.entries(payrollItemBreakdown)
      .map(([code, data]) => ({
        code,
        type: data.name,
        amount: data.amount.toFixed(2),
      }))
      .sort((a, b) => a.code.localeCompare(b.code));

    return {
      month,
      year,
      employees: employeesList,
      totals,
      deductionSummary,
      payrollItemSummary,
      totalEmployees: employeesList.length,
      totalPayments: payments.length,
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
  // PAYROLL ITEM TYPES (Lohnarten)
  // ============================================================================
  async getPayrollItemTypes(): Promise<PayrollItemType[]> {
    return db.select().from(payrollItemTypes).orderBy(payrollItemTypes.sortOrder, payrollItemTypes.code);
  }

  async getPayrollItemType(id: string): Promise<PayrollItemType | undefined> {
    const [itemType] = await db
      .select()
      .from(payrollItemTypes)
      .where(eq(payrollItemTypes.id, id));
    return itemType || undefined;
  }

  async createPayrollItemType(insertItemType: InsertPayrollItemType): Promise<PayrollItemType> {
    const [itemType] = await db
      .insert(payrollItemTypes)
      .values(insertItemType)
      .returning();
    return itemType;
  }

  async updatePayrollItemType(
    id: string,
    insertItemType: InsertPayrollItemType
  ): Promise<PayrollItemType> {
    const [itemType] = await db
      .update(payrollItemTypes)
      .set({ ...insertItemType, updatedAt: new Date() })
      .where(eq(payrollItemTypes.id, id))
      .returning();
    return itemType;
  }

  async deletePayrollItemType(id: string): Promise<void> {
    await db.delete(payrollItemTypes).where(eq(payrollItemTypes.id, id));
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
