import * as XLSX from "xlsx";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export class ExcelGenerator {
  private workbook: XLSX.WorkBook;
  private worksheets: Map<string, any[]>;

  constructor() {
    this.workbook = XLSX.utils.book_new();
    this.worksheets = new Map();
  }

  addWorksheet(name: string, columns: ExcelColumn[], data: any[]) {
    // Create array of arrays format for xlsx
    const headers = columns.map((col) => col.header);
    const rows = data.map((row) =>
      columns.map((col) => {
        const value = row[col.key];
        // Format dates
        if (value instanceof Date) {
          return value.toLocaleDateString("de-CH");
        }
        // Format numbers
        if (typeof value === "number") {
          return value;
        }
        return value || "";
      })
    );

    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = columns.map((col) => ({
      wch: col.width || 15,
    }));
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(this.workbook, worksheet, name);
    this.worksheets.set(name, worksheetData);
  }

  getBuffer(): Buffer {
    return XLSX.write(this.workbook, { type: "buffer", bookType: "xlsx" });
  }

  getCSVBuffer(worksheetName?: string): Buffer {
    const name = worksheetName || this.workbook.SheetNames[0];
    const worksheet = this.workbook.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    return Buffer.from(csv, "utf-8");
  }
}

export function formatExcelCurrency(amount: number | string): number {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return Math.round(num * 100) / 100;
}

export function formatExcelDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
