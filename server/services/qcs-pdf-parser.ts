import PDFParser from 'pdf-parse';

export interface QCSPayrollData {
  // Employee data
  employeeName: string;
  firstName: string;
  lastName: string;
  ahvNumber: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
  };
  
  // Payroll period
  month: string; // e.g., "Oktober"
  year: number;
  workDate: string; // e.g., "Mittwoch, 22. Oktober 2025"
  
  // Wage items
  hourlyRate: number;
  hoursWorked: number;
  wageAmount: number;
  
  sundaySupplement: number; // Sonntagszulage
  sundayHours: number;
  sundayAmount: number;
  
  grossSalary: number;
  
  // Deductions
  ahvRate: number; // in %
  ahvBasis: number;
  ahvAmount: number;
  
  alvRate: number; // in %
  alvBasis: number;
  alvAmount: number;
  
  uvgRate: number; // in %
  uvgBasis: number;
  uvgAmount: number;
  
  bvgRate: number; // in %
  bvgBasis: number;
  bvgAmount: number;
  
  ktgGavRate: number; // in %
  ktgGavBasis: number;
  ktgGavAmount: number;
  
  berufsbeitragGavRate: number; // in %
  berufsbeitragGavBasis: number;
  berufsbeitragGavAmount: number;
  
  totalDeductions: number;
  netSalary: number;
  paymentAmount: number; // Final payment amount (may differ slightly due to rounding)
}

const MONTH_MAP: Record<string, number> = {
  'Januar': 1,
  'Februar': 2,
  'März': 3,
  'April': 4,
  'Mai': 5,
  'Juni': 6,
  'Juli': 7,
  'August': 8,
  'September': 9,
  'Oktober': 10,
  'November': 11,
  'Dezember': 12,
};

export async function parseQCSPayrollPDF(pdfBuffer: Buffer): Promise<QCSPayrollData> {
  const data = await PDFParser(pdfBuffer);
  const text = data.text;
  
  // Extract employee name
  const nameMatch = text.match(/Vertraulich\s+([^\n]+)\s+([^\n]+)\s+(\d{4})/);
  if (!nameMatch) {
    throw new Error('Could not extract employee name from PDF');
  }
  
  const fullName = nameMatch[1].trim();
  const nameParts = fullName.split(' ');
  const firstName = nameParts.slice(0, -1).join(' ');
  const lastName = nameParts[nameParts.length - 1];
  
  const street = nameMatch[2].trim();
  const postalCodeCity = nameMatch[3].trim() + ' ' + text.split(nameMatch[3])[1].split('\n')[0].trim();
  const postalCodeCityMatch = postalCodeCity.match(/(\d{4})\s+(.+)/);
  
  const postalCode = postalCodeCityMatch ? postalCodeCityMatch[1] : '';
  const city = postalCodeCityMatch ? postalCodeCityMatch[2] : '';
  
  // Extract AHV number
  const ahvMatch = text.match(/AHV-Nummer:\s*([\d.]+)/);
  const ahvNumber = ahvMatch ? ahvMatch[1] : '';
  
  // Extract month and year
  const monthMatch = text.match(/Lohnabrechnung\s+(\w+)/);
  const month = monthMatch ? monthMatch[1] : '';
  
  const dateMatch = text.match(/Datum:\s*(\d{2})\.(\d{2})\.(\d{4})/);
  const year = dateMatch ? parseInt(dateMatch[3]) : new Date().getFullYear();
  
  const workDateMatch = text.match(/Zeitraum:\s*([^\n]+)/);
  const workDate = workDateMatch ? workDateMatch[1].trim() : '';
  
  // Extract wage data - Lohn
  const lohnMatch = text.match(/Lohn\s+([\d.]+)\s+([\d.]+)\s+Std\.\s+([\d.]+)/);
  const hourlyRate = lohnMatch ? parseFloat(lohnMatch[1]) : 0;
  const hoursWorked = lohnMatch ? parseFloat(lohnMatch[2]) : 0;
  const wageAmount = lohnMatch ? parseFloat(lohnMatch[3]) : 0;
  
  // Extract Sonntagszulage
  const sundayMatch = text.match(/Sonntagszulage\s+([\d.]+)\s+([\d.]+)\s+Std\.\s+([\d.]+)/);
  const sundaySupplement = sundayMatch ? parseFloat(sundayMatch[1]) : 0;
  const sundayHours = sundayMatch ? parseFloat(sundayMatch[2]) : 0;
  const sundayAmount = sundayMatch ? parseFloat(sundayMatch[3]) : 0;
  
  // Extract Bruttolohn
  const grossMatch = text.match(/Bruttolohn\s+([\d.]+)/);
  const grossSalary = grossMatch ? parseFloat(grossMatch[1]) : 0;
  
  // Extract AHV deduction
  const ahvDeductionMatch = text.match(/AHV-Beitrag\s+([\d.]+)\s+([\d.]+)%\s+([\d.]+)/);
  const ahvBasis = ahvDeductionMatch ? parseFloat(ahvDeductionMatch[1]) : 0;
  const ahvRate = ahvDeductionMatch ? parseFloat(ahvDeductionMatch[2]) : 0;
  const ahvAmount = ahvDeductionMatch ? parseFloat(ahvDeductionMatch[3]) : 0;
  
  // Extract ALV deduction
  const alvDeductionMatch = text.match(/ALV-Beitrag\s+([\d.]+)\s+([\d.]+)%\s+([\d.]+)/);
  const alvBasis = alvDeductionMatch ? parseFloat(alvDeductionMatch[1]) : 0;
  const alvRate = alvDeductionMatch ? parseFloat(alvDeductionMatch[2]) : 0;
  const alvAmount = alvDeductionMatch ? parseFloat(alvDeductionMatch[3]) : 0;
  
  // Extract UVG deduction
  const uvgDeductionMatch = text.match(/UVG-NBUV?\s+Betrieb\s+([\d.]+)\s+([\d.]+)%\s+([\d.]+)/);
  const uvgBasis = uvgDeductionMatch ? parseFloat(uvgDeductionMatch[1]) : 0;
  const uvgRate = uvgDeductionMatch ? parseFloat(uvgDeductionMatch[2]) : 0;
  const uvgAmount = uvgDeductionMatch ? parseFloat(uvgDeductionMatch[3]) : 0;
  
  // Extract BVG deduction
  const bvgDeductionMatch = text.match(/BVG\s+Stundenlohn\s+([\d.]+)\s+([\d.]+)%\s+([\d.]+)/);
  const bvgBasis = bvgDeductionMatch ? parseFloat(bvgDeductionMatch[1]) : 0;
  const bvgRate = bvgDeductionMatch ? parseFloat(bvgDeductionMatch[2]) : 0;
  const bvgAmount = bvgDeductionMatch ? parseFloat(bvgDeductionMatch[3]) : 0;
  
  // Extract KTG GAV deduction
  const ktgGavMatch = text.match(/KTG\s+GAV\s+Personalverleih\s+([\d.]+)\s+([\d.]+)%\s+([\d.]+)/);
  const ktgGavBasis = ktgGavMatch ? parseFloat(ktgGavMatch[1]) : 0;
  const ktgGavRate = ktgGavMatch ? parseFloat(ktgGavMatch[2]) : 0;
  const ktgGavAmount = ktgGavMatch ? parseFloat(ktgGavMatch[3]) : 0;
  
  // Extract Berufsbeitrag GAV deduction
  const berufsbeitragMatch = text.match(/Berufsbeitrag\s+GAV\s+Personalverleih\s+([\d.]+)\s+([\d.]+)%\s+([\d.]+)/);
  const berufsbeitragGavBasis = berufsbeitragMatch ? parseFloat(berufsbeitragMatch[1]) : 0;
  const berufsbeitragGavRate = berufsbeitragMatch ? parseFloat(berufsbeitragMatch[2]) : 0;
  const berufsbeitragGavAmount = berufsbeitragMatch ? parseFloat(berufsbeitragMatch[3]) : 0;
  
  // Extract totals
  const deductionsMatch = text.match(/Sozialabzüge\s+([\d.]+)/);
  const totalDeductions = deductionsMatch ? parseFloat(deductionsMatch[1]) : 0;
  
  const netMatch = text.match(/Nettolohn\s+([\d.]+)/);
  const netSalary = netMatch ? parseFloat(netMatch[1]) : 0;
  
  const paymentMatch = text.match(/Auszahlungsbetrag\s+auf\s+Ihr\s+Konto\s+([\d.]+)\s+CHF/);
  const paymentAmount = paymentMatch ? parseFloat(paymentMatch[1]) : 0;
  
  return {
    employeeName: fullName,
    firstName,
    lastName,
    ahvNumber,
    address: {
      street,
      postalCode,
      city,
    },
    month,
    year,
    workDate,
    hourlyRate,
    hoursWorked,
    wageAmount,
    sundaySupplement,
    sundayHours,
    sundayAmount,
    grossSalary,
    ahvRate,
    ahvBasis,
    ahvAmount,
    alvRate,
    alvBasis,
    alvAmount,
    uvgRate,
    uvgBasis,
    uvgAmount,
    bvgRate,
    bvgBasis,
    bvgAmount,
    ktgGavRate,
    ktgGavBasis,
    ktgGavAmount,
    berufsbeitragGavRate,
    berufsbeitragGavBasis,
    berufsbeitragGavAmount,
    totalDeductions,
    netSalary,
    paymentAmount,
  };
}

export function getMonthNumber(monthName: string): number {
  return MONTH_MAP[monthName] || 1;
}
