import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface PDFOptions {
  title: string;
  subtitle?: string;
  details?: string;
  footer?: string;
}

export class PDFGenerator {
  private doc: jsPDF;
  private yPosition: number = 20;

  constructor(orientation: 'portrait' | 'landscape' = 'portrait') {
    this.doc = new jsPDF({ orientation });
  }

  addCompanyHeader(companyName: string, companyAddress: string, ahvAccountingNumber: string, title: string, year: number) {
    // Company info at top left
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(companyName, 20, this.yPosition);
    this.yPosition += 5;
    
    const addressLines = companyAddress.split('\n');
    addressLines.forEach(line => {
      this.doc.text(line, 20, this.yPosition);
      this.yPosition += 5;
    });
    
    this.doc.text(`AHV-Abrechnungsnummer: ${ahvAccountingNumber}`, 20, this.yPosition);
    this.yPosition += 10;
    
    // Document title
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, 20, this.yPosition);
    this.yPosition += 8;
    
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`Jahr ${year}`, 20, this.yPosition);
    this.yPosition += 10;
  }

  addHeader(options: PDFOptions) {
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(options.title, 20, this.yPosition);
    this.yPosition += 8;

    if (options.subtitle) {
      this.doc.setFontSize(16);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(options.subtitle, 20, this.yPosition);
      this.yPosition += 8;
    }

    if (options.details) {
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(options.details, 20, this.yPosition);
      this.yPosition += 8;
    }

    this.yPosition += 5;
  }

  addSection(title: string) {
    this.yPosition += 5;
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, 20, this.yPosition);
    this.yPosition += 7;
  }

  addText(label: string, value: string) {
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`${label}: ${value}`, 20, this.yPosition);
    this.yPosition += 6;
  }

  addTable(headers: string[], rows: any[][], options?: { compact?: boolean }) {
    const compact = options?.compact || false;
    
    autoTable(this.doc, {
      head: [headers],
      body: rows,
      startY: this.yPosition,
      theme: compact ? "plain" : "striped",
      headStyles: { 
        fillColor: compact ? [240, 240, 240] : [41, 128, 185],
        textColor: compact ? [0, 0, 0] : [255, 255, 255],
        fontStyle: "bold",
        fontSize: compact ? 9 : 10,
      },
      bodyStyles: {
        fontSize: compact ? 8 : 10,
      },
      margin: { left: 20, right: 20 },
      styles: {
        cellPadding: compact ? 2 : 3,
        lineWidth: compact ? 0.1 : 0.2,
      },
    });

    // @ts-ignore - autoTable updates finalY
    this.yPosition = this.doc.lastAutoTable.finalY + (compact ? 4 : 10);
  }
  
  addCompactSection(title: string) {
    this.yPosition += 3;
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, 20, this.yPosition);
    this.yPosition += 5;
  }

  addFooter(text: string | string[]) {
    const pageHeight = this.doc.internal.pageSize.height;
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "italic");
    
    if (Array.isArray(text)) {
      // Multiple lines - start from bottom and work up
      // Clone array to avoid mutating the original
      [...text].reverse().forEach((line, index) => {
        this.doc.text(line, 20, pageHeight - 10 - (index * 4));
      });
    } else {
      // Single line
      this.doc.text(text, 20, pageHeight - 10);
    }
  }

  addPageBreak() {
    this.doc.addPage();
    this.yPosition = 20; // Reset y position for new page
  }

  getBlob(): Blob {
    return this.doc.output("blob");
  }

  save(filename: string) {
    this.doc.save(filename);
  }

  // Method for payroll slip with window envelope layout (right window)
  addWindowEnvelopeAddress(name: string, address: string) {
    // Position for right window envelope (C5/C6)
    // Typically 125mm from left, 45mm from top
    const xPos = 125; // mm from left edge
    const yPos = 45;  // mm from top edge
    
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    
    // Parse address: split by newline if exists, or by comma for "Street, PLZ City" format
    let addressLines: string[] = [];
    if (address.includes('\n')) {
      // Already formatted with line breaks
      addressLines = address.split('\n');
    } else if (address.includes(',')) {
      // Format: "Strasse Nr, PLZ Ort" -> split into two lines
      const parts = address.split(',').map(p => p.trim());
      addressLines = parts;
    } else {
      // Single line address
      addressLines = [address];
    }
    
    // Combine name and address lines
    const allLines = [name, ...addressLines];
    
    allLines.forEach((line, index) => {
      this.doc.text(line, xPos, yPos + (index * 5));
    });
  }

  addPayrollTitle(title: string, period: string, dateRange?: string) {
    this.doc.setFontSize(18);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, 20, 20);
    
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(period, 20, 28);
    
    if (dateRange) {
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(dateRange, 20, 35);
    }
    
    this.yPosition = 85; // Start content below address window
  }

  addPayrollLine(label: string, amount: string, isTotal: boolean = false, isNegative: boolean = false) {
    const fontSize = isTotal ? 11 : 10;
    const fontStyle = isTotal ? "bold" : "normal";
    
    this.doc.setFontSize(fontSize);
    this.doc.setFont("helvetica", fontStyle);
    
    // Label on the left
    this.doc.text(label, 20, this.yPosition);
    
    // Amount on the right (right-aligned)
    const amountText = isNegative ? `- ${amount}` : amount;
    const pageWidth = this.doc.internal.pageSize.width;
    const textWidth = this.doc.getTextWidth(amountText);
    this.doc.text(amountText, pageWidth - 20 - textWidth, this.yPosition);
    
    this.yPosition += isTotal ? 8 : 6;
  }

  addSeparatorLine() {
    const pageWidth = this.doc.internal.pageSize.width;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(20, this.yPosition, pageWidth - 20, this.yPosition);
    this.yPosition += 5;
  }
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `CHF ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'")}`;
}

export function formatCurrencyNumber(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatPercentage(rate: number | string): string {
  const num = typeof rate === "string" ? parseFloat(rate) : rate;
  return `${num.toFixed(2)}%`;
}

export function formatAddress(street: string, postalCode: string, city: string): string {
  return `${street}, ${postalCode} ${city}`;
}

export function formatAddressMultiline(street: string, postalCode: string, city: string): string {
  return `${street}\n${postalCode} ${city}`;
}
