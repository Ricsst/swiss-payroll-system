import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import type { Employee, Company, PayrollItemType } from "@shared/schema";

interface PayrollItemRow {
  type: string;
  description: string;
  amount: string;
  hours: string;
  hourlyRate: string;
}

interface PayrollPaymentDetail {
  id: string;
  employeeId: string;
  paymentDate: string;
  periodStart: string;
  periodEnd: string;
  paymentMonth: number;
  paymentYear: number;
  grossSalary: string;
  totalDeductions: string;
  netSalary: string;
  isLocked: boolean;
  notes: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    ahvNumber: string;
  };
  items: {
    id: string;
    type: string;
    description: string | null;
    amount: string;
    hours: string | null;
    rate: string | null;
  }[];
  deductions: {
    id: string;
    type: string;
    description: string | null;
    amount: string;
    rate: string | null;
  }[];
}

export default function PayrollEdit({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [paymentDate, setPaymentDate] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [payrollRows, setPayrollRows] = useState<Record<string, PayrollItemRow>>({});

  const { data: payment, isLoading: isLoadingPayment } = useQuery<PayrollPaymentDetail>({
    queryKey: ["/api/payroll/payments", params.id],
  });

  const { data: company } = useQuery<Company>({
    queryKey: ["/api/company"],
  });

  const { data: payrollItemTypes = [] } = useQuery<PayrollItemType[]>({
    queryKey: ["/api/payroll-item-types"],
  });

  // Load payment data into form when available
  useEffect(() => {
    if (payment && payrollItemTypes.length > 0) {
      setPaymentDate(payment.paymentDate.split('T')[0]);
      setPeriodStart(payment.periodStart.split('T')[0]);
      setPeriodEnd(payment.periodEnd.split('T')[0]);
      setNotes(payment.notes || "");

      // Initialize all payroll item types
      const rows: Record<string, PayrollItemRow> = {};
      payrollItemTypes
        .filter(type => type.isActive)
        .forEach(type => {
          rows[type.code] = {
            type: type.code,
            description: "",
            amount: "",
            hours: "",
            hourlyRate: "",
          };
        });

      // Fill in existing data
      payment.items.forEach(item => {
        if (rows[item.type]) {
          rows[item.type] = {
            type: item.type,
            description: item.description || "",
            amount: item.amount,
            hours: item.hours || "",
            hourlyRate: item.rate || "",
          };
        }
      });

      setPayrollRows(rows);
    }
  }, [payment, payrollItemTypes]);

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/payroll/payments/${params.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments", params.id] });
      toast({ title: "Lohnauszahlung erfolgreich aktualisiert" });
      setLocation(`/payroll/${params.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Lohnauszahlung konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (type: string, field: keyof PayrollItemRow, value: string) => {
    setPayrollRows(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));

    // Auto-calculate amount for certain fields
    if (field === 'hours' || field === 'hourlyRate') {
      const row = payrollRows[type];
      const hours = field === 'hours' ? parseFloat(value) : parseFloat(row.hours);
      const rate = field === 'hourlyRate' ? parseFloat(value) : parseFloat(row.hourlyRate);
      
      if (!isNaN(hours) && !isNaN(rate) && hours > 0 && rate > 0) {
        const amount = (hours * rate).toFixed(2);
        setPayrollRows(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            amount,
          },
        }));
      }
    }
  };

  const handleSubmit = () => {
    if (!payment) return;

    // Validate
    if (!paymentDate || !periodStart || !periodEnd) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Pflichtfelder aus",
        variant: "destructive",
      });
      return;
    }

    // Collect payroll items
    const items = Object.values(payrollRows)
      .filter(row => {
        const amount = parseFloat(row.amount);
        return !isNaN(amount) && amount > 0;
      })
      .map(row => ({
        type: row.type,
        description: row.description || null,
        amount: row.amount,
        hours: row.hours || null,
        rate: row.hourlyRate || null,
      }));

    if (items.length === 0) {
      toast({
        title: "Keine Lohnbestandteile",
        description: "Bitte erfassen Sie mindestens einen Lohnbestandteil",
        variant: "destructive",
      });
      return;
    }

    // Calculate deductions
    const calculatedDeductions = calculateDeductions();

    const payload = {
      employeeId: payment.employeeId,
      paymentDate,
      periodStart,
      periodEnd,
      paymentMonth: new Date(periodEnd).getMonth() + 1,
      paymentYear: new Date(periodEnd).getFullYear(),
      notes: notes || null,
      items,
      deductions: calculatedDeductions,
    };

    updatePaymentMutation.mutate(payload);
  };

  if (isLoadingPayment) {
    return (
      <div className="space-y-3 py-3">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-3 py-3">
        <div className="flex items-center gap-4">
          <Link href="/payroll">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Auszahlung nicht gefunden</h1>
        </div>
      </div>
    );
  }

  if (payment.isLocked) {
    return (
      <div className="space-y-3 py-3">
        <div className="flex items-center gap-4">
          <Link href={`/payroll/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Abgeschlossene Lohnauszahlung</h1>
            <p className="text-sm text-muted-foreground">
              Diese Lohnauszahlung kann nicht bearbeitet werden, da sie bereits abgeschlossen ist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const grossSalary = Object.values(payrollRows).reduce((sum, row) => {
    const amount = parseFloat(row.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Calculate deductions based on payroll item type flags
  const calculateDeductions = () => {
    if (!company || !payment || payrollItemTypes.length === 0) return [];

    const deductions: any[] = [];
    
    // Calculate base amounts for each deduction type based on payroll item type flags
    const calculateBaseAmount = (deductionFlag: keyof Pick<PayrollItemType, 'subjectToAhv' | 'subjectToAlv' | 'subjectToNbu' | 'subjectToBvg' | 'subjectToQst'>) => {
      return Object.values(payrollRows).reduce((sum, row) => {
        const amount = parseFloat(row.amount) || 0;
        if (amount <= 0) return sum;
        
        const itemType = payrollItemTypes.find(t => t.code === row.type);
        if (!itemType || !itemType[deductionFlag]) return sum;
        
        return sum + amount;
      }, 0);
    };
    
    // AHV - with Rentner allowance if applicable
    const ahvRate = parseFloat(company.ahvEmployeeRate) || 5.3;
    let ahvBaseAmount = calculateBaseAmount('subjectToAhv');
    
    // Apply Rentner allowance if employee is Rentner
    if (payment.employee && 'isRentner' in payment.employee && (payment.employee as any).isRentner && ahvBaseAmount > 0) {
      const rentnerAllowance = parseFloat(company.ahvRentnerAllowance) || 1400;
      ahvBaseAmount = Math.max(0, ahvBaseAmount - rentnerAllowance);
    }
    
    if (ahvBaseAmount > 0) {
      deductions.push({
        type: "AHV",
        description: (payment.employee && 'isRentner' in payment.employee && (payment.employee as any).isRentner) ? "AHV/IV/EO Abzug (Rentner)" : "AHV/IV/EO Abzug",
        rate: ahvRate.toString(),
        amount: (ahvBaseAmount * (ahvRate / 100)).toFixed(2),
      });
    }

    // ALV
    const alvRate = parseFloat(company.alvEmployeeRate) || 1.1;
    const alvBaseAmount = calculateBaseAmount('subjectToAlv');
    if (alvBaseAmount > 0) {
      deductions.push({
        type: "ALV",
        description: "ALV Abzug",
        rate: alvRate.toString(),
        amount: (alvBaseAmount * (alvRate / 100)).toFixed(2),
      });
    }

    // NBU/SUVA - only if employee is NBU insured
    if (payment.employee && 'isNbuInsured' in payment.employee && (payment.employee as any).isNbuInsured) {
      const suvaRate = parseFloat(company.suvaNbuMaleRate) || 1.168;
      const nbuBaseAmount = calculateBaseAmount('subjectToNbu');
      if (nbuBaseAmount > 0) {
        deductions.push({
          type: "NBU",
          description: "NBU/SUVA Abzug",
          rate: suvaRate.toString(),
          amount: (nbuBaseAmount * (suvaRate / 100)).toFixed(2),
        });
      }
    }

    // BVG - use employee default if available
    const bvgBaseAmount = calculateBaseAmount('subjectToBvg');
    if (bvgBaseAmount > 0 && payment.employee && 'bvgDeductionAmount' in payment.employee) {
      const bvgAmount = parseFloat((payment.employee as any).bvgDeductionAmount || "0");
      if (bvgAmount > 0) {
        deductions.push({
          type: "BVG",
          description: "BVG Abzug",
          rate: null,
          amount: bvgAmount.toFixed(2),
        });
      }
    }

    // QST - only if employee is subject to Quellensteuer
    if (payment.employee && 'isQstSubject' in payment.employee && (payment.employee as any).isQstSubject) {
      const qstRate = parseFloat((payment.employee as any).qstRate || "0");
      const qstBaseAmount = calculateBaseAmount('subjectToQst');
      if (qstBaseAmount > 0 && qstRate > 0) {
        deductions.push({
          type: "QST",
          description: "Quellensteuer Abzug",
          rate: qstRate.toString(),
          amount: (qstBaseAmount * (qstRate / 100)).toFixed(2),
        });
      }
    }

    return deductions;
  };

  const deductions = calculateDeductions();
  const totalDeductions = deductions.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const netSalary = grossSalary - totalDeductions;

  return (
    <div className="space-y-3 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/payroll/${params.id}`}>
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Lohnauszahlung bearbeiten</h1>
            <p className="text-sm text-muted-foreground">
              {payment.employee.firstName} {payment.employee.lastName} - AHV: {payment.employee.ahvNumber}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={updatePaymentMutation.isPending} data-testid="button-save">
          <Save className="h-4 w-4 mr-2" />
          {updatePaymentMutation.isPending ? "Speichern..." : "Speichern"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auszahlungsdetails</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Auszahlungsdatum *</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-8 text-sm"
                data-testid="input-payment-date"
              />
            </div>
            <div>
              <Label className="text-xs">Periode Start *</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="h-8 text-sm"
                data-testid="input-period-start"
              />
            </div>
            <div>
              <Label className="text-xs">Periode Ende *</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="h-8 text-sm"
                data-testid="input-period-end"
              />
            </div>
            <div>
              <Label className="text-xs">Bemerkung</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                className="h-8 text-sm"
                data-testid="input-notes"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lohnbestandteile</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="w-16">Code</TableHead>
                <TableHead className="w-48">Bezeichnung</TableHead>
                <TableHead className="w-32">Std/Anz</TableHead>
                <TableHead className="w-32">Ansatz</TableHead>
                <TableHead className="w-32">Betrag (CHF)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollItemTypes
                .filter(t => t.isActive)
                .sort((a, b) => a.code.localeCompare(b.code))
                .map((type) => (
                  <TableRow key={type.code}>
                    <TableCell className="text-xs font-mono">{type.code}</TableCell>
                    <TableCell className="text-xs">{type.name}</TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={payrollRows[type.code]?.hours || ""}
                        onChange={(e) => handleInputChange(type.code, 'hours', e.target.value)}
                        className="h-7 text-xs"
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={payrollRows[type.code]?.hourlyRate || ""}
                        onChange={(e) => handleInputChange(type.code, 'hourlyRate', e.target.value)}
                        className="h-7 text-xs"
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={payrollRows[type.code]?.amount || ""}
                        onChange={(e) => handleInputChange(type.code, 'amount', e.target.value)}
                        className="h-7 text-xs font-mono"
                        placeholder="0.00"
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Übersicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Bruttolohn:</span>
            <span className="font-mono">CHF {grossSalary.toFixed(2)}</span>
          </div>
          <Separator />
          {deductions.map((d, index) => (
            <div key={index} className="flex justify-between text-xs text-muted-foreground">
              <span>{d.description || d.type}</span>
              <span className="font-mono">CHF {d.amount}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm">
            <span className="font-medium">Total Abzüge:</span>
            <span className="font-mono">CHF {totalDeductions.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Nettolohn:</span>
            <span className="font-mono">CHF {netSalary.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
