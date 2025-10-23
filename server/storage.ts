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
  updatePayrollPayment(
    id: string,
    payment: Partial<InsertPayrollPayment>,
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
  
  // Cumulative ALV calculation
  getCumulativeAlvData(employeeId: string, year: number, excludePaymentId?: string): Promise<any>;
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
          ahvNumber: employees.ahvNumber,
          email: employees.email,
          address: employees.address,
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

  async updatePayrollPayment(
    id: string,
    payment: Partial<InsertPayrollPayment>,
    items: InsertPayrollItem[],
    deductionsList: InsertDeduction[]
  ): Promise<PayrollPayment> {
    // Check if payment is locked
    const [existingPayment] = await db
      .select({ isLocked: payrollPayments.isLocked })
      .from(payrollPayments)
      .where(eq(payrollPayments.id, id));
    
    if (existingPayment?.isLocked) {
      throw new Error("Abgeschlossene Lohnauszahlungen können nicht bearbeitet werden");
    }

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
    await db.delete(payrollItems).where(eq(payrollItems.payrollPaymentId, id));
    await db.delete(deductions).where(eq(deductions.payrollPaymentId, id));

    // Insert new payroll items
    if (items.length > 0) {
      await db.insert(payrollItems).values(
        items.map((item) => ({
          ...item,
          payrollPaymentId: id,
        }))
      );
    }

    // Insert new deductions
    if (deductionsList.length > 0) {
      await db.insert(deductions).values(
        deductionsList.map((d) => ({
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
    const allPayrollItemTypes = await db.select().from(payrollItemTypes);
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

    // Calculate basis amounts (sum of gross salaries, as simple approximation for now)
    // In a more complex system, this would check which items are subject to each deduction
    let ahvBasis = totalGross;
    let alvBasis = totalGross;
    let nbuBasis = totalGross;
    let bvgBasis = totalGross;

    // Get employee summary
    const employeeMap = new Map<string, any>();
    
    for (const payment of allPayments) {
      const employee = await db.select().from(employees).where(eq(employees.id, payment.employeeId)).limit(1);
      if (employee.length === 0) continue;

      const emp = employee[0];
      const empId = emp.id;

      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          ahvNumber: emp.ahvNumber,
          birthDate: emp.birthDate,
          firstName: emp.firstName,
          lastName: emp.lastName,
          employedFrom: null,
          employedTo: null,
          ahvWage: 0,
          alvWage: 0,
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
    }

    // Convert to array and apply ALV limit
    const employeeSummary = Array.from(employeeMap.values()).map(emp => ({
      ...emp,
      alvWage: Math.min(emp.alvWage, alvMaxIncome),
      ahvWage: emp.ahvWage.toFixed(2),
      alvWageRaw: emp.alvWage,
    })).map(emp => ({
      ...emp,
      alvWage: emp.alvWage.toFixed(2),
    }));

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
      totals: {
        grossSalary: totalGross.toFixed(2),
        deductions: totalDeductions.toFixed(2),
        netSalary: totalNet.toFixed(2),
        paymentsCount: allPayments.length,
      },
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
    const allPayrollItemTypes = await db.select().from(payrollItemTypes);
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

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        ahvNumber: employee.ahvNumber,
        entryDate: employee.entryDate,
        exitDate: employee.exitDate,
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
    };
  }

  // ============================================================================
  // CUMULATIVE ALV CALCULATION
  // ============================================================================
  async getCumulativeAlvData(employeeId: string, year: number, excludePaymentId?: string): Promise<any> {
    // Get all payroll payments for this employee in this year (excluding the specified payment if provided)
    let paymentsQuery = db
      .select()
      .from(payrollPayments)
      .where(
        and(
          eq(payrollPayments.employeeId, employeeId),
          eq(payrollPayments.paymentYear, year)
        )
      )
      .orderBy(payrollPayments.paymentMonth, payrollPayments.periodEnd);

    const payments = await paymentsQuery;

    // Filter out excluded payment if specified
    const filteredPayments = excludePaymentId
      ? payments.filter(p => p.id !== excludePaymentId)
      : payments;

    // Load payroll items and item types for ALV calculation
    const payrollItemTypesData = await this.getPayrollItemTypes();

    let cumulativeAlvSubjectAmount = 0;
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

      // Sum up ALV deductions already paid
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
      }
    }

    return {
      employeeId,
      year,
      cumulativeAlvSubjectAmount: cumulativeAlvSubjectAmount.toFixed(2),
      cumulativeAlvDeductionAmount: cumulativeAlvDeductionAmount.toFixed(2),
      paymentsCount: filteredPayments.length,
    };
  }
}

export const storage = new DatabaseStorage();
