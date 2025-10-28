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
  type InsertPayrollItemWithoutPaymentId,
  type PayrollItemType,
  type InsertPayrollItemType,
  type Deduction,
  type InsertDeduction,
  type PayrollTemplate,
  type InsertPayrollTemplate,
} from "@shared/schema";
import { db, getDbForCompany } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

type DbConnection = ReturnType<typeof getDbForCompany>;

export interface IStorage {
  // Company
  getCompany(): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(company: InsertCompany): Promise<Company>;

  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByAhvNumber(ahvNumber: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;

  // Payroll Payments
  getPayrollPayments(year?: number, month?: number): Promise<any[]>;
  getPayrollPayment(id: string): Promise<any>;
  createPayrollPayment(
    payment: InsertPayrollPayment,
    items: InsertPayrollItemWithoutPaymentId[],
    deductionsList: InsertDeduction[]
  ): Promise<PayrollPayment>;
  updatePayrollPayment(
    id: string,
    payment: Partial<InsertPayrollPayment>,
    items: InsertPayrollItemWithoutPaymentId[],
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
  
  // Cumulative ALV calculation
  getCumulativeAlvData(employeeId: string, year: number, excludePaymentId?: string): Promise<any>;
  
  // Cumulative NBU calculation
  getCumulativeNbuData(employeeId: string, year: number, excludePaymentId?: string): Promise<any>;
  
  // Preview deductions
  previewDeductions(employeeId: string, paymentMonth: number, paymentYear: number, payrollItems: any[]): Promise<InsertDeduction[]>;
}

export class DatabaseStorage implements IStorage {
  private db: DbConnection;

  constructor(dbConnection?: DbConnection) {
    this.db = dbConnection || db;
  }

  // ============================================================================
  // COMPANY
  // ============================================================================
  async getCompany(): Promise<Company | undefined> {
    const [company] = await this.db.select().from(companies).limit(1);
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
    return this.db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByAhvNumber(ahvNumber: string): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.ahvNumber, ahvNumber));
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
    insertEmployee: Partial<InsertEmployee>
  ): Promise<Employee> {
    const [employee] = await db
      .update(employees)
      .set({ ...insertEmployee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.db.delete(employees).where(eq(employees.id, id));
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
          ahvNumber: employees.ahvNumber,
          email: employees.email,
          street: employees.street,
          postalCode: employees.postalCode,
          city: employees.city,
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
      items: items,
      deductions: deductionsList,
    };
  }

  async createPayrollPayment(
    payment: InsertPayrollPayment,
    items: InsertPayrollItemWithoutPaymentId[],
    deductionsList: InsertDeduction[]
  ): Promise<PayrollPayment> {
    // Apply cumulative ALV calculation
    let adjustedDeductions = await this.applyCumulativeAlvLimit(
      payment.employeeId,
      payment.paymentYear,
      payment.paymentMonth,
      items,
      deductionsList,
      payment.periodEnd, // for prorated calculation
      undefined // no payment ID to exclude (new payment)
    );

    // Apply cumulative NBU calculation
    adjustedDeductions = await this.applyCumulativeNbuLimit(
      payment.employeeId,
      payment.paymentYear,
      payment.paymentMonth,
      items,
      adjustedDeductions,
      payment.periodEnd, // for prorated calculation
      undefined // no payment ID to exclude (new payment)
    );

    // Calculate totals
    const grossSalary = items.reduce(
      (sum, item) => sum + parseFloat(item.amount),
      0
    );
    const totalDeductions = adjustedDeductions.reduce(
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
      await this.db.insert(payrollItems).values(
        items.map((item) => ({
          ...item,
          payrollPaymentId: paymentRecord.id,
        }))
      );
    }

    // Insert deductions
    if (adjustedDeductions.length > 0) {
      await this.db.insert(deductions).values(
        adjustedDeductions.map((d) => ({
          ...d,
          payrollPaymentId: paymentRecord.id,
        }))
      );
    }

    return paymentRecord;
  }

  async updatePayrollPayment(
    id: string,
    payment: Partial<InsertPayrollPayment>,
    items: InsertPayrollItemWithoutPaymentId[],
    deductionsList: InsertDeduction[]
  ): Promise<PayrollPayment> {
    // Check if payment is locked
    const [existingPayment] = await db
      .select({ 
        isLocked: payrollPayments.isLocked, 
        employeeId: payrollPayments.employeeId, 
        paymentYear: payrollPayments.paymentYear,
        paymentMonth: payrollPayments.paymentMonth,
        periodEnd: payrollPayments.periodEnd
      })
      .from(payrollPayments)
      .where(eq(payrollPayments.id, id));
    
    if (existingPayment?.isLocked) {
      throw new Error("Abgeschlossene Lohnauszahlungen können nicht bearbeitet werden");
    }

    // Get payment month and period end for ALV calculation
    const paymentMonth = payment.paymentMonth || existingPayment.paymentMonth;
    const employeeId = payment.employeeId || existingPayment.employeeId;
    const paymentYear = payment.paymentYear || existingPayment.paymentYear;
    const periodEnd = payment.periodEnd || existingPayment.periodEnd;

    // If BOTH items and deductions arrays are empty, load existing items from database
    // This allows recalculating deductions without re-sending all items
    // If only items is empty (but deductions is not), allow clearing items
    let effectiveItems = items;
    if (items.length === 0 && deductionsList.length === 0) {
      const existingItems = await db
        .select()
        .from(payrollItems)
        .where(eq(payrollItems.payrollPaymentId, id));
      
      effectiveItems = existingItems.map(item => ({
        type: item.type,
        description: item.description || "",
        amount: item.amount,
        hours: item.hours || undefined,
        hourlyRate: item.hourlyRate || undefined,
      }));
    }

    // If deductionsList is empty, calculate deductions from items
    let calculatedDeductions = deductionsList;
    if (deductionsList.length === 0) {
      calculatedDeductions = await this.calculateDeductionsFromItems(employeeId, effectiveItems);
    }

    // Apply cumulative ALV calculation
    let adjustedDeductions = await this.applyCumulativeAlvLimit(
      employeeId,
      paymentYear,
      paymentMonth,
      effectiveItems,
      calculatedDeductions,
      periodEnd, // for prorated calculation
      id // exclude current payment from cumulative calculation
    );

    // Apply cumulative NBU calculation
    adjustedDeductions = await this.applyCumulativeNbuLimit(
      employeeId,
      paymentYear,
      paymentMonth,
      effectiveItems,
      adjustedDeductions,
      periodEnd, // for prorated calculation
      id // exclude current payment from cumulative calculation
    );

    // Calculate totals
    const grossSalary = effectiveItems.reduce(
      (sum, item) => sum + parseFloat(item.amount),
      0
    );
    const totalDeductions = adjustedDeductions.reduce(
      (sum, d) => sum + parseFloat(d.amount),
      0
    );
    const netSalary = grossSalary - totalDeductions;

    // Update payment
    const [paymentRecord] = await db
      .update(payrollPayments)
      .set({
        ...payment,
        grossSalary: grossSalary.toFixed(2),
        totalDeductions: totalDeductions.toFixed(2),
        netSalary: netSalary.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(payrollPayments.id, id))
      .returning();

    // Delete old items and deductions
    await this.db.delete(payrollItems).where(eq(payrollItems.payrollPaymentId, id));
    await this.db.delete(deductions).where(eq(deductions.payrollPaymentId, id));

    // Insert new payroll items (use effectiveItems which includes existing items if items was empty)
    if (effectiveItems.length > 0) {
      await this.db.insert(payrollItems).values(
        effectiveItems.map((item) => ({
          ...item,
          payrollPaymentId: id,
        }))
      );
    }

    // Insert new deductions
    if (adjustedDeductions.length > 0) {
      await this.db.insert(deductions).values(
        adjustedDeductions.map((d) => ({
          ...d,
          payrollPaymentId: id,
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
    
    await this.db.delete(payrollPayments).where(eq(payrollPayments.id, id));
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
          payrollItems: [],
          deductions: [],
        });
      }
    }

    // Aggregate payroll items by employee and type
    const employeePayrollItemsMap = new Map<string, Map<string, any>>();
    for (const item of allPayrollItems) {
      const payment = payments.find(p => p.paymentId === item.payrollPaymentId);
      if (payment) {
        if (!employeePayrollItemsMap.has(payment.employeeId)) {
          employeePayrollItemsMap.set(payment.employeeId, new Map());
        }
        const itemsMap = employeePayrollItemsMap.get(payment.employeeId)!;
        const itemType = allPayrollItemTypes.find(t => t.code === item.type);
        const itemKey = item.type;
        
        if (itemsMap.has(itemKey)) {
          const existing = itemsMap.get(itemKey);
          existing.amount = (parseFloat(existing.amount) + parseFloat(item.amount)).toFixed(2);
          
          // Track hourly amounts separately for correct rate calculation
          if (item.hours && parseFloat(item.hours) > 0) {
            // This item has hours - accumulate hours and hourly amounts
            existing.hours = existing.hours 
              ? (parseFloat(existing.hours) + parseFloat(item.hours)).toFixed(2)
              : item.hours;
            existing.totalHourlyAmount = existing.totalHourlyAmount
              ? (parseFloat(existing.totalHourlyAmount) + parseFloat(item.amount)).toFixed(2)
              : item.amount;
            // Recalculate weighted average rate for hourly items
            existing.hourlyRate = (parseFloat(existing.totalHourlyAmount) / parseFloat(existing.hours)).toFixed(2);
          }
        } else {
          const hasHours = item.hours && parseFloat(item.hours) > 0;
          itemsMap.set(itemKey, {
            code: item.type,
            name: itemType?.name || item.type,
            description: item.description,
            amount: item.amount,
            hours: item.hours || null,
            hourlyRate: item.hourlyRate || null,
            totalHourlyAmount: hasHours ? item.amount : null, // Track separately for rate calculation
          });
        }
      }
    }

    // Aggregate deductions by employee and type
    const employeeDeductionsMap = new Map<string, Map<string, any>>();
    for (const ded of allDeductions) {
      const payment = payments.find(p => p.paymentId === ded.payrollPaymentId);
      if (payment) {
        if (!employeeDeductionsMap.has(payment.employeeId)) {
          employeeDeductionsMap.set(payment.employeeId, new Map());
        }
        const deductionsMap = employeeDeductionsMap.get(payment.employeeId)!;
        const dedKey = ded.type;
        
        if (deductionsMap.has(dedKey)) {
          const existing = deductionsMap.get(dedKey);
          existing.amount = (parseFloat(existing.amount) + parseFloat(ded.amount)).toFixed(2);
          // For aggregated deductions, we average the rate and baseAmount
          if (ded.percentage && existing.rate) {
            existing.rate = ded.percentage; // Keep the same rate (should be consistent)
          }
          if (ded.baseAmount && existing.baseAmount) {
            existing.baseAmount = (parseFloat(existing.baseAmount) + parseFloat(ded.baseAmount)).toFixed(2);
          }
        } else {
          deductionsMap.set(dedKey, {
            type: ded.type,
            amount: ded.amount,
            rate: ded.percentage,
            baseAmount: ded.baseAmount,
          });
        }
      }
    }

    // Add aggregated items and deductions to each employee
    for (const [employeeId, employee] of Array.from(employeeMap.entries())) {
      if (employeePayrollItemsMap.has(employeeId)) {
        // Remove the internal totalHourlyAmount field before exposing to API
        employee.payrollItems = Array.from(employeePayrollItemsMap.get(employeeId)!.values()).map(item => {
          const { totalHourlyAmount, ...itemWithoutInternalFields } = item;
          return itemWithoutInternalFields;
        });
      }
      if (employeeDeductionsMap.has(employeeId)) {
        employee.deductions = Array.from(employeeDeductionsMap.get(employeeId)!.values());
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

    const company = await this.getCompany();
    const alvMaxIncome = company ? parseFloat(company.alvMaxIncomePerYear) : 148200;

    // Get all payments for the year
    const allPayments = await db
      .select()
      .from(payrollPayments)
      .where(eq(payrollPayments.paymentYear, year));

    // Get all payroll item types to map codes to names
    const allPayrollItemTypes = await this.db.select().from(payrollItemTypes);
    const typeMap = new Map<string, { code: string; name: string }>();
    for (const type of allPayrollItemTypes) {
      typeMap.set(type.code, { code: type.code, name: type.name });
    }

    // Get all payroll items for the year
    const paymentIds = allPayments.map(p => p.id);
    const allPayrollItems = paymentIds.length > 0 
      ? await db
          .select()
          .from(payrollItems)
          .where(sql`${payrollItems.payrollPaymentId} IN (${sql.join(paymentIds.map(id => sql`${id}`), sql`, `)})`)
      : [];

    // Get all deductions for the year
    const allDeductions = paymentIds.length > 0
      ? await db
          .select()
          .from(deductions)
          .where(sql`${deductions.payrollPaymentId} IN (${sql.join(paymentIds.map(id => sql`${id}`), sql`, `)})`)
      : [];

    // Aggregate payroll items by type with codes
    const payrollItemBreakdown: Record<string, { code: string; name: string; quantity: number; amount: number }> = {};
    for (const item of allPayrollItems) {
      const typeCode = item.type; // This is the code (e.g., "01")
      const hours = item.hours ? parseFloat(item.hours) : 0;
      const amount = parseFloat(item.amount);
      
      const typeInfo = typeMap.get(typeCode);
      const code = typeInfo?.code || typeCode;
      const name = typeInfo?.name || typeCode;

      if (!payrollItemBreakdown[code]) {
        payrollItemBreakdown[code] = { code, name, quantity: 0, amount: 0 };
      }
      payrollItemBreakdown[code].quantity += hours || 1;
      payrollItemBreakdown[code].amount += amount;
    }

    const payrollItemSummary = Object.entries(payrollItemBreakdown)
      .map(([_, data]) => ({
        code: data.code,
        type: data.name,
        quantity: data.quantity.toFixed(2),
        amount: data.amount.toFixed(2),
      }))
      .sort((a, b) => a.code.localeCompare(b.code));

    // Aggregate deductions by type
    const deductionBreakdown: Record<string, number> = {};
    for (const ded of allDeductions) {
      const type = ded.type;
      const amount = parseFloat(ded.amount);

      if (!deductionBreakdown[type]) {
        deductionBreakdown[type] = 0;
      }
      deductionBreakdown[type] += amount;
    }

    const deductionSummary = Object.entries(deductionBreakdown)
      .map(([type, amount]) => ({
        type,
        amount: amount.toFixed(2),
      }))
      .sort((a, b) => a.type.localeCompare(b.type));

    // Calculate totals
    const totalGross = allPayments.reduce((sum, p) => sum + parseFloat(p.grossSalary), 0);
    const totalDeductions = allPayments.reduce((sum, p) => sum + parseFloat(p.totalDeductions), 0);
    const totalNet = allPayments.reduce((sum, p) => sum + parseFloat(p.netSalary), 0);

    // Calculate basis amounts
    // NBU basis only includes employees who are NBU-insured
    let ahvBasis = totalGross;
    let alvBasis = totalGross;
    let nbuBasis = 0;
    let bvgBasis = totalGross;

    // Get employee summary
    const employeeMap = new Map<string, any>();
    
    for (const payment of allPayments) {
      const employee = await this.db.select().from(employees).where(eq(employees.id, payment.employeeId)).limit(1);
      if (employee.length === 0) continue;

      const emp = employee[0];
      const empId = emp.id;

      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          ahvNumber: emp.ahvNumber,
          birthDate: emp.birthDate,
          firstName: emp.firstName,
          lastName: emp.lastName,
          isNbuInsured: emp.isNbuInsured,
          employedFrom: null,
          employedTo: null,
          ahvWage: 0,
          alvWage: 0,
          alv1Wage: 0,
          alv2Wage: 0,
          nbuWage: 0,
          childAllowance: 0,
        });
      }

      const empData = employeeMap.get(empId);
      const month = payment.paymentMonth;

      // Track employment period
      if (empData.employedFrom === null || month < empData.employedFrom) {
        empData.employedFrom = month;
      }
      if (empData.employedTo === null || month > empData.employedTo) {
        empData.employedTo = month;
      }

      // For simplicity, use gross salary as AHV/ALV wage
      // In a more complex system, you would check which items are subject to each
      const grossSalary = parseFloat(payment.grossSalary);
      empData.ahvWage += grossSalary;
      empData.alvWage += grossSalary;

      // NBU wage only for NBU-insured employees
      if (emp.isNbuInsured) {
        empData.nbuWage += grossSalary;
        nbuBasis += grossSalary;
      }
    }

    // Calculate ALV1/ALV2 split and child allowances per employee
    for (const [empId, empData] of Array.from(employeeMap.entries())) {
      // ALV split based on annual limit
      const alv1Amount = Math.min(empData.alvWage, alvMaxIncome);
      const alv2Amount = Math.max(0, empData.alvWage - alvMaxIncome);
      empData.alv1Wage = alv1Amount;
      empData.alv2Wage = alv2Amount;

      // Calculate child allowances (Kinderzulagen) for this employee
      const empPayments = allPayments.filter(p => p.employeeId === empId);
      const empPaymentIds = empPayments.map(p => p.id);
      
      if (empPaymentIds.length > 0) {
        const empItems = allPayrollItems.filter(item => empPaymentIds.includes(item.payrollPaymentId));
        const childAllowanceItems = empItems.filter(item => {
          const itemType = typeMap.get(item.type);
          return itemType?.name === 'Kinderzulagen';
        });
        
        empData.childAllowance = childAllowanceItems.reduce((sum, item) => {
          return sum + parseFloat(item.amount);
        }, 0);
      }
    }

    // Convert to array and format
    const employeeSummary = Array.from(employeeMap.values()).map(emp => ({
      ahvNumber: emp.ahvNumber,
      birthDate: emp.birthDate,
      firstName: emp.firstName,
      lastName: emp.lastName,
      employedFrom: emp.employedFrom,
      employedTo: emp.employedTo,
      ahvWage: emp.ahvWage.toFixed(2),
      alvWage: Math.min(emp.alvWage, alvMaxIncome).toFixed(2),
      alv1Wage: emp.alv1Wage.toFixed(2),
      alv2Wage: emp.alv2Wage.toFixed(2),
      nbuWage: emp.nbuWage.toFixed(2),
      childAllowance: emp.childAllowance.toFixed(2),
    }));

    // Filter employees with child allowances for separate table
    const childAllowanceEmployees = employeeSummary.filter(emp => parseFloat(emp.childAllowance) > 0);

    // Monthly breakdown
    const allMonths = [];
    for (let month = 1; month <= 12; month++) {
      const monthPayments = allPayments.filter(p => p.paymentMonth === month);
      const monthTotals = monthPayments.reduce(
        (acc, payment) => ({
          grossSalary: acc.grossSalary + parseFloat(payment.grossSalary),
          deductions: acc.deductions + parseFloat(payment.totalDeductions),
          netSalary: acc.netSalary + parseFloat(payment.netSalary),
        }),
        { grossSalary: 0, deductions: 0, netSalary: 0 }
      );

      allMonths.push({
        month,
        monthName: monthNames[month - 1],
        grossSalary: monthTotals.grossSalary.toFixed(2),
        deductions: monthTotals.deductions.toFixed(2),
        netSalary: monthTotals.netSalary.toFixed(2),
        paymentsCount: monthPayments.length,
      });
    }

    // ============================================================================
    // Lohnsummen-Zusammenstellung nach Geschlecht (Wage Summary by Gender)
    // ============================================================================
    const uvgMaxIncome = company ? parseFloat(company.suvaMaxIncomePerYear) : 148200;
    
    // Initialize accumulators for men and women
    const wageSummary = {
      male: {
        ahvSubject: 0,           // AHV-pflichtige Löhne
        nonAhvSubject: 0,        // Nicht AHV-pflichtige Löhne (Rentner)
        totalRelevant: 0,        // Total massgebende Lohnsummen
        excessWage: 0,           // Überschusslohn (ab CHF 148'200)
        nonUvgPremium: 0,        // Nicht UVG-prämienpflichtige Löhne
        uvgWage: 0,              // UVG-Lohnsumme (bis CHF 148'200)
        lessThan8Hours: 0,       // Personal mit weniger als 8 Stunden/Woche
        uvgo70Plus_BU: 0,        // UVGO Personen 70+ BU-Lohnsumme
        uvgo70Plus_NBU: 0,       // UVGO Personen 70+ NBU-Lohnsumme
      },
      female: {
        ahvSubject: 0,
        nonAhvSubject: 0,
        totalRelevant: 0,
        excessWage: 0,
        nonUvgPremium: 0,
        uvgWage: 0,
        lessThan8Hours: 0,
        uvgo70Plus_BU: 0,
        uvgo70Plus_NBU: 0,
      },
    };

    // Get all employees with their annual wages
    const employeeAnnualWages = new Map<string, { employee: any; totalWage: number }>();
    
    for (const payment of allPayments) {
      const employee = await this.db.select().from(employees).where(eq(employees.id, payment.employeeId)).limit(1);
      if (employee.length === 0) continue;

      const emp = employee[0];
      const wage = parseFloat(payment.grossSalary);

      if (!employeeAnnualWages.has(emp.id)) {
        employeeAnnualWages.set(emp.id, { employee: emp, totalWage: 0 });
      }
      employeeAnnualWages.get(emp.id)!.totalWage += wage;
    }

    // Calculate summary by gender
    for (const [empId, data] of Array.from(employeeAnnualWages.entries())) {
      const emp = data.employee;
      const annualWage = data.totalWage;
      const gender = emp.gender.toLowerCase();
      const isMale = gender === 'mann' || gender === 'male' || gender === 'm';
      const summary = isMale ? wageSummary.male : wageSummary.female;

      // Check if person is over 70 years old
      const birthDate = new Date(emp.birthDate);
      const endOfYear = new Date(year, 11, 31);
      const age = endOfYear.getFullYear() - birthDate.getFullYear();
      const isOver70 = age >= 70;

      // 1. AHV-pflichtige / Nicht AHV-pflichtige Löhne
      if (emp.isRentner) {
        summary.nonAhvSubject += annualWage;
      } else {
        summary.ahvSubject += annualWage;
      }

      // 2. Total massgebende Lohnsummen (sum of both)
      summary.totalRelevant += annualWage;

      // 3. Überschusslohn (wages above UVG limit per person)
      if (annualWage > uvgMaxIncome) {
        summary.excessWage += (annualWage - uvgMaxIncome);
      }

      // 4. UVG-Lohnsumme (wages up to UVG limit per person)
      const uvgWageForEmployee = Math.min(annualWage, uvgMaxIncome);
      summary.uvgWage += uvgWageForEmployee;

      // 5. UVGO für Personen 70+
      if (isOver70) {
        summary.uvgo70Plus_BU += uvgWageForEmployee;  // BU (Berufsunfall)
        if (emp.isNbuInsured) {
          summary.uvgo70Plus_NBU += uvgWageForEmployee;  // NBU (Nichtberufsunfall)
        }
      }
    }

    return {
      year,
      months: allMonths,
      payrollItemSummary,
      deductionSummary,
      basisAmounts: {
        ahvBasis: ahvBasis.toFixed(2),
        alvBasis: alvBasis.toFixed(2),
        nbuBasis: nbuBasis.toFixed(2),
        bvgBasis: bvgBasis.toFixed(2),
      },
      employeeSummary,
      childAllowanceEmployees,
      uvgMaxIncome: uvgMaxIncome.toFixed(2),
      wageSummary: {
        male: {
          ahvSubject: wageSummary.male.ahvSubject.toFixed(2),
          nonAhvSubject: wageSummary.male.nonAhvSubject.toFixed(2),
          totalRelevant: wageSummary.male.totalRelevant.toFixed(2),
          excessWage: wageSummary.male.excessWage.toFixed(2),
          nonUvgPremium: wageSummary.male.nonUvgPremium.toFixed(2),
          uvgWage: wageSummary.male.uvgWage.toFixed(2),
          lessThan8Hours: wageSummary.male.lessThan8Hours.toFixed(2),
          uvgo70Plus_BU: wageSummary.male.uvgo70Plus_BU.toFixed(2),
          uvgo70Plus_NBU: wageSummary.male.uvgo70Plus_NBU.toFixed(2),
        },
        female: {
          ahvSubject: wageSummary.female.ahvSubject.toFixed(2),
          nonAhvSubject: wageSummary.female.nonAhvSubject.toFixed(2),
          totalRelevant: wageSummary.female.totalRelevant.toFixed(2),
          excessWage: wageSummary.female.excessWage.toFixed(2),
          nonUvgPremium: wageSummary.female.nonUvgPremium.toFixed(2),
          uvgWage: wageSummary.female.uvgWage.toFixed(2),
          lessThan8Hours: wageSummary.female.lessThan8Hours.toFixed(2),
          uvgo70Plus_BU: wageSummary.female.uvgo70Plus_BU.toFixed(2),
          uvgo70Plus_NBU: wageSummary.female.uvgo70Plus_NBU.toFixed(2),
        },
      },
      totals: {
        grossSalary: totalGross.toFixed(2),
        deductions: totalDeductions.toFixed(2),
        netSalary: totalNet.toFixed(2),
        paymentsCount: allPayments.length,
      },
    };
  }

  async getDashboardStats(): Promise<any> {
    const allEmployees = await this.db.select().from(employees);
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
    return this.db.select().from(payrollItemTypes).orderBy(payrollItemTypes.sortOrder, payrollItemTypes.code);
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
    await this.db.delete(payrollItemTypes).where(eq(payrollItemTypes.id, id));
  }

  // ============================================================================
  // PAYROLL TEMPLATES
  // ============================================================================
  async getPayrollTemplates(): Promise<PayrollTemplate[]> {
    return this.db.select().from(payrollTemplates).orderBy(desc(payrollTemplates.createdAt));
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
    await this.db.delete(payrollTemplates).where(eq(payrollTemplates.id, id));
  }

  // ============================================================================
  // EMPLOYEE PAYROLL OVERVIEW
  // ============================================================================
  async getEmployeePayrollOverview(employeeId: string, year: number) {
    // Get employee details
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId));

    if (!employee) {
      throw new Error("Employee not found");
    }

    // Get all payments for this employee in the year
    const payments = await db
      .select()
      .from(payrollPayments)
      .where(
        sql`${payrollPayments.employeeId} = ${employeeId} AND ${payrollPayments.paymentYear} = ${year}`
      );

    // Get all payroll items for these payments
    const paymentIds = payments.map(p => p.id);
    const allPayrollItems = paymentIds.length > 0
      ? await db
          .select()
          .from(payrollItems)
          .where(sql`${payrollItems.payrollPaymentId} IN (${sql.join(paymentIds.map(id => sql`${id}`), sql`, `)})`)
      : [];

    // Get all deductions for these payments
    const allDeductions = paymentIds.length > 0
      ? await db
          .select()
          .from(deductions)
          .where(sql`${deductions.payrollPaymentId} IN (${sql.join(paymentIds.map(id => sql`${id}`), sql`, `)})`)
      : [];

    // Get all payroll item types to map codes to names
    const allPayrollItemTypes = await this.db.select().from(payrollItemTypes);
    const typeMap = new Map<string, { code: string; name: string }>();
    for (const type of allPayrollItemTypes) {
      typeMap.set(type.code, { code: type.code, name: type.name });
    }

    // Create monthly breakdown structure
    const monthlyData: Record<string, Record<number, number>> = {};
    const deductionMonthlyData: Record<string, Record<number, number>> = {};

    // Process payroll items by month
    for (const item of allPayrollItems) {
      const payment = payments.find(p => p.id === item.payrollPaymentId);
      if (!payment) continue;

      const month = payment.paymentMonth;
      const typeCode = item.type;
      const amount = parseFloat(item.amount);

      if (!monthlyData[typeCode]) {
        monthlyData[typeCode] = {};
      }
      monthlyData[typeCode][month] = (monthlyData[typeCode][month] || 0) + amount;
    }

    // Process deductions by month
    for (const deduction of allDeductions) {
      const payment = payments.find(p => p.id === deduction.payrollPaymentId);
      if (!payment) continue;

      const month = payment.paymentMonth;
      const deductionType = deduction.type;
      const amount = parseFloat(deduction.amount);

      if (!deductionMonthlyData[deductionType]) {
        deductionMonthlyData[deductionType] = {};
      }
      deductionMonthlyData[deductionType][month] = (deductionMonthlyData[deductionType][month] || 0) + amount;
    }

    // Format payroll items with monthly breakdown
    const payrollItemsBreakdown = Object.entries(monthlyData).map(([code, months]) => {
      const typeInfo = typeMap.get(code);
      const monthlyAmounts: Record<number, string> = {};
      let total = 0;

      for (let m = 1; m <= 13; m++) {
        const amount = months[m] || 0;
        monthlyAmounts[m] = amount.toFixed(2);
        total += amount;
      }

      return {
        code,
        name: typeInfo?.name || code,
        months: monthlyAmounts,
        total: total.toFixed(2),
      };
    }).sort((a, b) => a.code.localeCompare(b.code));

    // Format deductions with monthly breakdown
    const deductionsBreakdown = Object.entries(deductionMonthlyData).map(([type, months]) => {
      const monthlyAmounts: Record<number, string> = {};
      let total = 0;

      for (let m = 1; m <= 13; m++) {
        const amount = months[m] || 0;
        monthlyAmounts[m] = amount.toFixed(2);
        total += amount;
      }

      return {
        type,
        months: monthlyAmounts,
        total: total.toFixed(2),
      };
    }).sort((a, b) => a.type.localeCompare(b.type));

    // Calculate monthly gross totals
    const grossMonthlyTotals: Record<number, number> = {};
    for (let m = 1; m <= 13; m++) {
      grossMonthlyTotals[m] = payrollItemsBreakdown.reduce((sum, item) => {
        return sum + parseFloat(item.months[m] || "0");
      }, 0);
    }

    // Calculate monthly deduction totals
    const deductionMonthlyTotals: Record<number, number> = {};
    for (let m = 1; m <= 13; m++) {
      deductionMonthlyTotals[m] = deductionsBreakdown.reduce((sum, item) => {
        return sum + parseFloat(item.months[m] || "0");
      }, 0);
    }

    // Calculate basis amounts and special wages (ALV1, ALV2, NBU, BVG)
    const company = await this.getCompany();
    const alvMaxIncome = company ? parseFloat(company.alvMaxIncomePerYear) : 148200;
    const nbuMaxIncome = company ? parseFloat(company.suvaMaxIncomePerYear) : 148200;

    // Initialize monthly basis amounts
    const ahvBasisMonthly: Record<number, number> = {};
    const alv1BasisMonthly: Record<number, number> = {};
    const alv2BasisMonthly: Record<number, number> = {};
    const alv1WageMonthly: Record<number, number> = {};
    const alv2WageMonthly: Record<number, number> = {};
    const nbuBasisMonthly: Record<number, number> = {};
    const bvgMonthly: Record<number, number> = {};

    // Track cumulative values for ALV/NBU limits
    let cumulativeAlvWage = 0;
    let cumulativeNbuWage = 0;

    // Process deductions month by month (1-13)
    for (let m = 1; m <= 13; m++) {
      // Get all deductions for this month
      const monthDeductions = allDeductions.filter(d => {
        const payment = payments.find(p => p.id === d.payrollPaymentId);
        return payment && payment.paymentMonth === m;
      });

      // AHV Basis
      const ahvDeduction = monthDeductions.find(d => d.type === 'AHV');
      const ahvBasis = ahvDeduction?.baseAmount ? parseFloat(ahvDeduction.baseAmount) : 0;
      ahvBasisMonthly[m] = ahvBasis;

      // ALV - split into ALV1 (up to limit) and ALV2 (above limit)
      const alvDeduction = monthDeductions.find(d => d.type === 'ALV' || d.type === 'ALV2');
      const alvBasis = alvDeduction?.baseAmount ? parseFloat(alvDeduction.baseAmount) : 0;
      
      // Calculate ALV1 and ALV2 based on cumulative
      const remainingAlv1Capacity = Math.max(0, alvMaxIncome - cumulativeAlvWage);
      const alv1Amount = Math.min(alvBasis, remainingAlv1Capacity);
      const alv2Amount = Math.max(0, alvBasis - alv1Amount);

      alv1BasisMonthly[m] = alv1Amount;
      alv2BasisMonthly[m] = alv2Amount;
      alv1WageMonthly[m] = alv1Amount;
      alv2WageMonthly[m] = alv2Amount;

      cumulativeAlvWage += alvBasis;

      // NBU Basis - only if employee is NBU insured
      if (employee.isNbuInsured) {
        const nbuDeduction = monthDeductions.find(d => d.type === 'NBU');
        const nbuBasis = nbuDeduction?.baseAmount ? parseFloat(nbuDeduction.baseAmount) : 0;
        
        // NBU also has a limit
        const remainingNbuCapacity = Math.max(0, nbuMaxIncome - cumulativeNbuWage);
        const nbuAmount = Math.min(nbuBasis, remainingNbuCapacity);
        
        nbuBasisMonthly[m] = nbuAmount;
        cumulativeNbuWage += nbuBasis;
      } else {
        nbuBasisMonthly[m] = 0;
      }

      // BVG
      const bvgDeduction = monthDeductions.find(d => d.type === 'BVG');
      const bvgAmount = bvgDeduction ? parseFloat(bvgDeduction.amount) : 0;
      bvgMonthly[m] = bvgAmount;
    }

    // Calculate child allowances for the year
    const childAllowanceItems = allPayrollItems.filter(item => {
      const itemType = typeMap.get(item.type);
      return itemType?.name === 'Kinderzulagen';
    });

    const totalChildAllowance = childAllowanceItems.reduce((sum, item) => {
      return sum + parseFloat(item.amount);
    }, 0);

    // Determine employment period for the year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const entryDate = employee.entryDate ? new Date(employee.entryDate) : null;
    const exitDate = employee.exitDate ? new Date(employee.exitDate) : null;

    let employmentStart = yearStart;
    let employmentEnd = yearEnd;

    if (entryDate && entryDate > yearStart) {
      employmentStart = entryDate;
    }
    if (exitDate && exitDate < yearEnd) {
      employmentEnd = exitDate;
    }

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        ahvNumber: employee.ahvNumber,
        birthDate: employee.birthDate || null,
        entryDate: employee.entryDate,
        exitDate: employee.exitDate,
        isNbuInsured: employee.isNbuInsured,
      },
      childAllowance: {
        hasChildAllowance: totalChildAllowance > 0,
        totalAmount: totalChildAllowance.toFixed(2),
        employmentPeriod: {
          from: employmentStart.toISOString().split('T')[0],
          to: employmentEnd.toISOString().split('T')[0],
        },
      },
      year,
      payrollItems: payrollItemsBreakdown,
      deductions: deductionsBreakdown,
      grossMonthlyTotals: Object.fromEntries(
        Object.entries(grossMonthlyTotals).map(([m, v]) => [m, v.toFixed(2)])
      ),
      deductionMonthlyTotals: Object.fromEntries(
        Object.entries(deductionMonthlyTotals).map(([m, v]) => [m, v.toFixed(2)])
      ),
      totalGross: Object.values(grossMonthlyTotals).reduce((a, b) => a + b, 0).toFixed(2),
      totalDeductions: Object.values(deductionMonthlyTotals).reduce((a, b) => a + b, 0).toFixed(2),
      // Basis amounts and special wages
      ahvBasis: Object.fromEntries(
        Object.entries(ahvBasisMonthly).map(([m, v]) => [m, v.toFixed(2)])
      ),
      alv1Basis: Object.fromEntries(
        Object.entries(alv1BasisMonthly).map(([m, v]) => [m, v.toFixed(2)])
      ),
      alv2Basis: Object.fromEntries(
        Object.entries(alv2BasisMonthly).map(([m, v]) => [m, v.toFixed(2)])
      ),
      alv1Wage: Object.fromEntries(
        Object.entries(alv1WageMonthly).map(([m, v]) => [m, v.toFixed(2)])
      ),
      alv2Wage: Object.fromEntries(
        Object.entries(alv2WageMonthly).map(([m, v]) => [m, v.toFixed(2)])
      ),
      nbuBasis: Object.fromEntries(
        Object.entries(nbuBasisMonthly).map(([m, v]) => [m, v.toFixed(2)])
      ),
      bvg: Object.fromEntries(
        Object.entries(bvgMonthly).map(([m, v]) => [m, v.toFixed(2)])
      ),
      // Totals
      totalAhvBasis: Object.values(ahvBasisMonthly).reduce((a, b) => a + b, 0).toFixed(2),
      totalAlv1Basis: Object.values(alv1BasisMonthly).reduce((a, b) => a + b, 0).toFixed(2),
      totalAlv2Basis: Object.values(alv2BasisMonthly).reduce((a, b) => a + b, 0).toFixed(2),
      totalAlv1Wage: Object.values(alv1WageMonthly).reduce((a, b) => a + b, 0).toFixed(2),
      totalAlv2Wage: Object.values(alv2WageMonthly).reduce((a, b) => a + b, 0).toFixed(2),
      totalNbuBasis: Object.values(nbuBasisMonthly).reduce((a, b) => a + b, 0).toFixed(2),
      totalBvg: Object.values(bvgMonthly).reduce((a, b) => a + b, 0).toFixed(2),
    };
  }

  // ============================================================================
  // DEDUCTION CALCULATION HELPER
  // ============================================================================
  private async calculateDeductionsFromItems(
    employeeId: string,
    items: InsertPayrollItemWithoutPaymentId[]
  ): Promise<InsertDeduction[]> {
    const company = await this.getCompany();
    const employee = await this.getEmployee(employeeId);
    
    if (!company || !employee) {
      return [];
    }

    const deductions: InsertDeduction[] = [];
    const payrollItemTypesData = await this.getPayrollItemTypes();

    // Helper function to calculate base amount for each deduction type
    const calculateBaseAmount = (deductionFlag: keyof Pick<typeof payrollItemTypesData[0], 'subjectToAhv' | 'subjectToAlv' | 'subjectToNbu' | 'subjectToBvg' | 'subjectToQst'>) => {
      return items.reduce((sum, item) => {
        const amount = parseFloat(item.amount) || 0;
        if (amount <= 0) return sum;
        
        // Try to find by code first, then by name (for QCS imports)
        let itemType = payrollItemTypesData.find(t => t.code === item.type);
        if (!itemType) {
          itemType = payrollItemTypesData.find(t => t.name === item.type);
        }
        
        console.log(`[calculateDeductionsFromItems] item.type=${item.type}, amount=${amount}, itemType=${JSON.stringify(itemType)}, deductionFlag=${deductionFlag}, itemType[deductionFlag]=${itemType?.[deductionFlag]}`);
        
        // If no itemType found, assume all deductions apply (for backwards compatibility with QCS imports)
        if (!itemType) {
          console.log(`[calculateDeductionsFromItems] No itemType found for ${item.type}, assuming all deductions apply`);
          return sum + amount;
        }
        
        if (!itemType[deductionFlag]) return sum;
        
        return sum + amount;
      }, 0);
    };

    // AHV - with Rentner allowance if applicable
    const ahvRate = parseFloat(company.ahvEmployeeRate) || 5.3;
    let ahvBaseAmount = calculateBaseAmount('subjectToAhv');
    
    // Apply Rentner allowance if employee is Rentner
    if (employee.isRentner && ahvBaseAmount > 0) {
      const rentnerAllowance = parseFloat(company.ahvRentnerAllowance) || 1400;
      ahvBaseAmount = Math.max(0, ahvBaseAmount - rentnerAllowance);
    }
    
    if (ahvBaseAmount > 0) {
      deductions.push({
        payrollPaymentId: "", // Dummy value, will be set when payment is created
        type: "AHV",
        description: employee.isRentner ? "AHV/IV/EO Abzug (Rentner)" : "AHV/IV/EO Abzug",
        percentage: ahvRate.toString(),
        baseAmount: ahvBaseAmount.toFixed(2),
        amount: (ahvBaseAmount * (ahvRate / 100)).toFixed(2),
        isAutoCalculated: true,
      });
    }

    // ALV (will be adjusted by applyCumulativeAlvLimit later)
    const alvRate = parseFloat(company.alvEmployeeRate) || 1.1;
    const alvBaseAmount = calculateBaseAmount('subjectToAlv');
    if (alvBaseAmount > 0) {
      deductions.push({
        payrollPaymentId: "", // Dummy value, will be set when payment is created
        type: "ALV",
        description: "ALV Abzug",
        percentage: alvRate.toString(),
        baseAmount: alvBaseAmount.toFixed(2),
        amount: (alvBaseAmount * (alvRate / 100)).toFixed(2),
        isAutoCalculated: true,
      });
    }

    // NBU/SUVA - only if employee is NBU insured (will be adjusted by applyCumulativeNbuLimit later)
    if (employee.isNbuInsured) {
      const suvaRate = parseFloat(company.suvaNbuMaleRate) || 1.168;
      const nbuBaseAmount = calculateBaseAmount('subjectToNbu');
      if (nbuBaseAmount > 0) {
        deductions.push({
          payrollPaymentId: "", // Dummy value, will be set when payment is created
          type: "NBU",
          description: "NBU/SUVA Abzug",
          percentage: suvaRate.toString(),
          baseAmount: nbuBaseAmount.toFixed(2),
          amount: (nbuBaseAmount * (suvaRate / 100)).toFixed(2),
          isAutoCalculated: true,
        });
      }
    }

    // BVG
    const bvgDeductionPercentage = parseFloat(employee.bvgDeductionPercentage || "0");
    const bvgDeductionAmount = parseFloat(employee.bvgDeductionAmount || "0");
    const bvgBaseAmount = calculateBaseAmount('subjectToBvg');
    
    // Only add BVG if there's a percentage > 0 OR an amount > 0
    if (bvgBaseAmount > 0 && (bvgDeductionPercentage > 0 || bvgDeductionAmount > 0)) {
      let bvgAmount: number;
      let bvgPercentage: string | null = null;
      
      if (bvgDeductionAmount > 0) {
        // Fixed amount
        bvgAmount = bvgDeductionAmount;
      } else {
        // Percentage-based
        bvgPercentage = bvgDeductionPercentage.toString();
        bvgAmount = bvgBaseAmount * (bvgDeductionPercentage / 100);
      }
      
      deductions.push({
        payrollPaymentId: "", // Dummy value, will be set when payment is created
        type: "BVG",
        description: "BVG Abzug",
        percentage: bvgPercentage,
        baseAmount: bvgBaseAmount.toFixed(2),
        amount: bvgAmount.toFixed(2),
        isAutoCalculated: true,
      });
    }

    // KTG GAV - only if employee has KTG GAV flag
    if (employee.hasKtgGav) {
      const ktgGavRate = parseFloat(company.ktgGavRate) || 1.515;
      const ktgGavBaseAmount = calculateBaseAmount('subjectToAhv'); // Use same base as AHV
      if (ktgGavBaseAmount > 0) {
        deductions.push({
          payrollPaymentId: "", // Dummy value, will be set when payment is created
          type: "KTG GAV",
          description: "KTG GAV Personalverleih",
          percentage: ktgGavRate.toString(),
          baseAmount: ktgGavBaseAmount.toFixed(2),
          amount: (ktgGavBaseAmount * (ktgGavRate / 100)).toFixed(2),
          isAutoCalculated: true,
        });
      }
    }

    // Berufsbeitrag GAV - only if employee has Berufsbeitrag GAV flag
    if (employee.hasBerufsbeitragGav) {
      const berufsbeitragGavRate = parseFloat(company.berufsbeitragGavRate) || 0.4;
      const berufsbeitragGavBaseAmount = calculateBaseAmount('subjectToAhv'); // Use same base as AHV
      if (berufsbeitragGavBaseAmount > 0) {
        deductions.push({
          payrollPaymentId: "", // Dummy value, will be set when payment is created
          type: "Berufsbeitrag GAV",
          description: "Berufsbeitrag GAV Personalverleih",
          percentage: berufsbeitragGavRate.toString(),
          baseAmount: berufsbeitragGavBaseAmount.toFixed(2),
          amount: (berufsbeitragGavBaseAmount * (berufsbeitragGavRate / 100)).toFixed(2),
          isAutoCalculated: true,
        });
      }
    }

    // QST - only if employee is subject to Quellensteuer
    // NOTE: isQstSubject and qstRate are not yet implemented in Employee schema
    // if (employee.isQstSubject) {
    //   const qstRate = parseFloat(employee.qstRate || "0");
    //   const qstBaseAmount = calculateBaseAmount('subjectToQst');
    //   if (qstBaseAmount > 0 && qstRate > 0) {
    //     deductions.push({
    //       payrollPaymentId: "", // Dummy value, will be set when payment is created
    //       type: "QST",
    //       description: "Quellensteuer Abzug",
    //       percentage: qstRate.toString(),
    //       baseAmount: qstBaseAmount.toFixed(2),
    //       amount: (qstBaseAmount * (qstRate / 100)).toFixed(2),
    //       isAutoCalculated: true,
    //     });
    //   }
    // }

    return deductions;
  }

  // ============================================================================
  // CUMULATIVE ALV CALCULATION HELPER
  // ============================================================================
  private async applyCumulativeAlvLimit(
    employeeId: string,
    year: number,
    paymentMonth: number,
    items: InsertPayrollItemWithoutPaymentId[],
    deductionsList: InsertDeduction[],
    periodEnd?: string, // Format: "YYYY-MM-DD" - used for prorated calculation
    excludePaymentId?: string
  ): Promise<InsertDeduction[]> {
    // Get company for ALV settings
    const company = await this.getCompany();
    if (!company) {
      return deductionsList; // No company, return unchanged
    }

    // Find ALV deduction
    const alvIndex = deductionsList.findIndex(d => d.type === 'ALV');
    if (alvIndex === -1) {
      return deductionsList; // No ALV deduction, return unchanged
    }

    // Get payroll item types for calculating ALV-subject amounts
    const payrollItemTypesData = await this.getPayrollItemTypes();

    // Calculate current ALV-subject amount from items
    let currentAlvSubjectAmount = 0;
    for (const item of items) {
      // Try to find by code first, then by name (for QCS imports)
      let itemType = payrollItemTypesData.find(t => t.code === item.type);
      if (!itemType) {
        itemType = payrollItemTypesData.find(t => t.name === item.type);
      }
      
      // If no itemType found, assume all deductions apply (for backwards compatibility)
      if (!itemType || itemType.subjectToAlv) {
        currentAlvSubjectAmount += parseFloat(item.amount);
      }
    }

    // Get cumulative ALV data (excluding current payment if editing)
    // IMPORTANT: Only consider payments BEFORE the current month
    const cumulativeData = await this.getCumulativeAlvData(employeeId, year, excludePaymentId, paymentMonth - 1);
    const previousAlvBaseUsed = parseFloat(cumulativeData.cumulativeAlvBaseUsed);
    const previousAlvSubjectAmount = parseFloat(cumulativeData.cumulativeAlvSubjectAmount);

    // Get ALV Höchstlohn settings
    const alvMaxIncomePerYear = parseFloat(company.alvMaxIncomePerYear) || 148200;
    const monthlyMaxIncome = alvMaxIncomePerYear / 12; // CHF 12'350 per month

    // Calculate prorated monthly max if periodEnd is provided and is partial month
    let currentMonthMaxIncome = monthlyMaxIncome;
    if (periodEnd) {
      const periodEndDate = new Date(periodEnd);
      const dayOfMonth = periodEndDate.getDate();
      const daysInMonth = new Date(year, paymentMonth, 0).getDate(); // Get days in month
      
      // Only prorate if periodEnd is not the last day of the month
      if (dayOfMonth < daysInMonth) {
        currentMonthMaxIncome = (monthlyMaxIncome / daysInMonth) * dayOfMonth;
        console.log(`[applyCumulativeAlvLimit] Prorated max for ${periodEnd}: ${currentMonthMaxIncome.toFixed(2)} (${dayOfMonth}/${daysInMonth} days)`);
      }
    }

    // Calculate cumulative "Soll-Höchstlohn" based on payment month (before current month)
    const sollHoechstlohn = monthlyMaxIncome * (paymentMonth - 1);
    
    // NEW RULE: 
    // If cumulative GROSS WAGE < cumulative max: Use actual wage (but capped at monthly max)
    // If cumulative GROSS WAGE >= cumulative max: Use monthly max (prorated if partial month)
    let alvBaseAmount: number;
    if (previousAlvSubjectAmount < sollHoechstlohn) {
      // Case 1: Still under cumulative limit → use actual wage, but cap at monthly max (prorated if needed)
      alvBaseAmount = Math.min(currentAlvSubjectAmount, currentMonthMaxIncome);
    } else {
      // Case 2: Already at or over cumulative limit → use monthly max (potentially prorated)
      // IMPORTANT: Use max even if it exceeds actual wage - this is correct per Swiss DATA WIN standards
      alvBaseAmount = currentMonthMaxIncome;
    }

    // Calculate ALV amount
    const alvRate = parseFloat(company.alvEmployeeRate) || 1.1;
    const alvAmount = (alvBaseAmount * (alvRate / 100)).toFixed(2);

    // Create adjusted deductions list
    const adjustedDeductions = [...deductionsList];
    adjustedDeductions[alvIndex] = {
      ...deductionsList[alvIndex],
      baseAmount: alvBaseAmount.toFixed(2),
      amount: alvAmount,
    };

    return adjustedDeductions;
  }

  // ============================================================================
  // CUMULATIVE NBU CALCULATION HELPER
  // ============================================================================
  private async applyCumulativeNbuLimit(
    employeeId: string,
    year: number,
    paymentMonth: number,
    items: InsertPayrollItemWithoutPaymentId[],
    deductionsList: InsertDeduction[],
    periodEnd?: string, // Format: "YYYY-MM-DD" - used for prorated calculation
    excludePaymentId?: string
  ): Promise<InsertDeduction[]> {
    // Get company for NBU settings
    const company = await this.getCompany();
    if (!company) {
      return deductionsList; // No company, return unchanged
    }

    // Find NBU deduction
    const nbuIndex = deductionsList.findIndex(d => d.type === 'NBU');
    if (nbuIndex === -1) {
      return deductionsList; // No NBU deduction, return unchanged
    }

    // Get payroll item types for calculating NBU-subject amounts
    const payrollItemTypesData = await this.getPayrollItemTypes();

    // Calculate current NBU-subject amount from items
    let currentNbuSubjectAmount = 0;
    for (const item of items) {
      // Try to find by code first, then by name (for QCS imports)
      let itemType = payrollItemTypesData.find(t => t.code === item.type);
      if (!itemType) {
        itemType = payrollItemTypesData.find(t => t.name === item.type);
      }
      
      // If no itemType found, assume all deductions apply (for backwards compatibility)
      if (!itemType || itemType.subjectToNbu) {
        currentNbuSubjectAmount += parseFloat(item.amount);
      }
    }

    // Get cumulative NBU data (excluding current payment if editing)
    // IMPORTANT: Only consider payments BEFORE the current month
    const cumulativeData = await this.getCumulativeNbuData(employeeId, year, excludePaymentId, paymentMonth - 1);
    const previousNbuBaseUsed = parseFloat(cumulativeData.cumulativeNbuBaseUsed);
    const previousNbuSubjectAmount = parseFloat(cumulativeData.cumulativeNbuSubjectAmount);

    // Get NBU Höchstlohn settings
    const nbuMaxIncomePerYear = parseFloat(company.suvaMaxIncomePerYear) || 148200;
    const monthlyMaxIncome = nbuMaxIncomePerYear / 12; // CHF 12'350 per month

    // Calculate prorated monthly max if periodEnd is provided and is partial month
    let currentMonthMaxIncome = monthlyMaxIncome;
    if (periodEnd) {
      const periodEndDate = new Date(periodEnd);
      const dayOfMonth = periodEndDate.getDate();
      const daysInMonth = new Date(year, paymentMonth, 0).getDate(); // Get days in month
      
      // Only prorate if periodEnd is not the last day of the month
      if (dayOfMonth < daysInMonth) {
        currentMonthMaxIncome = (monthlyMaxIncome / daysInMonth) * dayOfMonth;
        console.log(`[applyCumulativeNbuLimit] Prorated max for ${periodEnd}: ${currentMonthMaxIncome.toFixed(2)} (${dayOfMonth}/${daysInMonth} days)`);
      }
    }

    // Calculate cumulative "Soll-Höchstlohn" based on payment month (before current month)
    const sollHoechstlohn = monthlyMaxIncome * (paymentMonth - 1);
    
    // NEW RULE (same as ALV): 
    // If cumulative GROSS WAGE < cumulative max: Use actual wage (but capped at monthly max)
    // If cumulative GROSS WAGE >= cumulative max: Use monthly max (prorated if partial month)
    let nbuBaseAmount: number;
    if (previousNbuSubjectAmount < sollHoechstlohn) {
      // Case 1: Still under cumulative limit → use actual wage, but cap at monthly max (prorated if needed)
      nbuBaseAmount = Math.min(currentNbuSubjectAmount, currentMonthMaxIncome);
    } else {
      // Case 2: Already at or over cumulative limit → use monthly max (potentially prorated)
      // IMPORTANT: Use max even if it exceeds actual wage - this is correct per Swiss DATA WIN standards
      nbuBaseAmount = currentMonthMaxIncome;
    }

    // Calculate NBU amount
    const nbuRate = parseFloat(company.suvaNbuMaleRate) || 1.168;
    const nbuAmount = (nbuBaseAmount * (nbuRate / 100)).toFixed(2);

    // Create adjusted deductions list
    const adjustedDeductions = [...deductionsList];
    adjustedDeductions[nbuIndex] = {
      ...deductionsList[nbuIndex],
      baseAmount: nbuBaseAmount.toFixed(2),
      amount: nbuAmount,
    };

    return adjustedDeductions;
  }

  // ============================================================================
  // CUMULATIVE ALV CALCULATION API
  // ============================================================================
  async getCumulativeAlvData(employeeId: string, year: number, excludePaymentId?: string, beforeMonth?: number): Promise<any> {
    // Get all payroll payments for this employee in this year
    // If beforeMonth is specified: include payments with month <= beforeMonth (except excluded)
    // NOTE: Caller should pass (currentMonth - 1) to get data BEFORE current month
    const conditions = [
      eq(payrollPayments.employeeId, employeeId),
      eq(payrollPayments.paymentYear, year)
    ];
    
    // Add month filter if specified
    // Include: (month < beforeMonth) OR (month = beforeMonth AND id != excludePaymentId)
    if (beforeMonth !== undefined) {
      conditions.push(sql`${payrollPayments.paymentMonth} <= ${beforeMonth}`);
    }
    
    let paymentsQuery = db
      .select()
      .from(payrollPayments)
      .where(and(...conditions))
      .orderBy(payrollPayments.paymentMonth, payrollPayments.periodEnd);

    const payments = await paymentsQuery;

    // Filter out excluded payment if specified
    // This handles both: editing a payment (exclude it) and multiple payments in same month
    const filteredPayments = excludePaymentId
      ? payments.filter(p => p.id !== excludePaymentId)
      : payments;

    // Load payroll items and item types for ALV calculation
    const payrollItemTypesData = await this.getPayrollItemTypes();

    let cumulativeAlvSubjectAmount = 0;
    let cumulativeAlvBaseUsed = 0; // Track the actual base used for ALV calculation
    let cumulativeAlvDeductionAmount = 0;

    // Calculate cumulative ALV-subject income from all payments
    for (const payment of filteredPayments) {
      const items = await db
        .select()
        .from(payrollItems)
        .where(eq(payrollItems.payrollPaymentId, payment.id));

      // Sum up ALV-subject amounts
      for (const item of items) {
        const itemType = payrollItemTypesData.find(t => t.code === item.type);
        if (itemType && itemType.subjectToAlv) {
          cumulativeAlvSubjectAmount += parseFloat(item.amount);
        }
      }

      // Sum up ALV deductions already paid (and their base amounts)
      const alvDeductions = await db
        .select()
        .from(deductions)
        .where(
          and(
            eq(deductions.payrollPaymentId, payment.id),
            eq(deductions.type, 'ALV')
          )
        );

      for (const deduction of alvDeductions) {
        cumulativeAlvDeductionAmount += parseFloat(deduction.amount);
        // Use baseAmount if available, otherwise fall back to calculating from amount
        if (deduction.baseAmount) {
          cumulativeAlvBaseUsed += parseFloat(deduction.baseAmount);
        } else {
          // Fallback: calculate from amount (reverse calculation)
          const alvRate = deduction.percentage ? parseFloat(deduction.percentage) : 1.1;
          cumulativeAlvBaseUsed += parseFloat(deduction.amount) / (alvRate / 100);
        }
      }
    }

    return {
      employeeId,
      year,
      cumulativeAlvSubjectAmount: cumulativeAlvSubjectAmount.toFixed(2),
      cumulativeAlvBaseUsed: cumulativeAlvBaseUsed.toFixed(2), // New field for tracking base used
      cumulativeAlvDeductionAmount: cumulativeAlvDeductionAmount.toFixed(2),
      paymentsCount: filteredPayments.length,
    };
  }

  // ============================================================================
  // CUMULATIVE NBU CALCULATION API
  // ============================================================================
  async getCumulativeNbuData(employeeId: string, year: number, excludePaymentId?: string, beforeMonth?: number): Promise<any> {
    // Get all payroll payments for this employee in this year
    // If beforeMonth is specified: include payments with month <= beforeMonth (except excluded)
    // NOTE: Caller should pass (currentMonth - 1) to get data BEFORE current month
    const conditions = [
      eq(payrollPayments.employeeId, employeeId),
      eq(payrollPayments.paymentYear, year)
    ];
    
    // Add month filter if specified
    if (beforeMonth !== undefined) {
      conditions.push(sql`${payrollPayments.paymentMonth} <= ${beforeMonth}`);
    }
    
    let paymentsQuery = db
      .select()
      .from(payrollPayments)
      .where(and(...conditions))
      .orderBy(payrollPayments.paymentMonth, payrollPayments.periodEnd);

    const payments = await paymentsQuery;

    // Filter out excluded payment if specified
    const filteredPayments = excludePaymentId
      ? payments.filter(p => p.id !== excludePaymentId)
      : payments;

    // Load payroll items and item types for NBU calculation
    const payrollItemTypesData = await this.getPayrollItemTypes();

    let cumulativeNbuSubjectAmount = 0;
    let cumulativeNbuBaseUsed = 0; // Track the actual base used for NBU calculation
    let cumulativeNbuDeductionAmount = 0;

    // Calculate cumulative NBU-subject income from all payments
    for (const payment of filteredPayments) {
      const items = await db
        .select()
        .from(payrollItems)
        .where(eq(payrollItems.payrollPaymentId, payment.id));

      // Sum up NBU-subject amounts
      for (const item of items) {
        const itemType = payrollItemTypesData.find(t => t.code === item.type);
        if (itemType && itemType.subjectToNbu) {
          cumulativeNbuSubjectAmount += parseFloat(item.amount);
        }
      }

      // Sum up NBU deductions already paid (and their base amounts)
      const nbuDeductions = await db
        .select()
        .from(deductions)
        .where(
          and(
            eq(deductions.payrollPaymentId, payment.id),
            eq(deductions.type, 'NBU')
          )
        );

      for (const deduction of nbuDeductions) {
        cumulativeNbuDeductionAmount += parseFloat(deduction.amount);
        // Use baseAmount if available, otherwise fall back to calculating from amount
        if (deduction.baseAmount) {
          cumulativeNbuBaseUsed += parseFloat(deduction.baseAmount);
        } else {
          // Fallback: calculate from amount (reverse calculation)
          const nbuRate = deduction.percentage ? parseFloat(deduction.percentage) : 1.168;
          cumulativeNbuBaseUsed += parseFloat(deduction.amount) / (nbuRate / 100);
        }
      }
    }

    return {
      employeeId,
      year,
      cumulativeNbuSubjectAmount: cumulativeNbuSubjectAmount.toFixed(2),
      cumulativeNbuBaseUsed: cumulativeNbuBaseUsed.toFixed(2), // Track base used
      cumulativeNbuDeductionAmount: cumulativeNbuDeductionAmount.toFixed(2),
      paymentsCount: filteredPayments.length,
    };
  }

  // ============================================================================
  // PREVIEW DEDUCTIONS
  // ============================================================================
  async previewDeductions(
    employeeId: string,
    paymentMonth: number,
    paymentYear: number,
    payrollItems: any[],
    periodEnd?: string // Format: "YYYY-MM-DD" - used for prorated calculation
  ): Promise<InsertDeduction[]> {
    // Convert payroll items to InsertPayrollItem format
    const items: InsertPayrollItem[] = payrollItems.map(item => ({
      payrollPaymentId: "", // Dummy value for preview
      type: item.type,
      description: item.description,
      amount: item.amount,
      hours: item.hours,
      hourlyRate: item.hourlyRate,
    }));

    // Calculate deductions from items
    let deductions = await this.calculateDeductionsFromItems(employeeId, items);

    // Apply cumulative ALV limit
    deductions = await this.applyCumulativeAlvLimit(
      employeeId,
      paymentYear,
      paymentMonth,
      items,
      deductions,
      periodEnd // for prorated calculation
    );

    // Apply cumulative NBU limit
    deductions = await this.applyCumulativeNbuLimit(
      employeeId,
      paymentYear,
      paymentMonth,
      items,
      deductions,
      periodEnd // for prorated calculation
    );

    return deductions;
  }
}

export const storage = new DatabaseStorage();

// Helper function to create storage instance based on request context
export function createStorage(dbConnection?: DbConnection): DatabaseStorage {
  return new DatabaseStorage(dbConnection);
}
