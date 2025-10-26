// Using dynamic import for pdf-parse due to ESM/CJS compatibility
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

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

/**
 * Parse Swiss formatted number to float
 * Swiss format can use:
 * - Apostrophe (') or typographic apostrophe (') as thousand separator (U+0027 or U+2019)
 * - Comma (,) or dot (.) as decimal separator
 * Examples: "3'546.75" -> 3546.75, "3'546.75" -> 3546.75, "1'234" -> 1234, "42,50" -> 42.5, "5,30" -> 5.3
 */
function parseSwissNumber(value: string): number {
  // Remove whitespace
  let cleaned = value.trim();
  
  // Remove thousand separators: straight apostrophe (U+0027) and typographic/curly apostrophe (U+2019)
  // Also remove narrow no-break space (U+202F) which is sometimes used
  cleaned = cleaned.replace(/[''\u2019\u202F]/g, '');
  
  // Replace comma decimal separator with dot
  // Only replace the last comma (if any) as decimal separator
  const lastCommaIndex = cleaned.lastIndexOf(',');
  if (lastCommaIndex !== -1) {
    cleaned = cleaned.substring(0, lastCommaIndex) + '.' + cleaned.substring(lastCommaIndex + 1);
  }
  
  return parseFloat(cleaned);
}

export async function parseQCSPayrollPDF(pdfBuffer: Buffer): Promise<QCSPayrollData> {
  const data = await pdf(pdfBuffer);
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
  // Note: Character class includes: digits, straight apostrophe ('), typographic apostrophe (U+2019), comma, dot
  const lohnMatch = text.match(/Lohn\s+([\d'\u2019.,]+)\s+([\d'\u2019.,]+)\s+Std\.\s+([\d'\u2019.,]+)/);
  const hourlyRate = lohnMatch ? parseSwissNumber(lohnMatch[1]) : 0;
  const hoursWorked = lohnMatch ? parseSwissNumber(lohnMatch[2]) : 0;
  const wageAmount = lohnMatch ? parseSwissNumber(lohnMatch[3]) : 0;
  
  // Extract Sonntagszulage
  const sundayMatch = text.match(/Sonntagszulage\s+([\d'\u2019.,]+)\s+([\d'\u2019.,]+)\s+Std\.\s+([\d'\u2019.,]+)/);
  const sundaySupplement = sundayMatch ? parseSwissNumber(sundayMatch[1]) : 0;
  const sundayHours = sundayMatch ? parseSwissNumber(sundayMatch[2]) : 0;
  const sundayAmount = sundayMatch ? parseSwissNumber(sundayMatch[3]) : 0;
  
  // Extract Bruttolohn
  const grossMatch = text.match(/Bruttolohn\s+([\d'\u2019.,]+)/);
  const grossSalary = grossMatch ? parseSwissNumber(grossMatch[1]) : 0;
  
  // Extract AHV deduction
  const ahvDeductionMatch = text.match(/AHV-Beitrag\s+([\d'\u2019.,]+)\s+([\d'\u2019.,]+)%\s+([\d'\u2019.,]+)/);
  const ahvBasis = ahvDeductionMatch ? parseSwissNumber(ahvDeductionMatch[1]) : 0;
  const ahvRate = ahvDeductionMatch ? parseSwissNumber(ahvDeductionMatch[2]) : 0;
  const ahvAmount = ahvDeductionMatch ? parseSwissNumber(ahvDeductionMatch[3]) : 0;
  
  // Extract ALV deduction
  const alvDeductionMatch = text.match(/ALV-Beitrag\s+([\d'\u2019.,]+)\s+([\d'\u2019.,]+)%\s+([\d'\u2019.,]+)/);
  const alvBasis = alvDeductionMatch ? parseSwissNumber(alvDeductionMatch[1]) : 0;
  const alvRate = alvDeductionMatch ? parseSwissNumber(alvDeductionMatch[2]) : 0;
  const alvAmount = alvDeductionMatch ? parseSwissNumber(alvDeductionMatch[3]) : 0;
  
  // Extract UVG deduction
  const uvgDeductionMatch = text.match(/UVG-NBUV?\s+Betrieb\s+([\d'\u2019.,]+)\s+([\d'\u2019.,]+)%\s+([\d'\u2019.,]+)/);
  const uvgBasis = uvgDeductionMatch ? parseSwissNumber(uvgDeductionMatch[1]) : 0;
  const uvgRate = uvgDeductionMatch ? parseSwissNumber(uvgDeductionMatch[2]) : 0;
  const uvgAmount = uvgDeductionMatch ? parseSwissNumber(uvgDeductionMatch[3]) : 0;
  
  // Extract BVG deduction
  const bvgDeductionMatch = text.match(/BVG\s+Stundenlohn\s+([\d'\u2019.,]+)\s+([\d'\u2019.,]+)%\s+([\d'\u2019.,]+)/);
  const bvgBasis = bvgDeductionMatch ? parseSwissNumber(bvgDeductionMatch[1]) : 0;
  const bvgRate = bvgDeductionMatch ? parseSwissNumber(bvgDeductionMatch[2]) : 0;
  const bvgAmount = bvgDeductionMatch ? parseSwissNumber(bvgDeductionMatch[3]) : 0;
  
  // Extract KTG GAV deduction
  const ktgGavMatch = text.match(/KTG\s+GAV\s+Personalverleih\s+([\d'\u2019.,]+)\s+([\d'\u2019.,]+)%\s+([\d'\u2019.,]+)/);
  const ktgGavBasis = ktgGavMatch ? parseSwissNumber(ktgGavMatch[1]) : 0;
  const ktgGavRate = ktgGavMatch ? parseSwissNumber(ktgGavMatch[2]) : 0;
  const ktgGavAmount = ktgGavMatch ? parseSwissNumber(ktgGavMatch[3]) : 0;
  
  // Extract Berufsbeitrag GAV deduction
  const berufsbeitragMatch = text.match(/Berufsbeitrag\s+GAV\s+Personalverleih\s+([\d'\u2019.,]+)\s+([\d'\u2019.,]+)%\s+([\d'\u2019.,]+)/);
  const berufsbeitragGavBasis = berufsbeitragMatch ? parseSwissNumber(berufsbeitragMatch[1]) : 0;
  const berufsbeitragGavRate = berufsbeitragMatch ? parseSwissNumber(berufsbeitragMatch[2]) : 0;
  const berufsbeitragGavAmount = berufsbeitragMatch ? parseSwissNumber(berufsbeitragMatch[3]) : 0;
  
  // Extract totals
  const deductionsMatch = text.match(/Sozialabzüge\s+([\d'\u2019.,]+)/);
  const totalDeductions = deductionsMatch ? parseSwissNumber(deductionsMatch[1]) : 0;
  
  const netMatch = text.match(/Nettolohn\s+([\d'\u2019.,]+)/);
  const netSalary = netMatch ? parseSwissNumber(netMatch[1]) : 0;
  
  const paymentMatch = text.match(/Auszahlungsbetrag\s+auf\s+Ihr\s+Konto\s+([\d'\u2019.,]+)\s+CHF/);
  const paymentAmount = paymentMatch ? parseSwissNumber(paymentMatch[1]) : 0;
  
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
