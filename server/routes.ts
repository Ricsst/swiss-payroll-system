import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertEmployeeSchema, insertPayrollPaymentSchema, insertPayrollItemSchema, insertPayrollItemTypeSchema, insertDeductionSchema, insertPayrollTemplateSchema, insertPayrollItemWithoutPaymentIdSchema, insertDeductionWithoutPaymentIdSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { PDFGenerator, formatCurrency, formatCurrencyNumber, formatDate, formatPercentage, formatAddress, formatAddressMultiline } from "./utils/pdf-generator";
import { ExcelGenerator, formatExcelCurrency, formatExcelDate } from "./utils/excel-generator";
import { fillLohnausweisForm, inspectFormFields, type LohnausweisData } from "./utils/fill-lohnausweis-form";
import { sendPayslipEmail } from "./services/email";
import { sendPayslipEmailViaOutlook, sendLohnausweisEmailViaOutlook } from "./services/email-outlook";
import multer from "multer";
import { parseQCSPayrollPDF, getMonthNumber, type QCSPayrollData } from "./services/qcs-pdf-parser";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================================
  // AUTHENTICATION (Password Protection)
  // ============================================================================
  
  // Check authentication status
  app.get("/api/auth/status", (req, res) => {
    res.json({ 
      isAuthenticated: !!req.session.isAuthenticated 
    });
  });

  // Login with password
  app.post("/api/auth/login", (req, res) => {
    const { password } = req.body;
    const appPassword = process.env.APP_PASSWORD || "admin123"; // Default password for development
    
    if (password === appPassword) {
      req.session.isAuthenticated = true;
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        res.json({ success: true });
      });
    } else {
      res.status(401).json({ error: "Falsches Passwort" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.isAuthenticated = false;
    req.session.companyKey = undefined;
    res.clearCookie('companyKey');
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.json({ success: true });
    });
  });

  // ============================================================================
  // TENANT SELECTION (Multi-Company Support)
  // ============================================================================
  
  // Get current selected company
  app.get("/api/tenant/current", (req, res) => {
    // Try custom header first (for Replit iframe), then cookie, then session
    const companyKey = req.headers['x-company-key'] as string || req.cookies?.companyKey || req.session.companyKey || null;
    
    // Prevent caching to ensure fresh data after tenant selection
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json({ 
      companyKey,
      isSelected: !!companyKey 
    });
  });

  // Get available companies
  app.get("/api/tenant/companies", (_req, res) => {
    const companies = [
      { key: 'firma-a', name: 'Firma A', hasDatabase: !!process.env.DATABASE_URL_FIRMA_A || !!process.env.DATABASE_URL },
      { key: 'firma-b', name: 'Firma B', hasDatabase: !!process.env.DATABASE_URL_FIRMA_B },
      { key: 'firma-c', name: 'Firma C', hasDatabase: !!process.env.DATABASE_URL_FIRMA_C },
    ];
    res.json(companies);
  });

  // Select a company
  app.post("/api/tenant", (req, res) => {
    const { companyKey } = req.body;
    
    if (!companyKey || !['firma-a', 'firma-b', 'firma-c'].includes(companyKey)) {
      return res.status(400).json({ error: "Invalid company key" });
    }

    // Store in both cookie (primary) and session (backup)
    res.cookie('companyKey', companyKey, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    
    req.session.companyKey = companyKey;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
      res.json({ success: true, companyKey });
    });
  });

  // Clear company selection (logout)
  app.post("/api/tenant/logout", (req, res) => {
    // Clear both cookie and session
    res.clearCookie('companyKey');
    req.session.companyKey = undefined;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error during logout:', err);
      }
      res.json({ success: true });
    });
  });

  // ============================================================================
  // DASHBOARD
  // ============================================================================
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await req.storage.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // COMPANY
  // ============================================================================
  app.get("/api/company", async (req, res) => {
    try {
      const company = await req.storage.getCompany();
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
      const company = await req.storage.createCompany(result.data);
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
      const company = await req.storage.updateCompany(result.data);
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // EMPLOYEES
  // ============================================================================
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await req.storage.getEmployees();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await req.storage.getEmployee(req.params.id);
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
      const employee = await req.storage.createEmployee(result.data);
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      // Allow partial updates
      const partialSchema = insertEmployeeSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: fromError(result.error).toString(),
        });
      }
      const employee = await req.storage.updateEmployee(req.params.id, result.data);
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      await req.storage.deleteEmployee(req.params.id);
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
      const payments = await req.storage.getPayrollPayments(year, month);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get cumulative ALV data for an employee in a year (for ALV Höchstlohn calculation)
  app.get("/api/payroll/cumulative-alv", async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const excludePaymentId = req.query.excludePaymentId as string | undefined;

      if (!employeeId || !year) {
        return res.status(400).json({ error: "employeeId and year are required" });
      }

      const data = await req.storage.getCumulativeAlvData(employeeId, year, excludePaymentId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get cumulative NBU data for an employee in a year (for NBU Höchstlohn calculation)
  app.get("/api/payroll/cumulative-nbu", async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const excludePaymentId = req.query.excludePaymentId as string | undefined;

      if (!employeeId || !year) {
        return res.status(400).json({ error: "employeeId and year are required" });
      }

      const data = await req.storage.getCumulativeNbuData(employeeId, year, excludePaymentId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/payroll/payments/:id", async (req, res) => {
    try {
      const payment = await req.storage.getPayrollPayment(req.params.id);
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

      // Validate payroll items (without payrollPaymentId as it will be set by storage)
      const itemsResults = (payrollItems || []).map((item: any) =>
        insertPayrollItemWithoutPaymentIdSchema.safeParse(item)
      );
      const itemErrors = itemsResults.filter((r: any) => !r.success);
      if (itemErrors.length > 0) {
        return res.status(400).json({
          error: "Invalid payroll items: " + fromError(itemErrors[0].error).toString(),
        });
      }

      // Validate deductions (without payrollPaymentId as it will be set by storage)
      const deductionResults = (deductions || []).map((d: any) =>
        insertDeductionWithoutPaymentIdSchema.safeParse(d)
      );
      const deductionErrors = deductionResults.filter((r: any) => !r.success);
      if (deductionErrors.length > 0) {
        return res.status(400).json({
          error: "Invalid deductions: " + fromError(deductionErrors[0].error).toString(),
        });
      }

      const payment = await req.storage.createPayrollPayment(
        paymentResult.data,
        itemsResults.map((r: any) => r.data!),
        deductionResults.map((r: any) => r.data!)
      );

      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/preview-deductions", async (req, res) => {
    try {
      const { employeeId, paymentMonth, paymentYear, payrollItems, periodEnd } = req.body;

      if (!employeeId || !paymentMonth || !paymentYear || !payrollItems) {
        return res.status(400).json({ 
          error: "employeeId, paymentMonth, paymentYear, and payrollItems are required" 
        });
      }

      const deductions = await req.storage.previewDeductions(
        employeeId,
        paymentMonth,
        paymentYear,
        payrollItems,
        periodEnd // optional: for prorated calculation if partial month
      );

      res.json(deductions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/payments/:id/lock", async (req, res) => {
    try {
      const payment = await req.storage.lockPayrollPayment(req.params.id);
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/payments/:id/unlock", async (req, res) => {
    try {
      const payment = await req.storage.unlockPayrollPayment(req.params.id);
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/payroll/payments/:id", async (req, res) => {
    try {
      const { items, deductions, ...paymentData } = req.body;

      // Validate payment data (partial update)
      const paymentResult = insertPayrollPaymentSchema.partial().safeParse(paymentData);
      if (!paymentResult.success) {
        return res.status(400).json({
          error: "Invalid payment data: " + fromError(paymentResult.error).toString(),
        });
      }

      // Validate payroll items (without payrollPaymentId as it will be set by storage)
      const itemsResults = (items || []).map((item: any) =>
        insertPayrollItemWithoutPaymentIdSchema.safeParse(item)
      );
      const itemErrors = itemsResults.filter((r: any) => !r.success);
      if (itemErrors.length > 0) {
        return res.status(400).json({
          error: "Invalid payroll items: " + fromError(itemErrors[0].error).toString(),
        });
      }

      // Validate deductions (without payrollPaymentId as it will be set by storage)
      const deductionResults = (deductions || []).map((d: any) =>
        insertDeductionWithoutPaymentIdSchema.safeParse(d)
      );
      const deductionErrors = deductionResults.filter((r: any) => !r.success);
      if (deductionErrors.length > 0) {
        return res.status(400).json({
          error: "Invalid deductions: " + fromError(deductionErrors[0].error).toString(),
        });
      }

      const payment = await req.storage.updatePayrollPayment(
        req.params.id,
        paymentResult.data,
        itemsResults.map((r: any) => r.data!),
        deductionResults.map((r: any) => r.data!)
      );

      res.json(payment);
    } catch (error: any) {
      if (error.message.includes("Abgeschlossene")) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.delete("/api/payroll/payments/:id", async (req, res) => {
    try {
      await req.storage.deletePayrollPayment(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.includes("Abgeschlossene")) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Send Lohnausweise via email
  app.post("/api/lohnausweise/send-emails", async (req, res) => {
    try {
      const { employeeIds, year } = req.body;
      console.log('[Send Lohnausweise] Received request with employeeIds:', employeeIds, 'year:', year);

      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ error: "employeeIds array is required" });
      }

      if (!year) {
        return res.status(400).json({ error: "year is required" });
      }

      const yearNum = typeof year === 'string' ? parseInt(year) : year;

      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      if (company.payrollSenderEmail) {
        console.log('[Send Lohnausweise] Using configured sender email:', company.payrollSenderEmail);
        console.log('[Send Lohnausweise] Note: Outlook integration will send from the connected account');
      }

      const results = [];
      const payments = await req.storage.getPayrollPayments(yearNum);

      for (const employeeId of employeeIds) {
        try {
          console.log('[Send Lohnausweise] Processing employee:', employeeId);
          
          const employee = await req.storage.getEmployee(employeeId);
          if (!employee) {
            console.log('[Send Lohnausweise] Employee not found:', employeeId);
            results.push({ employeeId, success: false, error: "Employee not found" });
            continue;
          }

          console.log('[Send Lohnausweise] Employee:', employee.firstName, employee.lastName, 'Email:', employee.email);

          if (!employee.email) {
            console.log('[Send Lohnausweise] Employee has no email:', employee.firstName, employee.lastName);
            results.push({ 
              employeeId, 
              success: false, 
              error: `Employee ${employee.firstName} ${employee.lastName} has no email address` 
            });
            continue;
          }

          const employeePayments = payments.filter((p: any) => p.employee.id === employeeId);

          // Calculate totals
          let totalGross = 0;
          let totalAHV = 0;
          let totalALV = 0;
          let totalSUVA = 0;
          let totalBVG = 0;
          let totalTax = 0;
          let totalOther = 0;

          for (const payment of employeePayments) {
            totalGross += Number(payment.grossSalary);
            
            const fullPayment = await req.storage.getPayrollPayment(payment.id);
            if (fullPayment && fullPayment.deductions) {
              fullPayment.deductions.forEach((d: any) => {
                const amount = Number(d.amount);
                if (d.type === "AHV") totalAHV += amount;
                else if (d.type === "ALV") totalALV += amount;
                else if (d.type === "SUVA" || d.type === "NBU") totalSUVA += amount;
                else if (d.type === "BVG") totalBVG += amount;
                else if (d.type === "Quellensteuer") totalTax += amount;
                else totalOther += amount;
              });
            }
          }

          const totalDeductions = totalAHV + totalALV + totalSUVA + totalBVG + totalTax + totalOther;
          const totalNet = totalGross - totalDeductions;

          // Prepare data for official Swiss form
          const formData: LohnausweisData = {
            ahvNumber: employee.ahvNumber,
            birthDate: formatDate(employee.birthDate),
            year: yearNum.toString(),
            employmentFrom: `1.1.${yearNum}`,
            employmentTo: `31.12.${yearNum}`,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeAddress: formatAddressMultiline(employee.street, employee.postalCode, employee.city),
            basicSalary: totalGross,
            mealAllowance: 0,
            carBenefit: 0,
            otherBenefits: 0,
            irregularPayments: 0,
            capitalPayments: 0,
            participationRights: 0,
            boardFees: 0,
            otherPayments: 0,
            grossSalary: totalGross,
            socialInsurance: totalAHV + totalALV + totalSUVA,
            pensionOrdinary: totalBVG,
            pensionBuyIn: 0,
            netSalary: totalNet,
            taxWithheld: totalTax,
            travelExpenses: 0,
            otherActualExpenses: 0,
            representationExpenses: 0,
            carExpenses: 0,
            otherFlatExpenses: employee.annualFlatExpenses ? Number(employee.annualFlatExpenses) : 0,
            trainingContributions: 0,
            employerName: company.name,
            employerAddress: formatAddressMultiline(company.street, company.postalCode, company.city),
            employerPhone: '',
            issueDate: formatDate(new Date()),
          };

          // Generate PDF
          const pdfBytes = await fillLohnausweisForm(formData);
          const pdfBuffer = Buffer.from(pdfBytes);

          // Send email via Outlook
          const employeeName = `${employee.firstName} ${employee.lastName}`;
          await sendLohnausweisEmailViaOutlook(
            employee.email,
            employeeName,
            yearNum,
            pdfBuffer
          );

          results.push({ 
            employeeId, 
            success: true, 
            employeeName,
            email: employee.email 
          });
        } catch (error: any) {
          console.error('[Send Lohnausweise] Error processing employee:', error);
          results.push({ 
            employeeId, 
            success: false, 
            error: error.message 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.json({
        success: failureCount === 0,
        totalProcessed: results.length,
        successCount,
        failureCount,
        results
      });
    } catch (error: any) {
      console.error('[Send Lohnausweise] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Send payslips via email
  app.post("/api/payroll/send-payslips", async (req, res) => {
    try {
      const { paymentIds } = req.body;
      console.log('[Send Payslips] Received request with paymentIds:', paymentIds);

      if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
        return res.status(400).json({ error: "paymentIds array is required" });
      }

      // Load company data to get sender email configuration
      const company = await req.storage.getCompany();
      if (company?.payrollSenderEmail) {
        console.log('[Send Payslips] Using configured sender email:', company.payrollSenderEmail);
        console.log('[Send Payslips] Note: Outlook integration will send from the connected account');
      }

      const results = [];
      const payrollItemTypes = await req.storage.getPayrollItemTypes();

      for (const paymentId of paymentIds) {
        try {
          console.log('[Send Payslips] Processing payment:', paymentId);
          
          // Get payment details
          const payment = await req.storage.getPayrollPayment(paymentId);
          if (!payment) {
            console.log('[Send Payslips] Payment not found:', paymentId);
            results.push({ paymentId, success: false, error: "Payment not found" });
            continue;
          }

          // Get employee details
          const employee = await req.storage.getEmployee(payment.employee.id);
          if (!employee) {
            console.log('[Send Payslips] Employee not found:', payment.employee.id);
            results.push({ paymentId, success: false, error: "Employee not found" });
            continue;
          }

          console.log('[Send Payslips] Employee:', employee.firstName, employee.lastName, 'Email:', employee.email);

          // Check if employee has email
          if (!employee.email) {
            console.log('[Send Payslips] Employee has no email:', employee.firstName, employee.lastName);
            results.push({ 
              paymentId, 
              success: false, 
              error: `Employee ${employee.firstName} ${employee.lastName} has no email address` 
            });
            continue;
          }

          // Generate PDF
          const monthNames = [
            "Januar", "Februar", "März", "April", "Mai", "Juni",
            "Juli", "August", "September", "Oktober", "November", "Dezember"
          ];
          const monthName = monthNames[payment.paymentMonth - 1];

          const pdf = new PDFGenerator();
          const dateRange = `${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)}`;
          pdf.addPayrollTitle("Lohnabrechnung", `${monthName} ${payment.paymentYear}`, dateRange);
          const employeeName = `${employee.firstName} ${employee.lastName}`;
          pdf.addWindowEnvelopeAddress(employeeName, formatAddressMultiline(employee.street, employee.postalCode, employee.city));
          pdf.addSection("LOHNBESTANDTEILE");
          
          if (payment.payrollItems && payment.payrollItems.length > 0) {
            payment.payrollItems.forEach((item: any) => {
              const itemType = payrollItemTypes.find(t => t.code === item.type);
              const typeName = itemType ? itemType.name : item.type;
              let label = `${item.type} - ${typeName}`;
              if (item.description) {
                label += ` (${item.description})`;
              }
              if (item.hours && item.hourlyRate) {
                label += ` - ${item.hours}h à ${formatCurrency(parseFloat(item.hourlyRate))}`;
              }
              pdf.addPayrollLine(label, formatCurrency(parseFloat(item.amount)), false, false);
            });
          }

          pdf.addSeparatorLine();
          pdf.addPayrollLine("BRUTTOLOHN", formatCurrency(parseFloat(payment.grossSalary)), true, false);
          pdf.addSeparatorLine();
          
          if (payment.deductions && payment.deductions.length > 0) {
            pdf.addSection("ABZÜGE");
            payment.deductions.forEach((d: any) => {
              let label = `${d.type}`;
              if (d.description) {
                label = `${d.type} - ${d.description}`;
              }
              if (d.percentage && d.baseAmount) {
                label += ` (${formatPercentage(parseFloat(d.percentage))} von ${formatCurrency(parseFloat(d.baseAmount))})`;
              } else if (d.percentage && !d.baseAmount) {
                label += ` (${formatPercentage(parseFloat(d.percentage))})`;
              }
              pdf.addPayrollLine(label, formatCurrency(parseFloat(d.amount)), false, true);
            });
            pdf.addSeparatorLine();
          }

          pdf.addPayrollLine("TOTAL ABZÜGE", formatCurrency(parseFloat(payment.totalDeductions)), true, true);
          pdf.addSeparatorLine();
          pdf.addPayrollLine("NETTOLOHN", formatCurrency(parseFloat(payment.netSalary)), true, false);
          
          // Add footer with company info
          const companyInfo = await req.storage.getCompany();
          if (companyInfo) {
            const companyAddress = formatAddress(companyInfo.street, companyInfo.postalCode, companyInfo.city);
            pdf.addFooter(`${companyInfo.name} | ${companyAddress}`);
          }

          const pdfBlob = pdf.getBlob();
          const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

          // Send email via Outlook
          await sendPayslipEmailViaOutlook(
            employee.email,
            employeeName,
            payment.paymentMonth,
            payment.paymentYear,
            pdfBuffer
          );

          results.push({ 
            paymentId, 
            success: true, 
            employeeName,
            email: employee.email 
          });
        } catch (error: any) {
          results.push({ 
            paymentId, 
            success: false, 
            error: error.message 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.json({
        success: failureCount === 0,
        totalProcessed: results.length,
        successCount,
        failureCount,
        results
      });
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

      const report = await req.storage.getMonthlyReport(year, month);
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

      const report = await req.storage.getYearlyReport(year);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/employee-payroll-overview", async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const year = parseInt(req.query.year as string);

      if (!employeeId || !year) {
        return res.status(400).json({ error: "Invalid employee ID or year" });
      }

      const overview = await req.storage.getEmployeePayrollOverview(employeeId, year);
      res.json(overview);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // PDF EXPORTS
  // ============================================================================
  // Bulk export must come BEFORE :id route to avoid route matching issues
  app.get("/api/pdf/payroll/bulk", async (req, res) => {
    try {
      const idsParam = req.query.ids as string;
      if (!idsParam) {
        return res.status(400).json({ error: "No payment IDs provided" });
      }

      const paymentIds = idsParam.split(',').map(id => id.trim());
      if (paymentIds.length === 0) {
        return res.status(400).json({ error: "No valid payment IDs provided" });
      }

      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Load payroll item types for name mapping
      const payrollItemTypes = await req.storage.getPayrollItemTypes();

      // Month names in German
      const monthNames = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
      ];

      const pdf = new PDFGenerator();
      let isFirstPayment = true;

      // Generate PDF for each payment
      for (const paymentId of paymentIds) {
        const payment = await req.storage.getPayrollPayment(paymentId);
        if (!payment) {
          continue; // Skip if payment not found
        }

        const employee = await req.storage.getEmployee(payment.employee.id);
        if (!employee) {
          continue; // Skip if employee not found
        }

        // Add page break for subsequent payments
        if (!isFirstPayment) {
          pdf.addPageBreak();
        }
        isFirstPayment = false;

        const monthName = monthNames[payment.paymentMonth - 1];

        // Add title on the left with date range
        const dateRange = `${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)}`;
        pdf.addPayrollTitle("Lohnabrechnung", `${monthName} ${payment.paymentYear}`, dateRange);
        
        // Add employee address on the right (for window envelope)
        const employeeName = `${employee.firstName} ${employee.lastName}`;
        pdf.addWindowEnvelopeAddress(employeeName, formatAddressMultiline(employee.street, employee.postalCode, employee.city));

        // Add section header
        pdf.addSection("LOHNBESTANDTEILE");
        
        // Add payroll items as individual lines
        if (payment.payrollItems && payment.payrollItems.length > 0) {
          payment.payrollItems.forEach((item: any) => {
            // Find the name for this payroll item type
            const itemType = payrollItemTypes.find(t => t.code === item.type);
            const typeName = itemType ? itemType.name : item.type;
            let label = `${item.type} - ${typeName}`;
            if (item.description) {
              label += ` (${item.description})`;
            }
            if (item.hours && item.hourlyRate) {
              label += ` - ${item.hours}h à ${formatCurrency(parseFloat(item.hourlyRate))}`;
            }
            pdf.addPayrollLine(label, formatCurrency(parseFloat(item.amount)), false, false);
          });
        }

        pdf.addSeparatorLine();
        
        // Gross salary total
        pdf.addPayrollLine("BRUTTOLOHN", formatCurrency(parseFloat(payment.grossSalary)), true, false);
        
        pdf.addSeparatorLine();
        
        // Add deductions section
        if (payment.deductions && payment.deductions.length > 0) {
          pdf.addSection("ABZÜGE");
          
          payment.deductions.forEach((d: any) => {
            let label = `${d.type}`;
            if (d.description) {
              label = `${d.type} - ${d.description}`;
            }
            if (d.percentage && d.baseAmount) {
              label += ` (${formatPercentage(parseFloat(d.percentage))} von ${formatCurrency(parseFloat(d.baseAmount))})`;
            } else if (d.percentage && !d.baseAmount) {
              // For BVG without baseAmount, show percentage without base
              label += ` (${formatPercentage(parseFloat(d.percentage))})`;
            }
            pdf.addPayrollLine(label, formatCurrency(parseFloat(d.amount)), false, true);
          });
          
          pdf.addSeparatorLine();
        }

        // Total deductions
        pdf.addPayrollLine("TOTAL ABZÜGE", formatCurrency(parseFloat(payment.totalDeductions)), true, true);
        
        pdf.addSeparatorLine();
        
        // Net salary - highlighted
        pdf.addPayrollLine("NETTOLOHN", formatCurrency(parseFloat(payment.netSalary)), true, false);

        // Add footer with company info
        const companyAddress = formatAddress(company.street, company.postalCode, company.city);
        pdf.addFooter(`${company.name} | ${companyAddress}`);
      }

      const pdfBlob = pdf.getBlob();
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Lohnabrechnungen_${formatDate(new Date())}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      console.error("Bulk PDF Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pdf/monthly-payslips", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string);
      const employeeIds = (req.query.employeeIds as string)?.split(',') || [];

      if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }

      if (employeeIds.length === 0) {
        return res.status(400).json({ error: "No employees selected" });
      }

      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Load payroll item types for name mapping
      const payrollItemTypes = await req.storage.getPayrollItemTypes();

      // Month names in German
      const monthNames = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
      ];
      
      const monthName = monthNames[month - 1];

      const pdf = new PDFGenerator();
      
      // Get all payroll payments for the month
      const allPayments = await req.storage.getPayrollPayments(year, month);
      
      // Process each selected employee
      for (let empIndex = 0; empIndex < employeeIds.length; empIndex++) {
        const employeeId = employeeIds[empIndex];
        
        // Filter payments for this employee
        const employeePayments = allPayments.filter((p: any) => p.employee.id === employeeId);
        
        if (employeePayments.length === 0) {
          continue; // Skip if no payments for this employee
        }
        
        // Get employee details
        const employee = await req.storage.getEmployee(employeeId);
        if (!employee) {
          continue;
        }
        
        // Add page break between employees (but not before first employee)
        if (empIndex > 0) {
          pdf.addPageBreak();
        }
        
        // Calculate totals across all payments
        let totalGrossSalary = 0;
        let totalDeductions = 0;
        let totalNetSalary = 0;
        
        // Aggregate payroll items by type
        const aggregatedItems = new Map<string, { type: string; description: string; hours: number; amount: number; hourlyRates: number[] }>();
        
        // Aggregate deductions by type
        const aggregatedDeductions = new Map<string, { type: string; description: string; percentage: number; baseAmount: number; amount: number }>();
        
        for (const payment of employeePayments) {
          totalGrossSalary += parseFloat(payment.grossSalary);
          totalDeductions += parseFloat(payment.totalDeductions);
          totalNetSalary += parseFloat(payment.netSalary);
          
          // Get full payment details with items and deductions
          const fullPayment = await req.storage.getPayrollPayment(payment.id);
          
          // Aggregate payroll items
          if (fullPayment?.payrollItems) {
            for (const item of fullPayment.payrollItems) {
              const key = item.type;
              if (aggregatedItems.has(key)) {
                const existing = aggregatedItems.get(key)!;
                existing.hours += parseFloat(item.hours || "0");
                existing.amount += parseFloat(item.amount);
                if (item.hourlyRate) {
                  existing.hourlyRates.push(parseFloat(item.hourlyRate));
                }
              } else {
                aggregatedItems.set(key, {
                  type: item.type,
                  description: item.description || "",
                  hours: parseFloat(item.hours || "0"),
                  amount: parseFloat(item.amount),
                  hourlyRates: item.hourlyRate ? [parseFloat(item.hourlyRate)] : []
                });
              }
            }
          }
          
          // Aggregate deductions
          if (fullPayment?.deductions) {
            for (const deduction of fullPayment.deductions) {
              const key = deduction.type;
              if (aggregatedDeductions.has(key)) {
                const existing = aggregatedDeductions.get(key)!;
                existing.amount += parseFloat(deduction.amount);
                existing.baseAmount += parseFloat(deduction.baseAmount || "0");
              } else {
                aggregatedDeductions.set(key, {
                  type: deduction.type,
                  description: deduction.description || "",
                  percentage: parseFloat(deduction.percentage || "0"),
                  baseAmount: parseFloat(deduction.baseAmount || "0"),
                  amount: parseFloat(deduction.amount)
                });
              }
            }
          }
        }
        
        // Determine date range from first and last payment
        const sortedPayments = [...employeePayments].sort((a, b) => 
          new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
        );
        const firstPayment = sortedPayments[0];
        const lastPayment = sortedPayments[sortedPayments.length - 1];
        const dateRange = `${formatDate(firstPayment.periodStart)} - ${formatDate(lastPayment.periodEnd)}`;
        
        // Add title with date range
        pdf.addPayrollTitle("Lohnabrechnung", `${monthName} ${year}`, dateRange);
        
        // Add employee address on the right (for window envelope)
        const employeeName = `${employee.firstName} ${employee.lastName}`;
        pdf.addWindowEnvelopeAddress(employeeName, formatAddressMultiline(employee.street, employee.postalCode, employee.city));

        // Add section header
        pdf.addSection("LOHNBESTANDTEILE");
        
        // Add aggregated payroll items
        for (const [key, item] of Array.from(aggregatedItems)) {
          const itemType = payrollItemTypes.find(t => t.code === item.type);
          const typeName = itemType ? itemType.name : item.type;
          let label = `${item.type} - ${typeName}`;
          if (item.description) {
            label += ` (${item.description})`;
          }
          if (item.hours > 0) {
            // Calculate average hourly rate if available
            const avgRate = item.hourlyRates.length > 0 
              ? item.hourlyRates.reduce((a: number, b: number) => a + b, 0) / item.hourlyRates.length 
              : 0;
            if (avgRate > 0) {
              label += ` - ${item.hours.toFixed(2)}h à ${formatCurrency(avgRate)}`;
            } else {
              label += ` - ${item.hours.toFixed(2)}h`;
            }
          }
          pdf.addPayrollLine(label, formatCurrency(item.amount), false, false);
        }

        pdf.addSeparatorLine();
        
        // Gross salary total
        pdf.addPayrollLine("BRUTTOLOHN", formatCurrency(totalGrossSalary), true, false);
        
        pdf.addSeparatorLine();
        
        // Add deductions section
        if (aggregatedDeductions.size > 0) {
          pdf.addSection("ABZÜGE");
          
          for (const [key, deduction] of Array.from(aggregatedDeductions)) {
            let label = `${deduction.type}`;
            if (deduction.description) {
              label = `${deduction.type} - ${deduction.description}`;
            }
            if (deduction.percentage > 0 && deduction.baseAmount > 0) {
              label += ` (${formatPercentage(deduction.percentage)} von ${formatCurrency(deduction.baseAmount)})`;
            } else if (deduction.percentage > 0) {
              label += ` (${formatPercentage(deduction.percentage)})`;
            }
            pdf.addPayrollLine(label, formatCurrency(deduction.amount), false, true);
          }
          
          pdf.addSeparatorLine();
        }

        // Total deductions
        pdf.addPayrollLine("TOTAL ABZÜGE", formatCurrency(totalDeductions), true, true);
        
        pdf.addSeparatorLine();
        
        // Net salary - highlighted
        pdf.addPayrollLine("NETTOLOHN", formatCurrency(totalNetSalary), true, false);

        // Add footer with company info
        const companyAddress = formatAddress(company.street, company.postalCode, company.city);
        pdf.addFooter(`${company.name} | ${companyAddress}`);
      }

      const pdfBlob = pdf.getBlob();
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Monatslohnabrechnungen_${monthName}_${year}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      console.error("Monthly Payslips PDF Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pdf/payroll/:id", async (req, res) => {
    try {
      const payment = await req.storage.getPayrollPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const employee = await req.storage.getEmployee(payment.employee.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Load payroll item types for name mapping
      const payrollItemTypes = await req.storage.getPayrollItemTypes();

      // Month names in German
      const monthNames = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
      ];
      
      const monthName = monthNames[payment.paymentMonth - 1];

      const pdf = new PDFGenerator();
      
      // Add title on the left with date range
      const dateRange = `${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)}`;
      pdf.addPayrollTitle("Lohnabrechnung", `${monthName} ${payment.paymentYear}`, dateRange);
      
      // Add employee address on the right (for window envelope)
      const employeeName = `${employee.firstName} ${employee.lastName}`;
      pdf.addWindowEnvelopeAddress(employeeName, formatAddressMultiline(employee.street, employee.postalCode, employee.city));

      // Add section header
      pdf.addSection("LOHNBESTANDTEILE");
      
      // Add payroll items as individual lines
      if (payment.payrollItems && payment.payrollItems.length > 0) {
        payment.payrollItems.forEach((item: any) => {
          // Find the name for this payroll item type
          const itemType = payrollItemTypes.find(t => t.code === item.type);
          const typeName = itemType ? itemType.name : item.type;
          let label = `${item.type} - ${typeName}`;
          if (item.description) {
            label += ` (${item.description})`;
          }
          if (item.hours && item.hourlyRate) {
            label += ` - ${item.hours}h à ${formatCurrency(parseFloat(item.hourlyRate))}`;
          }
          pdf.addPayrollLine(label, formatCurrency(parseFloat(item.amount)), false, false);
        });
      }

      pdf.addSeparatorLine();
      
      // Gross salary total
      pdf.addPayrollLine("BRUTTOLOHN", formatCurrency(parseFloat(payment.grossSalary)), true, false);
      
      pdf.addSeparatorLine();
      
      // Add deductions section
      if (payment.deductions && payment.deductions.length > 0) {
        pdf.addSection("ABZÜGE");
        
        payment.deductions.forEach((d: any) => {
          let label = `${d.type}`;
          if (d.description) {
            label = `${d.type} - ${d.description}`;
          }
          if (d.percentage && d.baseAmount) {
            label += ` (${formatPercentage(parseFloat(d.percentage))} von ${formatCurrency(parseFloat(d.baseAmount))})`;
          } else if (d.percentage && !d.baseAmount) {
            // For BVG without baseAmount, show percentage without base
            label += ` (${formatPercentage(parseFloat(d.percentage))})`;
          }
          pdf.addPayrollLine(label, formatCurrency(parseFloat(d.amount)), false, true);
        });
        
        pdf.addSeparatorLine();
      }

      // Total deductions
      pdf.addPayrollLine("TOTAL ABZÜGE", formatCurrency(parseFloat(payment.totalDeductions)), true, true);
      
      pdf.addSeparatorLine();
      
      // Net salary - highlighted
      pdf.addPayrollLine("NETTOLOHN", formatCurrency(parseFloat(payment.netSalary)), true, false);

      // Add footer with company info
      const companyAddress = formatAddress(company.street, company.postalCode, company.city);
      pdf.addFooter(`${company.name} | ${companyAddress}`);

      const pdfBlob = pdf.getBlob();
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Lohnabrechnung_${employee.lastName}_${monthName}_${payment.paymentYear}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      console.error("PDF Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pdf/monthly-report", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string);

      if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }

      const report = await req.storage.getMonthlyReport(year, month);
      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const monthNames = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
      ];

      const pdf = new PDFGenerator();

      // Generate a page for each employee
      if (report.employees && report.employees.length > 0) {
        for (let i = 0; i < report.employees.length; i++) {
          const emp = report.employees[i];
          
          // Add page break between employees (but not before first employee)
          if (i > 0) {
            pdf.addPageBreak();
          }

          // Title and period
          pdf.addPayrollTitle("Lohnabrechnung", `${monthNames[month - 1]} ${year}`);

          // Employee address (right side)
          const employeeData = await req.storage.getEmployee(emp.employeeId);
          if (employeeData) {
            pdf.addWindowEnvelopeAddress(
              `${employeeData.firstName} ${employeeData.lastName}`,
              formatAddressMultiline(employeeData.street, employeeData.postalCode, employeeData.city)
            );
          }

          // LOHNBESTANDTEILE Section
          pdf.addSection("LOHNBESTANDTEILE");
          
          // Get payroll items for this employee
          if (emp.payrollItems && emp.payrollItems.length > 0) {
            emp.payrollItems.forEach((item: any) => {
              const description = item.description ? ` (${item.description})` : "";
              const label = item.name ? `${item.code} - ${item.name}` : item.code;
              pdf.addPayrollLine(`${label}${description}`, formatCurrency(parseFloat(item.amount)), false, false);
            });
          }

          // BRUTTOLOHN
          pdf.addSeparatorLine();
          pdf.addPayrollLine("BRUTTOLOHN", formatCurrency(parseFloat(emp.totalGrossSalary)), true, false);
          pdf.addSeparatorLine();

          // ABZÜGE Section
          pdf.addSection("ABZÜGE");
          
          // Get deductions for this employee
          if (emp.deductions && emp.deductions.length > 0) {
            emp.deductions.forEach((ded: any) => {
              const baseAmount = parseFloat(ded.baseAmount || emp.totalGrossSalary);
              const rate = parseFloat(ded.rate || "0");
              const description = `${ded.type} Abzug (${rate.toFixed(2)}% von ${formatCurrency(baseAmount)})`;
              pdf.addPayrollLine(description, formatCurrency(parseFloat(ded.amount)), false, true);
            });
          }

          // TOTAL ABZÜGE
          pdf.addSeparatorLine();
          pdf.addPayrollLine("TOTAL ABZÜGE", formatCurrency(parseFloat(emp.totalDeductions)), true, true);
          pdf.addSeparatorLine();

          // NETTOLOHN
          pdf.addPayrollLine("NETTOLOHN", formatCurrency(parseFloat(emp.totalNetSalary)), true, false);
        }
      }

      const pdfBlob = pdf.getBlob();
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Monatsabrechnung_${year}_${month.toString().padStart(2, '0')}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pdf/yearly-report", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);

      if (!year) {
        return res.status(400).json({ error: "Invalid year" });
      }

      const report = await req.storage.getYearlyReport(year);
      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const pdf = new PDFGenerator();
      
      pdf.addHeader({
        title: "Jahresabrechnung",
        subtitle: `${company.name} - ${year}`,
      });

      // Add monthly breakdown table
      if (report.months && report.months.length > 0) {
        pdf.addSection("Monatsübersicht");
        
        // Filter out months with no payments
        const monthsWithPayments = report.months.filter((m: any) => m.paymentsCount > 0);
        
        const monthRows = monthsWithPayments.map((m: any) => [
          m.monthName,
          m.paymentsCount.toString(),
          formatCurrency(parseFloat(m.grossSalary)),
          formatCurrency(parseFloat(m.deductions)),
          formatCurrency(parseFloat(m.netSalary)),
        ]);
        
        pdf.addTable(
          ["Monat", "Anzahl", "Bruttolohn", "Abzüge", "Nettolohn"],
          monthRows,
          { columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } } }
        );
      }

      // Add totals section
      pdf.addSection("Jahresgesamtsummen");
      pdf.addPayrollLine("Anzahl Auszahlungen", report.totals.paymentsCount.toString(), false, false);
      pdf.addPayrollLine("Gesamtbruttolohn", formatCurrency(parseFloat(report.totals.grossSalary)), false, false);
      pdf.addPayrollLine("Gesamt Abzüge", formatCurrency(parseFloat(report.totals.deductions)), false, false);
      pdf.addSeparatorLine();
      pdf.addPayrollLine("Gesamtnettolohn", formatCurrency(parseFloat(report.totals.netSalary)), true, false);

      // Add employee summary section
      if (report.employeeSummary && report.employeeSummary.length > 0) {
        pdf.addSection("Mitarbeiter-Übersicht");
        
        const employeeRows = report.employeeSummary.map((emp: any) => [
          emp.ahvNumber,
          formatDate(emp.birthDate),
          `${emp.firstName} ${emp.lastName}`,
          `${emp.employedFrom}-${emp.employedTo}`,
          formatCurrencyNumber(parseFloat(emp.ahvWage)),
          formatCurrencyNumber(parseFloat(emp.alvWage)),
          formatCurrencyNumber(parseFloat(emp.alv1Wage)),
          formatCurrencyNumber(parseFloat(emp.alv2Wage)),
          formatCurrencyNumber(parseFloat(emp.nbuWage)),
          formatCurrencyNumber(parseFloat(emp.childAllowance)),
        ]);
        
        pdf.addTable(
          ["AHV-Nr.", "Geb.datum", "Name", "Zeitraum", "AHV-Lohn", "ALV-Lohn", "ALV1-Lohn", "ALV2-Lohn", "NBU-Lohn", "Kinder"],
          employeeRows,
          { compact: true, columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' } } }
        );
      }

      // Add child allowance summary section
      if (report.childAllowanceEmployees && report.childAllowanceEmployees.length > 0) {
        pdf.addSection("Kinderzulagen");
        
        const childAllowanceRows = report.childAllowanceEmployees.map((emp: any) => [
          emp.ahvNumber,
          formatDate(emp.birthDate),
          `${emp.firstName} ${emp.lastName}`,
          `${emp.employedFrom}-${emp.employedTo}`,
          formatCurrencyNumber(parseFloat(emp.childAllowance)),
        ]);
        
        // Calculate total
        const totalChildAllowance = report.childAllowanceEmployees.reduce(
          (sum: number, emp: any) => sum + parseFloat(emp.childAllowance),
          0
        );
        
        // Add total row
        childAllowanceRows.push([
          "",
          "",
          "",
          "TOTAL",
          formatCurrencyNumber(totalChildAllowance),
        ]);
        
        pdf.addTable(
          ["AHV-Nr.", "Geb.datum", "Name", "Zeitraum", "Kindergeld"],
          childAllowanceRows,
          { compact: true, columnStyles: { 4: { halign: 'right' } } }
        );
      }

      // Add wage summary by gender section
      if (report.wageSummary) {
        const uvgMaxIncomeFormatted = formatCurrencyNumber(parseFloat(report.uvgMaxIncome));
        
        pdf.addSection("Lohnsummen-Zusammenstellung nach Geschlecht");
        pdf.addText("Hinweis", "Höchstlohn pro Person und Jahr CHF 300'000");
        
        const wageSummaryRows = [
          [
            "AHV-pflichtige Löhne gemäss Lohnbescheinigung",
            formatCurrencyNumber(parseFloat(report.wageSummary.male.ahvSubject)),
            formatCurrencyNumber(parseFloat(report.wageSummary.female.ahvSubject))
          ],
          [
            "+ Nicht AHV-pflichtige Löhne",
            report.wageSummary.male.nonAhvSubject !== "0.00" ? `+ ${formatCurrencyNumber(parseFloat(report.wageSummary.male.nonAhvSubject))}` : "-",
            report.wageSummary.female.nonAhvSubject !== "0.00" ? `+ ${formatCurrencyNumber(parseFloat(report.wageSummary.female.nonAhvSubject))}` : "-"
          ],
          [
            "= Total massgebende Lohnsummen",
            `= ${formatCurrencyNumber(parseFloat(report.wageSummary.male.totalRelevant))}`,
            `= ${formatCurrencyNumber(parseFloat(report.wageSummary.female.totalRelevant))}`
          ],
          [
            `Total Überschusslohnsumme (ab ${uvgMaxIncomeFormatted})`,
            `= ${formatCurrencyNumber(parseFloat(report.wageSummary.male.excessWage))}`,
            `= ${formatCurrencyNumber(parseFloat(report.wageSummary.female.excessWage))}`
          ],
          [
            "- nicht UVG-prämienpflichtige Löhne",
            report.wageSummary.male.nonUvgPremium !== "0.00" ? `- ${formatCurrencyNumber(parseFloat(report.wageSummary.male.nonUvgPremium))}` : "-",
            report.wageSummary.female.nonUvgPremium !== "0.00" ? `- ${formatCurrencyNumber(parseFloat(report.wageSummary.female.nonUvgPremium))}` : "-"
          ],
          [
            `= Total UVG-Lohnsumme (bis ${uvgMaxIncomeFormatted})`,
            `= ${formatCurrencyNumber(parseFloat(report.wageSummary.male.uvgWage))}`,
            `= ${formatCurrencyNumber(parseFloat(report.wageSummary.female.uvgWage))}`
          ],
          [
            "",
            "",
            ""
          ],
          [
            "UVGO-Lohnsummen Personen 70+ (BU)",
            formatCurrencyNumber(parseFloat(report.wageSummary.male.uvgo70Plus_BU)),
            formatCurrencyNumber(parseFloat(report.wageSummary.female.uvgo70Plus_BU))
          ],
          [
            "UVGO-Lohnsummen Personen 70+ (NBU)",
            formatCurrencyNumber(parseFloat(report.wageSummary.male.uvgo70Plus_NBU)),
            formatCurrencyNumber(parseFloat(report.wageSummary.female.uvgo70Plus_NBU))
          ]
        ];
        
        pdf.addTable(
          ["Kategorie", "Lohn Männer", "Lohn Frauen"],
          wageSummaryRows,
          { compact: true, columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } } }
        );
      }

      pdf.addFooter(`Erstellt am ${formatDate(new Date())} - ${company.name}`);

      const pdfBlob = pdf.getBlob();
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Jahresabrechnung_${year}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 1. Yearly Report - Rekapitulation
  app.get("/api/pdf/yearly-recap", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      if (!year) {
        return res.status(400).json({ error: "Invalid year" });
      }

      const report = await req.storage.getYearlyReport(year);
      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const pdf = new PDFGenerator();
      const companyAddress = formatAddressMultiline(company.street, company.postalCode, company.city);
      pdf.addCompanyHeader(company.name, companyAddress, company.ahvAccountingNumber, "Rekapitulation Jahresabrechnung", year);

      // Add totals section
      pdf.addSection("Jahresgesamtsummen");
      pdf.addPayrollLine("Anzahl Auszahlungen", report.totals.paymentsCount.toString(), false, false);
      pdf.addPayrollLine("Gesamtbruttolohn", formatCurrency(parseFloat(report.totals.grossSalary)), false, false);
      pdf.addPayrollLine("Gesamt Abzüge", formatCurrency(parseFloat(report.totals.deductions)), false, false);
      pdf.addSeparatorLine();
      pdf.addPayrollLine("Gesamtnettolohn", formatCurrency(parseFloat(report.totals.netSalary)), true, false);

      // Add Lohnarten Rekapitulation
      if (report.payrollItemSummary && report.payrollItemSummary.length > 0) {
        pdf.addSection("Lohnarten Rekapitulation - Ganzes Jahr " + year);
        
        const payrollItemRows = report.payrollItemSummary.map((item: any) => [
          item.code,
          item.type,
          item.quantity,
          "+ " + formatCurrency(parseFloat(item.amount)),
        ]);
        
        // Add total row
        payrollItemRows.push([
          "",
          "BRUTTOLOHN",
          "",
          formatCurrency(parseFloat(report.totals.grossSalary)),
        ]);
        
        pdf.addTable(
          ["Nr", "Legende", "Menge", "Betrag"],
          payrollItemRows,
          { columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } } }
        );
      }

      // Add Abzüge Details
      if (report.deductionSummary && report.deductionSummary.length > 0) {
        pdf.addSection("Abzüge - Details");
        
        const deductionRows = report.deductionSummary.map((ded: any) => [
          ded.type,
          "- " + formatCurrency(parseFloat(ded.amount)),
        ]);
        
        // Add totals
        deductionRows.push([
          "TOTAL ABZÜGE",
          "- " + formatCurrency(parseFloat(report.totals.deductions)),
        ]);
        
        deductionRows.push([
          "NETTOLOHN",
          formatCurrency(parseFloat(report.totals.netSalary)),
        ]);
        
        pdf.addTable(
          ["Abzugstyp", "Betrag"],
          deductionRows,
          { columnStyles: { 1: { halign: 'right' } } }
        );
      }

      // Add Basis-Beträge
      if (report.basisAmounts) {
        pdf.addSection("Basis-Beträge");
        
        const basisRows = [
          ["AHV-Basis", formatCurrency(parseFloat(report.basisAmounts.ahvBasis))],
          ["ALV-Basis", formatCurrency(parseFloat(report.basisAmounts.alvBasis))],
          ["NBU-Basis", formatCurrency(parseFloat(report.basisAmounts.nbuBasis))],
          ["BVG-Basis", formatCurrency(parseFloat(report.basisAmounts.bvgBasis))],
        ];
        
        pdf.addTable(
          ["Typ", "Betrag"],
          basisRows,
          { columnStyles: { 1: { halign: 'right' } } }
        );
      }

      pdf.addFooter(`Erstellt am ${formatDate(new Date())} - ${company.name}`);

      const pdfBlob = pdf.getBlob();
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Jahresabrechnung_Rekapitulation_${year}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Yearly Report - Monthly Overview
  app.get("/api/pdf/yearly-months", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      if (!year) {
        return res.status(400).json({ error: "Invalid year" });
      }

      const report = await req.storage.getYearlyReport(year);
      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const pdf = new PDFGenerator();
      const companyAddress = formatAddressMultiline(company.street, company.postalCode, company.city);
      pdf.addCompanyHeader(company.name, companyAddress, company.ahvAccountingNumber, "Monatsübersicht", year);

      // Add monthly breakdown table
      if (report.months && report.months.length > 0) {
        const monthsWithPayments = report.months.filter((m: any) => m.paymentsCount > 0);
        
        const monthRows = monthsWithPayments.map((m: any) => [
          m.monthName,
          m.paymentsCount.toString(),
          formatCurrency(parseFloat(m.grossSalary)),
          formatCurrency(parseFloat(m.deductions)),
          formatCurrency(parseFloat(m.netSalary)),
        ]);
        
        pdf.addTable(
          ["Monat", "Anzahl", "Bruttolohn", "Abzüge", "Nettolohn"],
          monthRows,
          { columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } } }
        );
      }

      pdf.addFooter(`Erstellt am ${formatDate(new Date())} - ${company.name}`);

      const pdfBlob = pdf.getBlob();
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Jahresabrechnung_Monatsuebersicht_${year}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Yearly Report - Employee Overview (A4 Landscape)
  app.get("/api/pdf/yearly-employees", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      if (!year) {
        return res.status(400).json({ error: "Invalid year" });
      }

      const report = await req.storage.getYearlyReport(year);
      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const pdf = new PDFGenerator('landscape');
      const companyAddress = formatAddressMultiline(company.street, company.postalCode, company.city);
      pdf.addCompanyHeader(company.name, companyAddress, company.ahvAccountingNumber, "Mitarbeiterübersicht", year);

      // Add employee summary section
      if (report.employeeSummary && report.employeeSummary.length > 0) {
        const employeeRows = report.employeeSummary.map((emp: any) => [
          emp.ahvNumber,
          formatDate(emp.birthDate),
          `${emp.firstName} ${emp.lastName}`,
          `${emp.employedFrom}-${emp.employedTo}`,
          formatCurrencyNumber(parseFloat(emp.ahvWage)),
          formatCurrencyNumber(parseFloat(emp.alvWage)),
          formatCurrencyNumber(parseFloat(emp.alv1Wage)),
          formatCurrencyNumber(parseFloat(emp.alv2Wage)),
          formatCurrencyNumber(parseFloat(emp.nbuWage)),
          formatCurrencyNumber(parseFloat(emp.childAllowance)),
        ]);
        
        pdf.addTable(
          ["AHV-Nr.", "Geb.datum", "Name", "Zeitraum", "AHV-Lohn", "ALV-Lohn", "ALV1-Lohn", "ALV2-Lohn", "NBU-Lohn", "Kinder"],
          employeeRows,
          { compact: true, columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' } } }
        );
      }

      pdf.addFooter(`Erstellt am ${formatDate(new Date())} - ${company.name}`);

      const pdfBlob = pdf.getBlob();
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Jahresabrechnung_Mitarbeiterliste_${year}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Yearly Report - Child Allowances
  app.get("/api/pdf/yearly-childallowances", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      if (!year) {
        return res.status(400).json({ error: "Invalid year" });
      }

      const report = await req.storage.getYearlyReport(year);
      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const pdf = new PDFGenerator();
      const companyAddress = formatAddressMultiline(company.street, company.postalCode, company.city);
      pdf.addCompanyHeader(company.name, companyAddress, company.ahvAccountingNumber, "Kinderzulagen", year);

      // Add child allowance summary section
      if (report.childAllowanceEmployees && report.childAllowanceEmployees.length > 0) {
        const childAllowanceRows = report.childAllowanceEmployees.map((emp: any) => [
          emp.ahvNumber,
          formatDate(emp.birthDate),
          `${emp.firstName} ${emp.lastName}`,
          `${emp.employedFrom}-${emp.employedTo}`,
          formatCurrencyNumber(parseFloat(emp.childAllowance)),
        ]);
        
        // Calculate total
        const totalChildAllowance = report.childAllowanceEmployees.reduce(
          (sum: number, emp: any) => sum + parseFloat(emp.childAllowance),
          0
        );
        
        // Add total row
        childAllowanceRows.push([
          "",
          "",
          "",
          "TOTAL",
          formatCurrencyNumber(totalChildAllowance),
        ]);
        
        pdf.addTable(
          ["AHV-Nr.", "Geb.datum", "Name", "Zeitraum", "Kindergeld"],
          childAllowanceRows,
          { compact: true, columnStyles: { 4: { halign: 'right' } } }
        );
      }

      pdf.addFooter(`Erstellt am ${formatDate(new Date())} - ${company.name}`);

      const pdfBlob = pdf.getBlob();
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Jahresabrechnung_Kinderzulagen_${year}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Yearly Report - Wage Summary by Gender
  app.get("/api/pdf/yearly-wage-summary", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      if (!year) {
        return res.status(400).json({ error: "Invalid year" });
      }

      const report = await req.storage.getYearlyReport(year);
      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const pdf = new PDFGenerator();
      const companyAddress = formatAddressMultiline(company.street, company.postalCode, company.city);
      pdf.addCompanyHeader(company.name, companyAddress, company.ahvAccountingNumber, "Lohnsummen nach Geschlecht", year);

      // Add wage summary by gender section
      if (report.wageSummary) {
        const uvgMaxIncomeFormatted = formatCurrencyNumber(parseFloat(report.uvgMaxIncome));
        
        pdf.addText("Hinweis", "Höchstlohn pro Person und Jahr CHF 300'000");
        
        const wageSummaryRows = [
          [
            "AHV-pflichtige Löhne gemäss Lohnbescheinigung",
            formatCurrencyNumber(parseFloat(report.wageSummary.male.ahvSubject)),
            formatCurrencyNumber(parseFloat(report.wageSummary.female.ahvSubject))
          ],
          [
            "+ Nicht AHV-pflichtige Löhne",
            report.wageSummary.male.nonAhvSubject !== "0.00" ? `+ ${formatCurrencyNumber(parseFloat(report.wageSummary.male.nonAhvSubject))}` : "-",
            report.wageSummary.female.nonAhvSubject !== "0.00" ? `+ ${formatCurrencyNumber(parseFloat(report.wageSummary.female.nonAhvSubject))}` : "-"
          ],
          [
            "= Total massgebende Lohnsummen",
            `= ${formatCurrencyNumber(parseFloat(report.wageSummary.male.totalRelevant))}`,
            `= ${formatCurrencyNumber(parseFloat(report.wageSummary.female.totalRelevant))}`
          ],
          [
            `Total Überschusslohnsumme (ab ${uvgMaxIncomeFormatted})`,
            `= ${formatCurrencyNumber(parseFloat(report.wageSummary.male.excessWage))}`,
            `= ${formatCurrencyNumber(parseFloat(report.wageSummary.female.excessWage))}`
          ],
          [
            "- nicht UVG-prämienpflichtige Löhne",
            report.wageSummary.male.nonUvgPremium !== "0.00" ? `- ${formatCurrencyNumber(parseFloat(report.wageSummary.male.nonUvgPremium))}` : "-",
            report.wageSummary.female.nonUvgPremium !== "0.00" ? `- ${formatCurrencyNumber(parseFloat(report.wageSummary.female.nonUvgPremium))}` : "-"
          ],
          [
            `= Total UVG-Lohnsumme (bis ${uvgMaxIncomeFormatted})`,
            `= ${formatCurrencyNumber(parseFloat(report.wageSummary.male.uvgWage))}`,
            `= ${formatCurrencyNumber(parseFloat(report.wageSummary.female.uvgWage))}`
          ],
          [
            "",
            "",
            ""
          ],
          [
            "UVGO-Lohnsummen Personen 70+ (BU)",
            formatCurrencyNumber(parseFloat(report.wageSummary.male.uvgo70Plus_BU)),
            formatCurrencyNumber(parseFloat(report.wageSummary.female.uvgo70Plus_BU))
          ],
          [
            "UVGO-Lohnsummen Personen 70+ (NBU)",
            formatCurrencyNumber(parseFloat(report.wageSummary.male.uvgo70Plus_NBU)),
            formatCurrencyNumber(parseFloat(report.wageSummary.female.uvgo70Plus_NBU))
          ]
        ];
        
        pdf.addTable(
          ["Kategorie", "Lohn Männer", "Lohn Frauen"],
          wageSummaryRows,
          { compact: true, columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } } }
        );
      }

      pdf.addFooter(`Erstellt am ${formatDate(new Date())} - ${company.name}`);

      const pdfBlob = pdf.getBlob();
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Jahresabrechnung_Lohnsummen_${year}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DEBUG: Inspect PDF form fields
  app.get("/api/pdf/inspect-form-fields", async (req, res) => {
    try {
      const fieldNames = await inspectFormFields();
      res.json({ fieldNames });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate Lohnausweise for selected employees
  app.post("/api/pdf/lohnausweise-selected", async (req, res) => {
    try {
      const { employeeIds, year } = req.body;

      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ error: "employeeIds array is required" });
      }

      if (!year) {
        return res.status(400).json({ error: "Invalid year" });
      }

      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const payments = await req.storage.getPayrollPayments(year);
      
      // Import PDFDocument for merging
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();

      // Generate Lohnausweis for each selected employee
      for (let i = 0; i < employeeIds.length; i++) {
        const employeeId = employeeIds[i];
        const employee = await req.storage.getEmployee(employeeId);
        
        if (!employee) {
          continue; // Skip if employee not found
        }

        const employeePayments = payments.filter((p: any) => p.employee.id === employeeId);

        // Calculate totals - get full payment details including deductions
        let totalGross = 0;
        let totalAHV = 0;
        let totalALV = 0;
        let totalSUVA = 0;
        let totalBVG = 0;
        let totalTax = 0;
        let totalOther = 0;

        for (const payment of employeePayments) {
          totalGross += Number(payment.grossSalary);
          
          // Get full payment details with deductions
          const fullPayment = await req.storage.getPayrollPayment(payment.id);
          if (fullPayment && fullPayment.deductions) {
            fullPayment.deductions.forEach((d: any) => {
              const amount = Number(d.amount);
              if (d.type === "AHV") totalAHV += amount;
              else if (d.type === "ALV") totalALV += amount;
              else if (d.type === "SUVA" || d.type === "NBU") totalSUVA += amount;
              else if (d.type === "BVG") totalBVG += amount;
              else if (d.type === "Quellensteuer") totalTax += amount;
              else totalOther += amount;
            });
          }
        }

        const totalDeductions = totalAHV + totalALV + totalSUVA + totalBVG + totalTax + totalOther;
        const totalNet = totalGross - totalDeductions;

        // Prepare data for official Swiss form
        const formData: LohnausweisData = {
          // Header information
          ahvNumber: employee.ahvNumber,
          birthDate: formatDate(employee.birthDate),
          year: year.toString(),
          employmentFrom: `1.1.${year}`,
          employmentTo: `31.12.${year}`,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeAddress: formatAddressMultiline(employee.street, employee.postalCode, employee.city),
          
          // Salary information
          basicSalary: totalGross,
          mealAllowance: 0,
          carBenefit: 0,
          otherBenefits: 0,
          irregularPayments: 0,
          capitalPayments: 0,
          participationRights: 0,
          boardFees: 0,
          otherPayments: 0,
          grossSalary: totalGross,
          
          // Deductions
          socialInsurance: totalAHV + totalALV + totalSUVA,
          pensionOrdinary: totalBVG,
          pensionBuyIn: 0,
          netSalary: totalNet,
          taxWithheld: totalTax,
          
          // Expenses
          travelExpenses: 0,
          otherActualExpenses: 0,
          representationExpenses: 0,
          carExpenses: 0,
          otherFlatExpenses: employee.annualFlatExpenses ? Number(employee.annualFlatExpenses) : 0,
          trainingContributions: 0,
          
          // Employer information
          employerName: company.name,
          employerAddress: formatAddressMultiline(company.street, company.postalCode, company.city),
          employerPhone: '',
          issueDate: formatDate(new Date()),
        };

        // Fill the official Swiss form for this employee
        const pdfBytes = await fillLohnausweisForm(formData);
        const employeePdf = await PDFDocument.load(pdfBytes);
        
        // Copy pages to merged document
        const copiedPages = await mergedPdf.copyPages(employeePdf, employeePdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const buffer = Buffer.from(mergedPdfBytes);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Lohnausweise_Auswahl_${year}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pdf/lohnausweise-bulk", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);

      if (!year) {
        return res.status(400).json({ error: "Invalid year" });
      }

      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const allEmployees = await req.storage.getEmployees();
      const activeEmployees = allEmployees.filter((e: any) => e.isActive);

      if (activeEmployees.length === 0) {
        return res.status(404).json({ error: "No active employees found" });
      }

      const payments = await req.storage.getPayrollPayments(year);
      
      // Import PDFDocument for merging
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();

      // Generate Lohnausweis for each active employee
      for (let i = 0; i < activeEmployees.length; i++) {
        const employee = activeEmployees[i];
        const employeePayments = payments.filter((p: any) => p.employee.id === employee.id);

        // Calculate totals - get full payment details including deductions
        let totalGross = 0;
        let totalAHV = 0;
        let totalALV = 0;
        let totalSUVA = 0;
        let totalBVG = 0;
        let totalTax = 0;
        let totalOther = 0;

        for (const payment of employeePayments) {
          totalGross += Number(payment.grossSalary);
          
          // Get full payment details with deductions
          const fullPayment = await req.storage.getPayrollPayment(payment.id);
          if (fullPayment && fullPayment.deductions) {
            fullPayment.deductions.forEach((d: any) => {
              const amount = Number(d.amount);
              if (d.type === "AHV") totalAHV += amount;
              else if (d.type === "ALV") totalALV += amount;
              else if (d.type === "SUVA" || d.type === "NBU") totalSUVA += amount;
              else if (d.type === "BVG") totalBVG += amount;
              else if (d.type === "Quellensteuer") totalTax += amount;
              else totalOther += amount;
            });
          }
        }

        const totalDeductions = totalAHV + totalALV + totalSUVA + totalBVG + totalTax + totalOther;
        const totalNet = totalGross - totalDeductions;

        // Prepare data for official Swiss form
        const formData: LohnausweisData = {
          // Header information
          ahvNumber: employee.ahvNumber,
          birthDate: formatDate(employee.birthDate),
          year: year.toString(),
          employmentFrom: `1.1.${year}`,
          employmentTo: `31.12.${year}`,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeAddress: formatAddressMultiline(employee.street, employee.postalCode, employee.city),
          
          // Salary information
          basicSalary: totalGross,
          mealAllowance: 0,
          carBenefit: 0,
          otherBenefits: 0,
          irregularPayments: 0,
          capitalPayments: 0,
          participationRights: 0,
          boardFees: 0,
          otherPayments: 0,
          grossSalary: totalGross,
          
          // Deductions
          socialInsurance: totalAHV + totalALV + totalSUVA,
          pensionOrdinary: totalBVG,
          pensionBuyIn: 0,
          netSalary: totalNet,
          taxWithheld: totalTax,
          
          // Expenses
          travelExpenses: 0,
          otherActualExpenses: 0,
          representationExpenses: 0,
          carExpenses: 0,
          otherFlatExpenses: employee.annualFlatExpenses ? Number(employee.annualFlatExpenses) : 0,
          trainingContributions: 0,
          
          // Employer information
          employerName: company.name,
          employerAddress: formatAddressMultiline(company.street, company.postalCode, company.city),
          employerPhone: '',
          issueDate: formatDate(new Date()),
        };

        // Fill the official Swiss form for this employee
        const pdfBytes = await fillLohnausweisForm(formData);
        const employeePdf = await PDFDocument.load(pdfBytes);
        
        // Copy pages to merged document
        const copiedPages = await mergedPdf.copyPages(employeePdf, employeePdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const buffer = Buffer.from(mergedPdfBytes);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Lohnausweise_${year}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pdf/lohnausweis/:employeeId", async (req, res) => {
    try {
      const employeeId = req.params.employeeId;
      const year = parseInt(req.query.year as string);

      if (!year) {
        return res.status(400).json({ error: "Invalid year" });
      }

      const employee = await req.storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Get all payments for this employee in the year
      const payments = await req.storage.getPayrollPayments(year);
      const employeePayments = payments.filter((p: any) => p.employee.id === employeeId);

      // Calculate totals - get full payment details including deductions
      let totalGross = 0;
      let totalAHV = 0;
      let totalALV = 0;
      let totalSUVA = 0;
      let totalBVG = 0;
      let totalTax = 0;
      let totalOther = 0;

      for (const payment of employeePayments) {
        totalGross += Number(payment.grossSalary);
        
        // Get full payment details with deductions
        const fullPayment = await req.storage.getPayrollPayment(payment.id);
        if (fullPayment && fullPayment.deductions) {
          fullPayment.deductions.forEach((d: any) => {
            const amount = Number(d.amount);
            if (d.type === "AHV") totalAHV += amount;
            else if (d.type === "ALV") totalALV += amount;
            else if (d.type === "SUVA" || d.type === "NBU") totalSUVA += amount;
            else if (d.type === "BVG") totalBVG += amount;
            else if (d.type === "Quellensteuer") totalTax += amount;
            else totalOther += amount;
          });
        }
      }

      const totalDeductions = totalAHV + totalALV + totalSUVA + totalBVG + totalTax + totalOther;
      const totalNet = totalGross - totalDeductions;

      // Prepare data for official Swiss form
      const formData: LohnausweisData = {
        // Header information
        ahvNumber: employee.ahvNumber,
        birthDate: formatDate(employee.birthDate),
        year: year.toString(),
        employmentFrom: `1.1.${year}`,
        employmentTo: `31.12.${year}`,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeAddress: formatAddressMultiline(employee.street, employee.postalCode, employee.city),
        
        // Salary information
        basicSalary: totalGross,
        mealAllowance: 0,
        carBenefit: 0,
        otherBenefits: 0,
        irregularPayments: 0,
        capitalPayments: 0,
        participationRights: 0,
        boardFees: 0,
        otherPayments: 0,
        grossSalary: totalGross,
        
        // Deductions
        socialInsurance: totalAHV + totalALV + totalSUVA,
        pensionOrdinary: totalBVG,
        pensionBuyIn: 0,
        netSalary: totalNet,
        taxWithheld: totalTax,
        
        // Expenses
        travelExpenses: 0,
        otherActualExpenses: 0,
        representationExpenses: 0,
        carExpenses: 0,
        otherFlatExpenses: Number(employee.annualFlatExpenses || 0), // Ziffer 13.2.3
        trainingContributions: 0,
        
        // Employer information
        employerName: company.name,
        employerAddress: formatAddressMultiline(company.street, company.postalCode, company.city),
        employerPhone: '', // Phone not tracked in current schema
        issueDate: formatDate(new Date()),
      };

      // Fill the official Swiss form
      const pdfBytes = await fillLohnausweisForm(formData);
      const buffer = Buffer.from(pdfBytes);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Lohnausweis_${year}_${employee.lastName}_${employee.firstName}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // PAYROLL ITEM TYPES (Lohnarten)
  // ============================================================================
  app.get("/api/payroll-item-types", async (req, res) => {
    try {
      const itemTypes = await req.storage.getPayrollItemTypes();
      res.json(itemTypes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/payroll-item-types/:id", async (req, res) => {
    try {
      const itemType = await req.storage.getPayrollItemType(req.params.id);
      if (!itemType) {
        return res.status(404).json({ error: "Payroll item type not found" });
      }
      res.json(itemType);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll-item-types", async (req, res) => {
    try {
      const validatedData = insertPayrollItemTypeSchema.parse(req.body);
      const itemType = await req.storage.createPayrollItemType(validatedData);
      res.status(201).json(itemType);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.toString() });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/payroll-item-types/:id", async (req, res) => {
    try {
      const validatedData = insertPayrollItemTypeSchema.parse(req.body);
      const itemType = await req.storage.updatePayrollItemType(req.params.id, validatedData);
      res.json(itemType);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.toString() });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/payroll-item-types/:id", async (req, res) => {
    try {
      await req.storage.deletePayrollItemType(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // PAYROLL TEMPLATES
  // ============================================================================
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await req.storage.getPayrollTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await req.storage.getPayrollTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertPayrollTemplateSchema.parse(req.body);
      const template = await req.storage.createPayrollTemplate(validatedData);
      res.status(201).json(template);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.toString() });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/templates/:id", async (req, res) => {
    try {
      const validatedData = insertPayrollTemplateSchema.parse(req.body);
      const template = await req.storage.updatePayrollTemplate(req.params.id, validatedData);
      res.json(template);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.toString() });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      await req.storage.deletePayrollTemplate(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // EXCEL/CSV EXPORTS
  // ============================================================================
  app.get("/api/excel/monthly-report", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string);
      const format = (req.query.format as string) || "xlsx";

      if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }

      const report = await req.storage.getMonthlyReport(year, month);
      const company = await req.storage.getCompany();

      const monthNames = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
      ];

      const excel = new ExcelGenerator();

      const columns = [
        { header: "Mitarbeiter", key: "employeeName", width: 25 },
        { header: "Anzahl Auszahlungen", key: "paymentsCount", width: 20 },
        { header: "Bruttolohn (CHF)", key: "totalGrossSalary", width: 18 },
        { header: "Abzüge (CHF)", key: "totalDeductions", width: 18 },
        { header: "Nettolohn (CHF)", key: "totalNetSalary", width: 18 },
      ];

      const data = (report.employees || []).map((emp: any) => ({
        employeeName: emp.employeeName,
        paymentsCount: emp.paymentsCount,
        totalGrossSalary: formatExcelCurrency(parseFloat(emp.totalGrossSalary)),
        totalDeductions: formatExcelCurrency(parseFloat(emp.totalDeductions)),
        totalNetSalary: formatExcelCurrency(parseFloat(emp.totalNetSalary)),
      }));

      // Add totals row
      data.push({
        employeeName: "TOTAL",
        paymentsCount: report.totalPayments,
        totalGrossSalary: formatExcelCurrency(parseFloat(report.totals.grossSalary)),
        totalDeductions: formatExcelCurrency(parseFloat(report.totals.deductions)),
        totalNetSalary: formatExcelCurrency(parseFloat(report.totals.netSalary)),
      });

      excel.addWorksheet(`${monthNames[month - 1]} ${year}`, columns, data);

      let buffer: Buffer;
      let contentType: string;
      let filename: string;

      if (format === "csv") {
        buffer = excel.getCSVBuffer();
        contentType = "text/csv";
        filename = `Monatsabrechnung_${year}_${month.toString().padStart(2, '0')}.csv`;
      } else {
        buffer = excel.getBuffer();
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `Monatsabrechnung_${year}_${month.toString().padStart(2, '0')}.xlsx`;
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/excel/yearly-report", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      const format = (req.query.format as string) || "xlsx";

      if (!year) {
        return res.status(400).json({ error: "Invalid year" });
      }

      const report = await req.storage.getYearlyReport(year);
      const company = await req.storage.getCompany();

      const excel = new ExcelGenerator();

      const columns = [
        { header: "Monat", key: "month", width: 15 },
        { header: "Anzahl Auszahlungen", key: "paymentsCount", width: 20 },
        { header: "Bruttolohn (CHF)", key: "grossSalary", width: 18 },
        { header: "Abzüge (CHF)", key: "deductions", width: 18 },
        { header: "Nettolohn (CHF)", key: "netSalary", width: 18 },
      ];

      // Filter out months with no payments
      const monthsWithPayments = (report.months || []).filter((m: any) => m.paymentsCount > 0);

      const data = monthsWithPayments.map((m: any) => ({
        month: m.monthName,
        paymentsCount: m.paymentsCount,
        grossSalary: formatExcelCurrency(parseFloat(m.grossSalary)),
        deductions: formatExcelCurrency(parseFloat(m.deductions)),
        netSalary: formatExcelCurrency(parseFloat(m.netSalary)),
      }));

      // Add totals row
      data.push({
        month: "TOTAL",
        paymentsCount: report.totals.paymentsCount,
        grossSalary: formatExcelCurrency(parseFloat(report.totals.grossSalary)),
        deductions: formatExcelCurrency(parseFloat(report.totals.deductions)),
        netSalary: formatExcelCurrency(parseFloat(report.totals.netSalary)),
      });

      excel.addWorksheet(`Jahresabrechnung ${year}`, columns, data);

      // Add employee summary worksheet
      if (report.employeeSummary && report.employeeSummary.length > 0) {
        const employeeColumns = [
          { header: "AHV-Nr.", key: "ahvNumber", width: 18 },
          { header: "Geb.datum", key: "birthDate", width: 12 },
          { header: "Vorname", key: "firstName", width: 15 },
          { header: "Nachname", key: "lastName", width: 15 },
          { header: "Zeitraum", key: "period", width: 12 },
          { header: "AHV-Lohn (CHF)", key: "ahvWage", width: 16 },
          { header: "ALV-Lohn (CHF)", key: "alvWage", width: 16 },
          { header: "ALV1-Lohn (CHF)", key: "alv1Wage", width: 16 },
          { header: "ALV2-Lohn (CHF)", key: "alv2Wage", width: 16 },
          { header: "NBU-Lohn (CHF)", key: "nbuWage", width: 16 },
          { header: "Kindergeld (CHF)", key: "childAllowance", width: 16 },
        ];

        const employeeData = report.employeeSummary.map((emp: any) => ({
          ahvNumber: emp.ahvNumber,
          birthDate: formatExcelDate(emp.birthDate),
          firstName: emp.firstName,
          lastName: emp.lastName,
          period: `${emp.employedFrom}-${emp.employedTo}`,
          ahvWage: formatExcelCurrency(parseFloat(emp.ahvWage)),
          alvWage: formatExcelCurrency(parseFloat(emp.alvWage)),
          alv1Wage: formatExcelCurrency(parseFloat(emp.alv1Wage)),
          alv2Wage: formatExcelCurrency(parseFloat(emp.alv2Wage)),
          nbuWage: formatExcelCurrency(parseFloat(emp.nbuWage)),
          childAllowance: formatExcelCurrency(parseFloat(emp.childAllowance)),
        }));

        excel.addWorksheet(`Mitarbeiter-Übersicht`, employeeColumns, employeeData);
      }

      // Add child allowance summary worksheet
      if (report.childAllowanceEmployees && report.childAllowanceEmployees.length > 0) {
        const childAllowanceColumns = [
          { header: "AHV-Nr.", key: "ahvNumber", width: 18 },
          { header: "Geb.datum", key: "birthDate", width: 12 },
          { header: "Vorname", key: "firstName", width: 15 },
          { header: "Nachname", key: "lastName", width: 15 },
          { header: "Zeitraum", key: "period", width: 12 },
          { header: "Kindergeld (CHF)", key: "childAllowance", width: 16 },
        ];

        const childAllowanceData = report.childAllowanceEmployees.map((emp: any) => ({
          ahvNumber: emp.ahvNumber,
          birthDate: formatExcelDate(emp.birthDate),
          firstName: emp.firstName,
          lastName: emp.lastName,
          period: `${emp.employedFrom}-${emp.employedTo}`,
          childAllowance: formatExcelCurrency(parseFloat(emp.childAllowance)),
        }));

        // Calculate total
        const totalChildAllowance = report.childAllowanceEmployees.reduce(
          (sum: number, emp: any) => sum + parseFloat(emp.childAllowance),
          0
        );

        // Add total row
        childAllowanceData.push({
          ahvNumber: "",
          birthDate: "",
          firstName: "",
          lastName: "",
          period: "TOTAL",
          childAllowance: formatExcelCurrency(totalChildAllowance),
        });

        excel.addWorksheet(`Kinderzulagen`, childAllowanceColumns, childAllowanceData);
      }

      // Add wage summary by gender worksheet
      if (report.wageSummary) {
        const uvgMaxIncomeFormatted = formatExcelCurrency(parseFloat(report.uvgMaxIncome));
        
        const wageSummaryColumns = [
          { header: "Kategorie", key: "category", width: 60 },
          { header: "Lohn Männer (CHF)", key: "male", width: 20 },
          { header: "Lohn Frauen (CHF)", key: "female", width: 20 },
        ];

        const wageSummaryData = [
          {
            category: "AHV-pflichtige Löhne gemäss Lohnbescheinigung",
            male: formatExcelCurrency(parseFloat(report.wageSummary.male.ahvSubject)),
            female: formatExcelCurrency(parseFloat(report.wageSummary.female.ahvSubject)),
          },
          {
            category: "+ Nicht AHV-pflichtige Löhne (Rentner, etc.)",
            male: report.wageSummary.male.nonAhvSubject !== "0.00" ? `+ ${formatExcelCurrency(parseFloat(report.wageSummary.male.nonAhvSubject))}` : "-",
            female: report.wageSummary.female.nonAhvSubject !== "0.00" ? `+ ${formatExcelCurrency(parseFloat(report.wageSummary.female.nonAhvSubject))}` : "-",
          },
          {
            category: "= Total massgebende Lohnsummen",
            male: `= ${formatExcelCurrency(parseFloat(report.wageSummary.male.totalRelevant))}`,
            female: `= ${formatExcelCurrency(parseFloat(report.wageSummary.female.totalRelevant))}`,
          },
          {
            category: `Total Überschusslohnsumme (ab ${uvgMaxIncomeFormatted})`,
            male: `= ${formatExcelCurrency(parseFloat(report.wageSummary.male.excessWage))}`,
            female: `= ${formatExcelCurrency(parseFloat(report.wageSummary.female.excessWage))}`,
          },
          {
            category: "- nicht UVG-prämienpflichtige Löhne",
            male: report.wageSummary.male.nonUvgPremium !== "0.00" ? `- ${formatExcelCurrency(parseFloat(report.wageSummary.male.nonUvgPremium))}` : "-",
            female: report.wageSummary.female.nonUvgPremium !== "0.00" ? `- ${formatExcelCurrency(parseFloat(report.wageSummary.female.nonUvgPremium))}` : "-",
          },
          {
            category: `= Total UVG-Lohnsumme (bis ${uvgMaxIncomeFormatted})`,
            male: `= ${formatExcelCurrency(parseFloat(report.wageSummary.male.uvgWage))}`,
            female: `= ${formatExcelCurrency(parseFloat(report.wageSummary.female.uvgWage))}`,
          },
          {
            category: "",
            male: "",
            female: "",
          },
          {
            category: "UVGO-Lohnsummen Personen 70+ (BU)",
            male: formatExcelCurrency(parseFloat(report.wageSummary.male.uvgo70Plus_BU)),
            female: formatExcelCurrency(parseFloat(report.wageSummary.female.uvgo70Plus_BU)),
          },
          {
            category: "UVGO-Lohnsummen Personen 70+ (NBU)",
            male: formatExcelCurrency(parseFloat(report.wageSummary.male.uvgo70Plus_NBU)),
            female: formatExcelCurrency(parseFloat(report.wageSummary.female.uvgo70Plus_NBU)),
          },
        ];

        excel.addWorksheet(`Lohnsummen-Zusammenstellung`, wageSummaryColumns, wageSummaryData);
      }

      let buffer: Buffer;
      let contentType: string;
      let filename: string;

      if (format === "csv") {
        buffer = excel.getCSVBuffer();
        contentType = "text/csv";
        filename = `Jahresabrechnung_${year}.csv`;
      } else {
        buffer = excel.getBuffer();
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `Jahresabrechnung_${year}.xlsx`;
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // QCS PDF IMPORT
  // ============================================================================
  
  // Configure multer for file upload
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    },
  });

  app.post("/api/qcs/import-payroll", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      // Parse PDF
      const pdfData = await parseQCSPayrollPDF(req.file.buffer);
      
      // Get company
      const company = await req.storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found. Please configure company settings first." });
      }

      // Find employee by AHV number
      let employee = await req.storage.getEmployeeByAhvNumber(pdfData.ahvNumber);
      
      const validation: {
        employeeExists: boolean;
        employeeCreated: boolean;
        employeeUpdated: boolean;
        nameMatches: boolean;
        bvgMatches: boolean;
        employeeId: string | null;
        changes: string[];
      } = {
        employeeExists: !!employee,
        employeeCreated: false,
        employeeUpdated: false,
        nameMatches: false,
        bvgMatches: false,
        employeeId: employee?.id || null,
        changes: [],
      };

      if (employee) {
        // Employee exists - check name and BVG rate
        const nameMatches = 
          employee.firstName.toLowerCase() === pdfData.firstName.toLowerCase() &&
          employee.lastName.toLowerCase() === pdfData.lastName.toLowerCase();
        
        validation.nameMatches = nameMatches;
        
        // Check if BVG percentage matches (tolerance of 0.01%)
        const bvgMatches = employee.bvgDeductionPercentage
          ? Math.abs(parseFloat(employee.bvgDeductionPercentage) - pdfData.bvgRate) < 0.01
          : false;
        
        validation.bvgMatches = bvgMatches;
        
        // Update employee if needed
        const updates: any = {};
        
        if (!nameMatches) {
          updates.firstName = pdfData.firstName;
          updates.lastName = pdfData.lastName;
          validation.changes.push(`Name geändert von "${employee.firstName} ${employee.lastName}" zu "${pdfData.firstName} ${pdfData.lastName}"`);
        }
        
        if (!bvgMatches) {
          updates.bvgDeductionPercentage = pdfData.bvgRate.toFixed(4);
          validation.changes.push(`BVG-Prozentsatz geändert von ${employee.bvgDeductionPercentage}% zu ${pdfData.bvgRate}%`);
        }
        
        // Check and update AHV checkbox based on PDF
        const shouldHaveAhv = pdfData.ahvAmount > 0;
        if (employee.hasAhv !== shouldHaveAhv) {
          updates.hasAhv = shouldHaveAhv;
          validation.changes.push(shouldHaveAhv ? "AHV Häkchen aktiviert" : "AHV Häkchen deaktiviert");
        }
        
        // Check and update ALV checkbox based on PDF
        const shouldHaveAlv = pdfData.alvAmount > 0;
        if (employee.hasAlv !== shouldHaveAlv) {
          updates.hasAlv = shouldHaveAlv;
          validation.changes.push(shouldHaveAlv ? "ALV Häkchen aktiviert" : "ALV Häkchen deaktiviert");
        }
        
        // Check and update NBU/UVG checkbox based on PDF
        const shouldHaveNbu = pdfData.uvgAmount > 0;
        if (employee.isNbuInsured !== shouldHaveNbu) {
          updates.isNbuInsured = shouldHaveNbu;
          validation.changes.push(shouldHaveNbu ? "NBU/UVG Häkchen aktiviert" : "NBU/UVG Häkchen deaktiviert");
        }
        
        // Update KTG GAV percentage if needed
        const ktgMatches = employee.ktgGavPercentage
          ? Math.abs(parseFloat(employee.ktgGavPercentage) - pdfData.ktgGavRate) < 0.01
          : pdfData.ktgGavRate === 0;
        
        if (!ktgMatches) {
          updates.ktgGavPercentage = pdfData.ktgGavRate.toFixed(4);
          validation.changes.push(`KTG GAV Prozentsatz geändert zu ${pdfData.ktgGavRate}%`);
        }
        
        // Check and update KTG GAV checkbox based on PDF
        const shouldHaveKtgGav = pdfData.ktgGavAmount > 0;
        if (employee.hasKtgGav !== shouldHaveKtgGav) {
          updates.hasKtgGav = shouldHaveKtgGav;
          validation.changes.push(shouldHaveKtgGav ? "KTG GAV Häkchen aktiviert" : "KTG GAV Häkchen deaktiviert");
        }
        
        // Update Berufsbeitrag GAV percentage if needed
        const berufsbeitragMatches = employee.berufsbeitragGavPercentage
          ? Math.abs(parseFloat(employee.berufsbeitragGavPercentage) - pdfData.berufsbeitragGavRate) < 0.01
          : pdfData.berufsbeitragGavRate === 0;
        
        if (!berufsbeitragMatches) {
          updates.berufsbeitragGavPercentage = pdfData.berufsbeitragGavRate.toFixed(4);
          validation.changes.push(`Berufsbeitrag GAV Prozentsatz geändert zu ${pdfData.berufsbeitragGavRate}%`);
        }
        
        // Check and update Berufsbeitrag GAV checkbox based on PDF
        const shouldHaveBerufsbeitragGav = pdfData.berufsbeitragGavAmount > 0;
        if (employee.hasBerufsbeitragGav !== shouldHaveBerufsbeitragGav) {
          updates.hasBerufsbeitragGav = shouldHaveBerufsbeitragGav;
          validation.changes.push(shouldHaveBerufsbeitragGav ? "Berufsbeitrag GAV Häkchen aktiviert" : "Berufsbeitrag GAV Häkchen deaktiviert");
        }
        
        if (Object.keys(updates).length > 0) {
          employee = await req.storage.updateEmployee(employee.id, updates);
          validation.employeeUpdated = true;
        }
      } else {
        // Create new employee
        const monthNum = getMonthNumber(pdfData.month);
        const entryDate = new Date(pdfData.year, monthNum - 1, 1);
        
        const newEmployeeData = {
          companyId: company.id,
          firstName: pdfData.firstName,
          lastName: pdfData.lastName,
          gender: "Mann", // Default - can be updated later
          birthDate: "1990-01-01", // Default - should be updated later
          street: pdfData.address.street,
          postalCode: pdfData.address.postalCode,
          city: pdfData.address.city,
          email: `${pdfData.firstName.toLowerCase()}.${pdfData.lastName.toLowerCase()}@example.com`, // Placeholder
          entryDate: entryDate.toISOString().split('T')[0],
          ahvNumber: pdfData.ahvNumber,
          hasAccidentInsurance: true,
          hasAhv: pdfData.ahvAmount > 0, // Set flag if amount present in PDF
          hasAlv: pdfData.alvAmount > 0, // Set flag if amount present in PDF
          isNbuInsured: pdfData.uvgAmount > 0, // Set flag if amount present in PDF
          isRentner: false,
          hasKtgGav: pdfData.ktgGavAmount > 0, // Set flag if amount present in PDF
          hasBerufsbeitragGav: pdfData.berufsbeitragGavAmount > 0, // Set flag if amount present in PDF
          bankName: "Bank (bitte aktualisieren)",
          bankIban: "CH00 0000 0000 0000 0000 0",
          hourlyRate: pdfData.hourlyRate.toFixed(2),
          bvgDeductionPercentage: pdfData.bvgRate.toFixed(4),
          ktgGavPercentage: pdfData.ktgGavRate > 0 ? pdfData.ktgGavRate.toFixed(4) : "0.0000",
          berufsbeitragGavPercentage: pdfData.berufsbeitragGavRate > 0 ? pdfData.berufsbeitragGavRate.toFixed(4) : "0.0000",
          isActive: true,
        };
        
        employee = await req.storage.createEmployee(newEmployeeData);
        validation.employeeCreated = true;
        validation.employeeId = employee.id;
        validation.nameMatches = true;
        validation.bvgMatches = true;
        validation.changes.push("Neuer Mitarbeiter erstellt");
      }

      // Create payroll payment
      const monthNum = getMonthNumber(pdfData.month);
      
      // Helper function to convert Swiss date format (DD.MM.YYYY) to ISO format (YYYY-MM-DD)
      const convertSwissDateToISO = (swissDate: string): string => {
        const [day, month, year] = swissDate.split('.');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };
      
      // Use extracted dates from PDF if available, otherwise fallback to full month
      let periodStart: string;
      let periodEnd: string;
      
      if (pdfData.periodStartDate && pdfData.periodEndDate) {
        periodStart = convertSwissDateToISO(pdfData.periodStartDate);
        periodEnd = convertSwissDateToISO(pdfData.periodEndDate);
      } else {
        // Fallback to full month if no dates in PDF
        const startDate = new Date(pdfData.year, monthNum - 1, 1);
        const endDate = new Date(pdfData.year, monthNum, 0);
        periodStart = startDate.toISOString().split('T')[0];
        periodEnd = endDate.toISOString().split('T')[0];
      }
      
      const payrollData = {
        employeeId: employee!.id,
        periodStart,
        periodEnd,
        paymentDate: periodEnd, // Set payment date to end of period
        paymentMonth: monthNum,
        paymentYear: pdfData.year,
        isLocked: false,
      };
      
      // Prepare payroll items (Lohn + all allowances/supplements)
      const payrollItems = [];
      
      // Add base wage item (use code "02" for Stundenlohn)
      payrollItems.push({
        type: "02",
        description: "Lohn",
        hours: pdfData.hoursWorked.toFixed(2),
        hourlyRate: pdfData.hourlyRate.toFixed(2),
        amount: pdfData.wageAmount.toFixed(2),
      });
      
      // Add Sunday supplement if applicable (use code "06" for Zulagen)
      if (pdfData.sundayAmount > 0) {
        payrollItems.push({
          type: "06",
          description: "Sonntagszulage",
          hours: pdfData.sundayHours.toFixed(2),
          hourlyRate: pdfData.sundaySupplement.toFixed(2),
          amount: pdfData.sundayAmount.toFixed(2),
        });
      }
      
      // Add 13. Monatslohn if applicable (use code "04")
      if (pdfData.thirteenthMonthAmount > 0) {
        payrollItems.push({
          type: "04",
          description: "13. Monatslohn",
          hours: pdfData.thirteenthMonthHours.toFixed(2),
          hourlyRate: pdfData.thirteenthMonthRate.toFixed(2),
          amount: pdfData.thirteenthMonthAmount.toFixed(2),
        });
      }
      
      // Add Ferienentschädigung if applicable (use code "07")
      if (pdfData.vacationCompensationAmount > 0) {
        payrollItems.push({
          type: "07",
          description: "Ferienentschädigung",
          hours: pdfData.vacationCompensationHours.toFixed(2),
          hourlyRate: pdfData.vacationCompensationRate.toFixed(2),
          amount: pdfData.vacationCompensationAmount.toFixed(2),
        });
      }
      
      // Add Ferien if applicable (use code "14")
      if (pdfData.vacationAmount > 0) {
        payrollItems.push({
          type: "14",
          description: "Ferien",
          hours: pdfData.vacationHours.toFixed(2),
          hourlyRate: pdfData.vacationRate.toFixed(2),
          amount: pdfData.vacationAmount.toFixed(2),
        });
      }
      
      // Add Abend/Nachtzulage if applicable (use code "15")
      if (pdfData.eveningNightAmount > 0) {
        payrollItems.push({
          type: "15",
          description: "Abend/Nachtzulage",
          hours: pdfData.eveningNightHours.toFixed(2),
          hourlyRate: pdfData.eveningNightRate.toFixed(2),
          amount: pdfData.eveningNightAmount.toFixed(2),
        });
      }
      
      // Add Sonntags/Ferientagszulage if applicable (use code "16")
      if (pdfData.sundayHolidayAmount > 0) {
        payrollItems.push({
          type: "16",
          description: "Sonntags/Ferientagszulage",
          hours: pdfData.sundayHolidayHours.toFixed(2),
          hourlyRate: pdfData.sundayHolidayRate.toFixed(2),
          amount: pdfData.sundayHolidayAmount.toFixed(2),
        });
      }
      
      // Preview deductions to get the correct deduction list
      const deductionsList = await req.storage.previewDeductions(
        employee!.id,
        monthNum,
        pdfData.year,
        payrollItems
      );
      
      // Create payroll payment with items and deductions
      const payrollPayment = await req.storage.createPayrollPayment(payrollData, payrollItems, deductionsList);
      
      // Get the full payroll payment with all calculations
      const fullPayrollPayment = await req.storage.getPayrollPayment(payrollPayment.id);
      
      // Validate payment amount (tolerance of 0.05 CHF for rounding)
      const calculatedAmount = fullPayrollPayment?.totalNetSalary ? parseFloat(fullPayrollPayment.totalNetSalary) : 0;
      const pdfAmount = pdfData.paymentAmount;
      const amountDifference = Math.abs(calculatedAmount - pdfAmount);
      const amountMatches = amountDifference <= 0.05;
      
      res.json({
        success: true,
        validation: {
          ...validation,
          paymentValidation: {
            pdfAmount: pdfAmount.toFixed(2),
            calculatedAmount: calculatedAmount.toFixed(2),
            difference: amountDifference.toFixed(2),
            matches: amountMatches,
          },
        },
        data: {
          employee: {
            id: employee!.id,
            name: `${employee!.firstName} ${employee!.lastName}`,
            ahvNumber: employee!.ahvNumber,
          },
          payrollPayment: {
            id: payrollPayment.id,
            period: pdfData.month + ' ' + pdfData.year,
            grossSalary: pdfData.grossSalary.toFixed(2),
            netSalary: calculatedAmount.toFixed(2),
          },
        },
        pdfData,
      });
    } catch (error: any) {
      console.error('QCS PDF Import Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
