import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface PDFOptions {
  title: string;
  subtitle?: string;
  footer?: string;
}

export class PDFGenerator {
  private doc: jsPDF;
  private yPosition: number = 20;

  constructor() {
    this.doc = new jsPDF();
  }

  addHeader(options: PDFOptions) {
    this.doc.setFontSize(18);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(options.title, 20, this.yPosition);
    this.yPosition += 10;

    if (options.subtitle) {
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(options.subtitle, 20, this.yPosition);
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

  addTable(headers: string[], rows: any[][]) {
    autoTable(this.doc, {
      head: [headers],
      body: rows,
      startY: this.yPosition,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 20, right: 20 },
    });

    // @ts-ignore - autoTable updates finalY
    this.yPosition = this.doc.lastAutoTable.finalY + 10;
  }

  addFooter(text: string) {
    const pageHeight = this.doc.internal.pageSize.height;
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "italic");
    this.doc.text(text, 20, pageHeight - 10);
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
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `CHF ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'")}`;
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
