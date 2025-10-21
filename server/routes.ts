import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertEmployeeSchema, insertPayrollPaymentSchema, insertPayrollItemSchema, insertDeductionSchema, insertPayrollTemplateSchema } from "@shared/schema";
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

      // Validate payroll items
      const itemsResults = (payrollItems || []).map((item: any) =>
        insertPayrollItemSchema.safeParse(item)
      );
      const itemErrors = itemsResults.filter((r: any) => !r.success);
      if (itemErrors.length > 0) {
        return res.status(400).json({
          error: "Invalid payroll items: " + fromError(itemErrors[0].error).toString(),
        });
      }

      // Validate deductions
      const deductionResults = (deductions || []).map((d: any) =>
        insertDeductionSchema.safeParse(d)
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
  app.get("/api/pdf/payroll/:id", async (req, res) => {
    try {
      const payment = await storage.getPayrollPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const employee = await storage.getEmployee(payment.employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const company = await storage.getCompany();
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const pdf = new PDFGenerator();
      
      pdf.addHeader({
        title: "Lohnabrechnung",
        subtitle: `${company.name} - ${formatDate(payment.paymentDate)}`,
      });

      pdf.addSection("Mitarbeiter");
      pdf.addText("Name", `${employee.firstName} ${employee.lastName}`);
      pdf.addText("AHV-Nr", employee.ahvNumber);
      pdf.addText("Adresse", employee.address);

      pdf.addSection("Lohnzeitraum");
      pdf.addText("Von", formatDate(payment.periodStart));
      pdf.addText("Bis", formatDate(payment.periodEnd));
      pdf.addText("Auszahlungsdatum", formatDate(payment.paymentDate));

      if (payment.items && payment.items.length > 0) {
        pdf.addSection("Lohnarten");
        const itemRows = payment.items.map((item: any) => [
          item.type,
          item.description || "-",
          item.hours ? item.hours.toString() : "-",
          formatCurrency(item.amount),
        ]);
        pdf.addTable(
          ["Typ", "Beschreibung", "Stunden", "Betrag"],
          itemRows
        );
      }

      if (payment.deductions && payment.deductions.length > 0) {
        pdf.addSection("Abzüge");
        const deductionRows = payment.deductions.map((d: any) => [
          d.type,
          d.description || "-",
          formatCurrency(d.amount),
        ]);
        pdf.addTable(
          ["Typ", "Beschreibung", "Betrag"],
          deductionRows
        );
      }

      pdf.addSection("Zusammenfassung");
      pdf.addText("Bruttolohn", formatCurrency(payment.grossSalary));
      pdf.addText("Total Abzüge", formatCurrency(payment.totalDeductions));
      pdf.addText("Nettolohn", formatCurrency(payment.netSalary));

      pdf.addFooter(`Erstellt am ${formatDate(new Date())} - ${company.name}`);

      const pdfBlob = pdf.getBlob();
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Lohnabrechnung_${employee.lastName}_${formatDate(payment.paymentDate)}.pdf`);
      res.send(buffer);
    } catch (error: any) {
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

      if (report.employeeReports && report.employeeReports.length > 0) {
        pdf.addSection("Mitarbeiter Übersicht");
        const employeeRows = report.employeeReports.map((emp: any) => [
          emp.employeeName,
          emp.paymentCount.toString(),
          formatCurrency(emp.totalGross),
          formatCurrency(emp.totalDeductions),
          formatCurrency(emp.totalNet),
        ]);
        pdf.addTable(
          ["Mitarbeiter", "Anzahl", "Brutto", "Abzüge", "Netto"],
          employeeRows
        );
      }

      pdf.addSection("Gesamtsummen");
      pdf.addText("Anzahl Mitarbeiter", report.totalEmployees.toString());
      pdf.addText("Anzahl Auszahlungen", report.totalPayments.toString());
      pdf.addText("Gesamtbruttolohn", formatCurrency(report.totalGross));
      pdf.addText("Gesamt Abzüge", formatCurrency(report.totalDeductions));
      pdf.addText("Gesamtnettolohn", formatCurrency(report.totalNet));

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
        { header: "Anzahl Auszahlungen", key: "paymentCount", width: 20 },
        { header: "Bruttolohn (CHF)", key: "totalGross", width: 18 },
        { header: "Abzüge (CHF)", key: "totalDeductions", width: 18 },
        { header: "Nettolohn (CHF)", key: "totalNet", width: 18 },
      ];

      const data = (report.employeeReports || []).map((emp: any) => ({
        employeeName: emp.employeeName,
        paymentCount: emp.paymentCount,
        totalGross: formatExcelCurrency(emp.totalGross),
        totalDeductions: formatExcelCurrency(emp.totalDeductions),
        totalNet: formatExcelCurrency(emp.totalNet),
      }));

      // Add totals row
      data.push({
        employeeName: "TOTAL",
        paymentCount: report.totalPayments,
        totalGross: formatExcelCurrency(report.totalGross),
        totalDeductions: formatExcelCurrency(report.totalDeductions),
        totalNet: formatExcelCurrency(report.totalNet),
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
