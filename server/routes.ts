import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertEmployeeSchema, insertPayrollPaymentSchema, insertPayrollItemSchema, insertDeductionSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================================
  // DASHBOARD
  // ============================================================================
  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // COMPANY
  // ============================================================================
  app.get("/api/company", async (_req, res) => {
    try {
      const company = await storage.getCompany();
      // Return null if no company exists (not 404) so frontend can handle it gracefully
      res.json(company || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/company", async (req, res) => {
    try {
      const result = insertCompanySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: fromError(result.error).toString(),
        });
      }
      const company = await storage.createCompany(result.data);
      res.status(201).json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/company", async (req, res) => {
    try {
      const result = insertCompanySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: fromError(result.error).toString(),
        });
      }
      const company = await storage.updateCompany(result.data);
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // EMPLOYEES
  // ============================================================================
  app.get("/api/employees", async (_req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const result = insertEmployeeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: fromError(result.error).toString(),
        });
      }
      const employee = await storage.createEmployee(result.data);
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const result = insertEmployeeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: fromError(result.error).toString(),
        });
      }
      const employee = await storage.updateEmployee(req.params.id, result.data);
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      await storage.deleteEmployee(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // PAYROLL PAYMENTS
  // ============================================================================
  app.get("/api/payroll/payments", async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const payments = await storage.getPayrollPayments(year, month);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/payroll/payments/:id", async (req, res) => {
    try {
      const payment = await storage.getPayrollPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/payments", async (req, res) => {
    try {
      const { payrollItems, deductions, ...paymentData } = req.body;

      // Validate payment data
      const paymentResult = insertPayrollPaymentSchema.safeParse(paymentData);
      if (!paymentResult.success) {
        return res.status(400).json({
          error: "Invalid payment data: " + fromError(paymentResult.error).toString(),
        });
      }

      // Validate payroll items
      const itemsResults = (payrollItems || []).map((item: any) =>
        insertPayrollItemSchema.safeParse(item)
      );
      const itemErrors = itemsResults.filter((r) => !r.success);
      if (itemErrors.length > 0) {
        return res.status(400).json({
          error: "Invalid payroll items: " + fromError(itemErrors[0].error).toString(),
        });
      }

      // Validate deductions
      const deductionResults = (deductions || []).map((d: any) =>
        insertDeductionSchema.safeParse(d)
      );
      const deductionErrors = deductionResults.filter((r) => !r.success);
      if (deductionErrors.length > 0) {
        return res.status(400).json({
          error: "Invalid deductions: " + fromError(deductionErrors[0].error).toString(),
        });
      }

      const payment = await storage.createPayrollPayment(
        paymentResult.data,
        itemsResults.map((r) => r.data!),
        deductionResults.map((r) => r.data!)
      );

      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // REPORTS
  // ============================================================================
  app.get("/api/reports/monthly", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string);

      if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }

      const report = await storage.getMonthlyReport(year, month);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/yearly", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);

      if (!year) {
        return res.status(400).json({ error: "Invalid year" });
      }

      const report = await storage.getYearlyReport(year);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
