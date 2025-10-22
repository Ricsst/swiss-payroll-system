import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertEmployeeSchema, insertPayrollPaymentSchema, insertPayrollItemSchema, insertPayrollItemTypeSchema, insertDeductionSchema, insertPayrollTemplateSchema, insertPayrollItemWithoutPaymentIdSchema, insertDeductionWithoutPaymentIdSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { PDFGenerator, formatCurrency, formatDate, formatPercentage } from "./utils/pdf-generator";
import { ExcelGenerator, formatExcelCurrency, formatExcelDate } from "./utils/excel-generator";

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

        // Custom header for payroll slip with employee name
        pdf.addHeader({
          title: "Lohnabrechnung",
          subtitle: `${employee.firstName} ${employee.lastName}`,
          details: `${monthName} ${payment.paymentYear} • AHV: ${employee.ahvNumber}`,
        });

        // Payroll items table
        const itemRows: any[] = [];
        if (payment.payrollItems && payment.payrollItems.length > 0) {
          payment.payrollItems.forEach((item: any) => {
            const quantity = item.hours || "";
            const rate = item.hourlyRate || "";
            
            itemRows.push([
              item.type,
              "",  // % column (empty for payroll items)
              quantity,
              rate ? formatCurrency(parseFloat(rate)) : "",
              formatCurrency(parseFloat(item.amount)) + " +"
            ]);
          });
        }

        pdf.addTable(
          ["Legende", "%", "Menge", "Ansatz", "Betrag"],
          itemRows
        );

        // Gross salary
        pdf.addSection("BRUTTOLOHN");
        pdf.addText("Total", formatCurrency(parseFloat(payment.grossSalary)));

        // Deductions table
        const deductionRows: any[] = [];
        if (payment.deductions && payment.deductions.length > 0) {
          payment.deductions.forEach((d: any) => {
            const percentage = d.percentage ? formatPercentage(parseFloat(d.percentage)) : "";
            const baseAmount = d.baseAmount ? formatCurrency(parseFloat(d.baseAmount)) : "";
            
            deductionRows.push([
              `${d.type} - ${d.description || "Abzug"}`,
              percentage,
              "",  // Menge (empty for deductions)
              baseAmount,
              formatCurrency(parseFloat(d.amount)) + " -"
            ]);
          });
        }

        if (deductionRows.length > 0) {
          pdf.addTable(
            ["Legende", "%", "Menge", "Ansatz", "Betrag"],
            deductionRows
          );
        }

        // Total deductions
        pdf.addSection("TOTAL ABZÜGE");
        pdf.addText("Total", formatCurrency(parseFloat(payment.totalDeductions)));

        // Net salary
        pdf.addSection("NETTOLOHN");
        pdf.addText("Total", formatCurrency(parseFloat(payment.netSalary)));

        pdf.addFooter(`Periode: ${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)} | Auszahlung: ${formatDate(payment.paymentDate)}`);
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

      // Month names in German
      const monthNames = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
      ];
      
      const monthName = monthNames[payment.paymentMonth - 1];

      const pdf = new PDFGenerator();
      
      // Custom header for payroll slip with employee name
      pdf.addHeader({
        title: "Lohnabrechnung",
        subtitle: `${employee.firstName} ${employee.lastName}`,
        details: `${monthName} ${payment.paymentYear} • AHV: ${employee.ahvNumber}`,
      });

      // Payroll items table
      const itemRows: any[] = [];
      if (payment.payrollItems && payment.payrollItems.length > 0) {
        payment.payrollItems.forEach((item: any) => {
          const quantity = item.hours || "";
          const rate = item.hourlyRate || "";
          
          itemRows.push([
            item.type,
            "",  // % column (empty for payroll items)
            quantity,
            rate ? formatCurrency(parseFloat(rate)) : "",
            formatCurrency(parseFloat(item.amount)) + " +"
          ]);
        });
      }

      pdf.addTable(
        ["Legende", "%", "Menge", "Ansatz", "Betrag"],
        itemRows
      );

      // Gross salary
      pdf.addSection("BRUTTOLOHN");
      pdf.addText("Total", formatCurrency(parseFloat(payment.grossSalary)));

      // Deductions table
      const deductionRows: any[] = [];
      if (payment.deductions && payment.deductions.length > 0) {
        payment.deductions.forEach((d: any) => {
          const percentage = d.percentage ? formatPercentage(parseFloat(d.percentage)) : "";
          const baseAmount = d.baseAmount ? formatCurrency(parseFloat(d.baseAmount)) : "";
          
          deductionRows.push([
            `${d.type} - ${d.description || "Abzug"}`,
            percentage,
            "",  // Menge (empty for deductions)
            baseAmount,
            formatCurrency(parseFloat(d.amount)) + " -"
          ]);
        });
      }

      if (deductionRows.length > 0) {
        pdf.addTable(
          ["Legende", "%", "Menge", "Ansatz", "Betrag"],
          deductionRows
        );
      }

      // Total deductions
      pdf.addSection("TOTAL ABZÜGE");
      pdf.addText("Total", formatCurrency(parseFloat(payment.totalDeductions)));

      // Net salary
      pdf.addSection("NETTOLOHN");
      pdf.addText("Total", formatCurrency(parseFloat(payment.netSalary)));

      pdf.addFooter(`Periode: ${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)} | Auszahlung: ${formatDate(payment.paymentDate)}`);

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
      
      pdf.addHeader({
        title: "Monatsabrechnung",
        subtitle: `${company.name} - ${monthNames[month - 1]} ${year}`,
      });

      if (report.employees && report.employees.length > 0) {
        pdf.addSection("Mitarbeiter Übersicht");
        const employeeRows = report.employees.map((emp: any) => [
          emp.employeeName,
          emp.paymentsCount.toString(),
          formatCurrency(parseFloat(emp.totalGrossSalary)),
          formatCurrency(parseFloat(emp.totalDeductions)),
          formatCurrency(parseFloat(emp.totalNetSalary)),
        ]);
        pdf.addTable(
          ["Mitarbeiter", "Anzahl", "Brutto", "Abzüge", "Netto"],
          employeeRows
        );
      }

      // Deduction breakdown
      if (report.deductionSummary && report.deductionSummary.length > 0) {
        pdf.addSection("Abzüge Aufschlüsselung");
        const deductionRows = report.deductionSummary.map((ded: any) => [
          ded.type,
          formatCurrency(parseFloat(ded.amount)),
        ]);
        pdf.addTable(
          ["Abzugsart", "Betrag"],
          deductionRows
        );
      }

      pdf.addSection("Gesamtsummen");
      pdf.addText("Anzahl Mitarbeiter", report.totalEmployees.toString());
      pdf.addText("Anzahl Auszahlungen", report.totalPayments.toString());
      pdf.addText("Gesamtbruttolohn", formatCurrency(parseFloat(report.totals.grossSalary)));
      pdf.addText("Gesamt Abzüge", formatCurrency(parseFloat(report.totals.deductions)));
      pdf.addText("Gesamtnettolohn", formatCurrency(parseFloat(report.totals.netSalary)));

      pdf.addFooter(`Erstellt am ${formatDate(new Date())} - ${company.name}`);

      // ========== PAGE 2: Lohnarten- und Abzugstotale ==========
      pdf.addPageBreak();

      pdf.addHeader({
        title: "Lohnarten- und Abzugstotale",
        subtitle: `${company.name} - ${monthNames[month - 1]} ${year}`,
      });

      // Payroll Items Summary (Lohnarten)
      if (report.payrollItemSummary && report.payrollItemSummary.length > 0) {
        pdf.addSection("LOHNARTEN");
        const payrollItemRows = report.payrollItemSummary.map((item: any) => [
          item.type,
          formatCurrency(parseFloat(item.amount)),
        ]);
        pdf.addTable(
          ["Lohnart", "Betrag"],
          payrollItemRows
        );

        pdf.addSection("TOTAL BRUTTOLOHN");
        pdf.addText("Gesamtbruttolohn", formatCurrency(parseFloat(report.totals.grossSalary)));
      }

      // Deduction Summary
      if (report.deductionSummary && report.deductionSummary.length > 0) {
        pdf.addSection("ABZÜGE");
        const deductionRows = report.deductionSummary.map((ded: any) => [
          ded.type,
          formatCurrency(parseFloat(ded.amount)),
        ]);
        pdf.addTable(
          ["Abzugsart", "Betrag"],
          deductionRows
        );

        pdf.addSection("TOTAL ABZÜGE");
        pdf.addText("Gesamt Abzüge", formatCurrency(parseFloat(report.totals.deductions)));
      }

      pdf.addSection("NETTOLOHN");
      pdf.addText("Gesamtnettolohn", formatCurrency(parseFloat(report.totals.netSalary)));

      pdf.addFooter(`Erstellt am ${formatDate(new Date())} - ${company.name}`);

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

      if (report.monthlyBreakdown && report.monthlyBreakdown.length > 0) {
        pdf.addSection("Monatsübersicht");
        const monthNames = [
          "Januar", "Februar", "März", "April", "Mai", "Juni",
          "Juli", "August", "September", "Oktober", "November", "Dezember"
        ];
        const monthRows = report.monthlyBreakdown.map((m: any) => [
          monthNames[m.month - 1],
          m.paymentCount.toString(),
          formatCurrency(m.totalGross),
          formatCurrency(m.totalDeductions),
          formatCurrency(m.totalNet),
        ]);
        pdf.addTable(
          ["Monat", "Anzahl", "Brutto", "Abzüge", "Netto"],
          monthRows
        );
      }

      pdf.addSection("Jahresgesamtsummen");
      pdf.addText("Anzahl Mitarbeiter", report.totalEmployees.toString());
      pdf.addText("Anzahl Auszahlungen", report.totalPayments.toString());
      pdf.addText("Gesamtbruttolohn", formatCurrency(report.totalGross));
      pdf.addText("Gesamt Abzüge", formatCurrency(report.totalDeductions));
      pdf.addText("Gesamtnettolohn", formatCurrency(report.totalNet));

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
      const employeePayments = payments.filter((p: any) => p.employeeId === employeeId);

      // Calculate totals
      let totalGross = 0;
      let totalAHV = 0;
      let totalALV = 0;
      let totalSUVA = 0;
      let totalBVG = 0;
      let totalTax = 0;
      let totalOther = 0;

      employeePayments.forEach((payment: any) => {
        totalGross += Number(payment.grossSalary);
        
        if (payment.deductions) {
          payment.deductions.forEach((d: any) => {
            const amount = Number(d.amount);
            if (d.type === "AHV") totalAHV += amount;
            else if (d.type === "ALV") totalALV += amount;
            else if (d.type === "SUVA" || d.type === "NBU") totalSUVA += amount;
            else if (d.type === "BVG") totalBVG += amount;
            else if (d.type === "Quellensteuer") totalTax += amount;
            else totalOther += amount;
          });
        }
      });

      const totalDeductions = totalAHV + totalALV + totalSUVA + totalBVG + totalTax + totalOther;
      const totalNet = totalGross - totalDeductions;

      const pdf = new PDFGenerator();
      
      pdf.addHeader({
        title: "LOHNAUSWEIS",
        subtitle: `Gemäss Art. 125 DBG / Steuerjahr ${year}`,
      });

      pdf.addSection("Arbeitgeber");
      pdf.addText("Firma", company.name);
      pdf.addText("Adresse", company.address);
      pdf.addText("AHV-Abrechnungsnummer", company.ahvAccountingNumber);
      if (company.suvaCustomerNumber) {
        pdf.addText("SUVA-Kundennummer", company.suvaCustomerNumber);
      }

      pdf.addSection("Arbeitnehmer");
      pdf.addText("Name, Vorname", `${employee.lastName}, ${employee.firstName}`);
      pdf.addText("Geburtsdatum", formatDate(employee.birthDate));
      pdf.addText("AHV-Nummer", employee.ahvNumber);
      pdf.addText("Adresse", employee.address);
      pdf.addText("Eintrittsdatum", formatDate(employee.entryDate));
      if (employee.exitDate) {
        pdf.addText("Austrittsdatum", formatDate(employee.exitDate));
      }

      pdf.addSection("Lohnangaben für das Jahr " + year);
      pdf.addText("Bruttolohn (inkl. 13. Monatslohn)", formatCurrency(totalGross));
      
      pdf.addSection("Sozialversicherungsbeiträge (Arbeitnehmeranteil)");
      pdf.addText("AHV/IV/EO", formatCurrency(totalAHV));
      pdf.addText("ALV", formatCurrency(totalALV));
      pdf.addText("NBU / SUVA", formatCurrency(totalSUVA));
      pdf.addText("Berufliche Vorsorge (BVG)", formatCurrency(totalBVG));
      
      pdf.addSection("Quellensteuer und weitere Abzüge");
      pdf.addText("Quellensteuer", formatCurrency(totalTax));
      pdf.addText("Sonstige Abzüge", formatCurrency(totalOther));

      pdf.addSection("Zusammenfassung");
      pdf.addText("Total Bruttolohn", formatCurrency(totalGross));
      pdf.addText("Total Abzüge", formatCurrency(totalDeductions));
      pdf.addText("Nettolohn", formatCurrency(totalNet));

      pdf.addSection("Bankverbindung");
      pdf.addText("Bank", employee.bankName || "-");
      pdf.addText("IBAN", employee.bankIban || "-");

      pdf.addFooter(`Ausgestellt am ${formatDate(new Date())} durch ${company.name}`);

      const pdfBlob = pdf.getBlob();
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

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

      const monthNames = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
      ];

      const excel = new ExcelGenerator();

      const columns = [
        { header: "Monat", key: "month", width: 15 },
        { header: "Anzahl Auszahlungen", key: "paymentCount", width: 20 },
        { header: "Bruttolohn (CHF)", key: "totalGross", width: 18 },
        { header: "Abzüge (CHF)", key: "totalDeductions", width: 18 },
        { header: "Nettolohn (CHF)", key: "totalNet", width: 18 },
      ];

      const data = (report.monthlyBreakdown || []).map((m: any) => ({
        month: monthNames[m.month - 1],
        paymentCount: m.paymentCount,
        totalGross: formatExcelCurrency(m.totalGross),
        totalDeductions: formatExcelCurrency(m.totalDeductions),
        totalNet: formatExcelCurrency(m.totalNet),
      }));

      // Add totals row
      data.push({
        month: "TOTAL",
        paymentCount: report.totalPayments,
        totalGross: formatExcelCurrency(report.totalGross),
        totalDeductions: formatExcelCurrency(report.totalDeductions),
        totalNet: formatExcelCurrency(report.totalNet),
      });

      excel.addWorksheet(`Jahresabrechnung ${year}`, columns, data);

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
