import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertEmployeeSchema, insertPayrollPaymentSchema, insertPayrollItemSchema, insertPayrollItemTypeSchema, insertDeductionSchema, insertPayrollTemplateSchema, insertPayrollItemWithoutPaymentIdSchema, insertDeductionWithoutPaymentIdSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { PDFGenerator, formatCurrency, formatDate, formatPercentage, formatAddress, formatAddressMultiline } from "./utils/pdf-generator";
import { ExcelGenerator, formatExcelCurrency, formatExcelDate } from "./utils/excel-generator";
import { fillLohnausweisForm, inspectFormFields, type LohnausweisData } from "./utils/fill-lohnausweis-form";
import { sendPayslipEmail } from "./services/email";
import { sendPayslipEmailViaOutlook, sendLohnausweisEmailViaOutlook } from "./services/email-outlook";

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
      // Allow partial updates
      const partialSchema = insertEmployeeSchema.partial();
      const result = partialSchema.safeParse(req.body);
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

  // Get cumulative ALV data for an employee in a year (for ALV Höchstlohn calculation)
  app.get("/api/payroll/cumulative-alv", async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const excludePaymentId = req.query.excludePaymentId as string | undefined;

      if (!employeeId || !year) {
        return res.status(400).json({ error: "employeeId and year are required" });
      }

      const data = await storage.getCumulativeAlvData(employeeId, year, excludePaymentId);
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

      const data = await storage.getCumulativeNbuData(employeeId, year, excludePaymentId);
      res.json(data);
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

      const payment = await storage.createPayrollPayment(
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

      const deductions = await storage.previewDeductions(
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
      const payment = await storage.lockPayrollPayment(req.params.id);
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payroll/payments/:id/unlock", async (req, res) => {
    try {
      const payment = await storage.unlockPayrollPayment(req.params.id);
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

      const payment = await storage.updatePayrollPayment(
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
      await storage.deletePayrollPayment(req.params.id);
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

      const company = await storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      if (company.payrollSenderEmail) {
        console.log('[Send Lohnausweise] Using configured sender email:', company.payrollSenderEmail);
        console.log('[Send Lohnausweise] Note: Outlook integration will send from the connected account');
      }

      const results = [];
      const payments = await storage.getPayrollPayments(yearNum);

      for (const employeeId of employeeIds) {
        try {
          console.log('[Send Lohnausweise] Processing employee:', employeeId);
          
          const employee = await storage.getEmployee(employeeId);
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
            
            const fullPayment = await storage.getPayrollPayment(payment.id);
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
      const company = await storage.getCompany();
      if (company?.payrollSenderEmail) {
        console.log('[Send Payslips] Using configured sender email:', company.payrollSenderEmail);
        console.log('[Send Payslips] Note: Outlook integration will send from the connected account');
      }

      const results = [];
      const payrollItemTypes = await storage.getPayrollItemTypes();

      for (const paymentId of paymentIds) {
        try {
          console.log('[Send Payslips] Processing payment:', paymentId);
          
          // Get payment details
          const payment = await storage.getPayrollPayment(paymentId);
          if (!payment) {
            console.log('[Send Payslips] Payment not found:', paymentId);
            results.push({ paymentId, success: false, error: "Payment not found" });
            continue;
          }

          // Get employee details
          const employee = await storage.getEmployee(payment.employee.id);
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
          pdf.addPayrollTitle("Lohnabrechnung", `${monthName} ${payment.paymentYear}`);
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
          pdf.addFooter(`Periode: ${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)} | AHV-Nr: ${employee.ahvNumber} | Auszahlung: ${formatDate(payment.paymentDate)}`);

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

  app.get("/api/reports/employee-payroll-overview", async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const year = parseInt(req.query.year as string);

      if (!employeeId || !year) {
        return res.status(400).json({ error: "Invalid employee ID or year" });
      }

      const overview = await storage.getEmployeePayrollOverview(employeeId, year);
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

      const company = await storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Load payroll item types for name mapping
      const payrollItemTypes = await storage.getPayrollItemTypes();

      // Month names in German
      const monthNames = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
      ];

      const pdf = new PDFGenerator();
      let isFirstPayment = true;

      // Generate PDF for each payment
      for (const paymentId of paymentIds) {
        const payment = await storage.getPayrollPayment(paymentId);
        if (!payment) {
          continue; // Skip if payment not found
        }

        const employee = await storage.getEmployee(payment.employee.id);
        if (!employee) {
          continue; // Skip if employee not found
        }

        // Add page break for subsequent payments
        if (!isFirstPayment) {
          pdf.addPageBreak();
        }
        isFirstPayment = false;

        const monthName = monthNames[payment.paymentMonth - 1];

        // Add title on the left
        pdf.addPayrollTitle("Lohnabrechnung", `${monthName} ${payment.paymentYear}`);
        
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

        // Add footer with additional info
        pdf.addFooter(`Periode: ${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)} | AHV-Nr: ${employee.ahvNumber} | Auszahlung: ${formatDate(payment.paymentDate)}`);
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

  app.get("/api/pdf/payroll/:id", async (req, res) => {
    try {
      const payment = await storage.getPayrollPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const employee = await storage.getEmployee(payment.employee.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const company = await storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Load payroll item types for name mapping
      const payrollItemTypes = await storage.getPayrollItemTypes();

      // Month names in German
      const monthNames = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
      ];
      
      const monthName = monthNames[payment.paymentMonth - 1];

      const pdf = new PDFGenerator();
      
      // Add title on the left
      pdf.addPayrollTitle("Lohnabrechnung", `${monthName} ${payment.paymentYear}`);
      
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

      // Add footer with additional info
      pdf.addFooter(`Periode: ${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)} | AHV-Nr: ${employee.ahvNumber} | Auszahlung: ${formatDate(payment.paymentDate)}`);

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

      const report = await storage.getMonthlyReport(year, month);
      const company = await storage.getCompany();
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
          const employeeData = await storage.getEmployee(emp.employeeId);
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

      const report = await storage.getYearlyReport(year);
      const company = await storage.getCompany();
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
          monthRows
        );
      }

      // Add totals section
      pdf.addSection("Jahresgesamtsummen");
      pdf.addPayrollLine("Anzahl Auszahlungen", report.totals.paymentsCount.toString(), false, false);
      pdf.addPayrollLine("Gesamtbruttolohn", formatCurrency(parseFloat(report.totals.grossSalary)), false, false);
      pdf.addPayrollLine("Gesamt Abzüge", formatCurrency(parseFloat(report.totals.deductions)), false, false);
      pdf.addSeparatorLine();
      pdf.addPayrollLine("Gesamtnettolohn", formatCurrency(parseFloat(report.totals.netSalary)), true, false);

      // Add wage summary by gender section
      if (report.wageSummary) {
        const uvgMaxIncomeFormatted = formatCurrency(parseFloat(report.uvgMaxIncome));
        
        pdf.addSection("Lohnsummen-Zusammenstellung nach Geschlecht");
        pdf.addText("Hinweis", "Höchstlohn pro Person und Jahr CHF 300'000");
        
        const wageSummaryRows = [
          [
            "AHV-pflichtige Löhne gemäss Lohnbescheinigung",
            formatCurrency(parseFloat(report.wageSummary.male.ahvSubject)),
            formatCurrency(parseFloat(report.wageSummary.female.ahvSubject))
          ],
          [
            "+ Nicht AHV-pflichtige Löhne",
            report.wageSummary.male.nonAhvSubject !== "0.00" ? `+ ${formatCurrency(parseFloat(report.wageSummary.male.nonAhvSubject))}` : "-",
            report.wageSummary.female.nonAhvSubject !== "0.00" ? `+ ${formatCurrency(parseFloat(report.wageSummary.female.nonAhvSubject))}` : "-"
          ],
          [
            "= Total massgebende Lohnsummen",
            `= ${formatCurrency(parseFloat(report.wageSummary.male.totalRelevant))}`,
            `= ${formatCurrency(parseFloat(report.wageSummary.female.totalRelevant))}`
          ],
          [
            `Total Überschusslohnsumme (ab ${uvgMaxIncomeFormatted})`,
            `= ${formatCurrency(parseFloat(report.wageSummary.male.excessWage))}`,
            `= ${formatCurrency(parseFloat(report.wageSummary.female.excessWage))}`
          ],
          [
            "- nicht UVG-prämienpflichtige Löhne",
            report.wageSummary.male.nonUvgPremium !== "0.00" ? `- ${formatCurrency(parseFloat(report.wageSummary.male.nonUvgPremium))}` : "-",
            report.wageSummary.female.nonUvgPremium !== "0.00" ? `- ${formatCurrency(parseFloat(report.wageSummary.female.nonUvgPremium))}` : "-"
          ],
          [
            `= Total UVG-Lohnsumme (bis ${uvgMaxIncomeFormatted})`,
            `= ${formatCurrency(parseFloat(report.wageSummary.male.uvgWage))}`,
            `= ${formatCurrency(parseFloat(report.wageSummary.female.uvgWage))}`
          ],
          [
            "",
            "",
            ""
          ],
          [
            "UVGO-Lohnsummen Personen 70+ (BU)",
            formatCurrency(parseFloat(report.wageSummary.male.uvgo70Plus_BU)),
            formatCurrency(parseFloat(report.wageSummary.female.uvgo70Plus_BU))
          ],
          [
            "UVGO-Lohnsummen Personen 70+ (NBU)",
            formatCurrency(parseFloat(report.wageSummary.male.uvgo70Plus_NBU)),
            formatCurrency(parseFloat(report.wageSummary.female.uvgo70Plus_NBU))
          ]
        ];
        
        pdf.addTable(
          ["Kategorie", "Lohn Männer", "Lohn Frauen"],
          wageSummaryRows
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

      const company = await storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const payments = await storage.getPayrollPayments(year);
      
      // Import PDFDocument for merging
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();

      // Generate Lohnausweis for each selected employee
      for (let i = 0; i < employeeIds.length; i++) {
        const employeeId = employeeIds[i];
        const employee = await storage.getEmployee(employeeId);
        
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
          const fullPayment = await storage.getPayrollPayment(payment.id);
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

      const company = await storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const allEmployees = await storage.getEmployees();
      const activeEmployees = allEmployees.filter((e: any) => e.isActive);

      if (activeEmployees.length === 0) {
        return res.status(404).json({ error: "No active employees found" });
      }

      const payments = await storage.getPayrollPayments(year);
      
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
          const fullPayment = await storage.getPayrollPayment(payment.id);
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
          employmentFrom: formatDate(employee.entryDate),
          employmentTo: employee.exitDate ? formatDate(employee.exitDate) : formatDate(new Date(year, 11, 31)),
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
          
          // Expenses (not currently tracked)
          travelExpenses: 0,
          otherActualExpenses: 0,
          representationExpenses: 0,
          carExpenses: 0,
          otherFlatExpenses: 0,
          trainingContributions: 0,
          
          // Employer information
          employerName: company.name,
          employerAddress: formatAddressMultiline(company.street, company.postalCode, company.city),
          employerPhone: '', // Phone not tracked in current schema
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

      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const company = await storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Get all payments for this employee in the year
      const payments = await storage.getPayrollPayments(year);
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
        const fullPayment = await storage.getPayrollPayment(payment.id);
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
        employmentFrom: formatDate(new Date(year, 0, 1)), // 1.1.YYYY
        employmentTo: formatDate(new Date(year, 11, 31)), // 31.12.YYYY
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
      const itemTypes = await storage.getPayrollItemTypes();
      res.json(itemTypes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/payroll-item-types/:id", async (req, res) => {
    try {
      const itemType = await storage.getPayrollItemType(req.params.id);
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
      const itemType = await storage.createPayrollItemType(validatedData);
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
      const itemType = await storage.updatePayrollItemType(req.params.id, validatedData);
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
      await storage.deletePayrollItemType(req.params.id);
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
      const templates = await storage.getPayrollTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getPayrollTemplate(req.params.id);
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
      const template = await storage.createPayrollTemplate(validatedData);
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
      const template = await storage.updatePayrollTemplate(req.params.id, validatedData);
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
      await storage.deletePayrollTemplate(req.params.id);
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

      const report = await storage.getMonthlyReport(year, month);
      const company = await storage.getCompany();

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

      const report = await storage.getYearlyReport(year);
      const company = await storage.getCompany();

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

  const httpServer = createServer(app);

  return httpServer;
}
