import { PDFDocument, PDFForm, PDFTextField } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface LohnausweisData {
  // Header (Sections C-H)
  ahvNumber: string;
  birthDate: string;
  year: string;
  employmentFrom: string;
  employmentTo: string;
  employeeName: string;
  employeeAddress: string;
  
  // Salary data (Sections 1-14)
  basicSalary: number;           // Ziffer 1
  mealAllowance: number;          // Ziffer 2.1
  carBenefit: number;             // Ziffer 2.2
  otherBenefits: number;          // Ziffer 2.3
  irregularPayments: number;      // Ziffer 3
  capitalPayments: number;        // Ziffer 4
  participationRights: number;    // Ziffer 5
  boardFees: number;              // Ziffer 6
  otherPayments: number;          // Ziffer 7
  grossSalary: number;            // Ziffer 8 (total)
  
  // Deductions (Sections 9-10)
  socialInsurance: number;        // Ziffer 9 (AHV/IV/EO/ALV/NBUV)
  pensionOrdinary: number;        // Ziffer 10.1
  pensionBuyIn: number;           // Ziffer 10.2
  netSalary: number;              // Ziffer 11
  
  // Tax withholding
  taxWithheld: number;            // Ziffer 12
  
  // Expenses (Section 13)
  travelExpenses: number;         // Ziffer 13.1.1
  otherActualExpenses: number;    // Ziffer 13.1.2
  representationExpenses: number; // Ziffer 13.2.1
  carExpenses: number;            // Ziffer 13.2.2
  otherFlatExpenses: number;      // Ziffer 13.2.3
  trainingContributions: number;  // Ziffer 13.3
  
  // Employer info
  employerName: string;
  employerAddress: string;
  employerPhone: string;
  issueDate: string;
}

export async function fillLohnausweisForm(data: LohnausweisData): Promise<Uint8Array> {
  // Load the blank form PDF
  const formPath = join(process.cwd(), 'attached_assets', 'dbst-form-11lohna-rechts-dfi-de (1)_1761382894177.pdf');
  const formBytes = await readFile(formPath);
  
  // Load the PDF document
  const pdfDoc = await PDFDocument.load(formBytes);
  const form = pdfDoc.getForm();
  
  // Helper function to safely set field value
  const setFieldValue = (fieldName: string, value: string | number) => {
    try {
      const field = form.getTextField(fieldName);
      field.setText(String(value));
    } catch (error) {
      console.warn(`Field "${fieldName}" not found in PDF form`);
    }
  };
  
  // Helper to format currency (whole CHF amounts only)
  const formatAmount = (amount: number): string => {
    if (amount === 0) return '';
    return Math.round(amount).toString();
  };
  
  // Fill header information (Sections C-H)
  // AHV number
  setFieldValue('AHVLinks_C', data.ahvNumber);
  // Birth date
  setFieldValue('TextLinks_C-GebDatum', data.birthDate);
  // Year
  setFieldValue('TextLinks_D', data.year);
  // Employment period
  setFieldValue('TextLinks_E-von', data.employmentFrom);
  setFieldValue('TextLinks_E-bis', data.employmentTo);
  // Employee name and address (multiline field)
  const employeeInfo = `${data.employeeName}\n${data.employeeAddress}`;
  setFieldValue('TextMehrzeiligLinks_Empfaenger', employeeInfo);
  
  // Fill salary sections (1-8)
  setFieldValue('DezZahlNull_1', formatAmount(data.basicSalary));
  setFieldValue('DezZahlNull_2_1', formatAmount(data.mealAllowance));
  setFieldValue('DezZahlNull_2_2', formatAmount(data.carBenefit));
  setFieldValue('DezZahlNull_2_3', formatAmount(data.otherBenefits));
  setFieldValue('DezZahlNull_3', formatAmount(data.irregularPayments));
  setFieldValue('DezZahlNull_4', formatAmount(data.capitalPayments));
  setFieldValue('DezZahlNull_5', formatAmount(data.participationRights));
  setFieldValue('DezZahlNull_6', formatAmount(data.boardFees));
  setFieldValue('DezZahlNull_7', formatAmount(data.otherPayments));
  setFieldValue('DezZahlNull_8', formatAmount(data.grossSalary));
  
  // Fill deduction sections (9-11)
  setFieldValue('DezZahlNull_9', formatAmount(data.socialInsurance));
  setFieldValue('DezZahlNull_10_1', formatAmount(data.pensionOrdinary));
  setFieldValue('DezZahlNull_10_2', formatAmount(data.pensionBuyIn));
  setFieldValue('DezZahlNull_11', formatAmount(data.netSalary));
  
  // Fill tax withholding (12)
  setFieldValue('DezZahlNull_12', formatAmount(data.taxWithheld));
  
  // Fill expense sections (13)
  setFieldValue('DezZahlNull_13_1_1', formatAmount(data.travelExpenses));
  setFieldValue('DezZahlNull_13_1_2', formatAmount(data.otherActualExpenses));
  setFieldValue('DezZahlNull_13_2_1', formatAmount(data.representationExpenses));
  setFieldValue('DezZahlNull_13_2_2', formatAmount(data.carExpenses));
  setFieldValue('DezZahlNull_13_2_3', formatAmount(data.otherFlatExpenses));
  setFieldValue('DezZahlNull_13_3', formatAmount(data.trainingContributions));
  
  // Fill employer information (Section I)
  setFieldValue('TextLinks_I', data.issueDate);
  const employerInfo = `${data.employerName}\n${data.employerAddress}\nTel: ${data.employerPhone}`;
  setFieldValue('TextMehrzeiligLinks_Bestaetigung', employerInfo);
  
  // Flatten the form to prevent further editing (optional)
  // form.flatten();
  
  // Save and return the filled PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Helper function to inspect form fields (for debugging)
export async function inspectFormFields(): Promise<string[]> {
  const formPath = join(process.cwd(), 'attached_assets', 'dbst-form-11lohna-rechts-dfi-de (1)_1761382894177.pdf');
  const formBytes = await readFile(formPath);
  const pdfDoc = await PDFDocument.load(formBytes);
  const form = pdfDoc.getForm();
  
  const fields = form.getFields();
  return fields.map(field => field.getName());
}
