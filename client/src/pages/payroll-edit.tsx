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
    isRentner: boolean;
    isNbuInsured: boolean;
    isQstSubject: boolean;
    qstRate: string;
    bvgDeductionAmount: string;
    bvgDeductionPercentage: string;
  };
  items: {
    id: string;
    type: string;
    description: string | null;
    amount: string;
    hours: string | null;
    hourlyRate: string | null;
  }[];
  deductions: {
    id: string;
    type: string;
    description: string | null;
    amount: string;
    percentage: string | null;
    baseAmount: string | null;
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
            hourlyRate: item.hourlyRate || "",
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
        hourlyRate: row.hourlyRate || null,
      }));

    if (items.length === 0) {
      toast({
        title: "Keine Lohnbestandteile",
        description: "Bitte erfassen Sie mindestens einen Lohnbestandteil",
        variant: "destructive",
      });
      return;
    }

    // Recalculate deductions based on new gross salary
    // BUT preserve original BVG values (BVG can change during the year)
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

  // Calculate deductions based on current gross salary
  // BUT preserve original BVG values (BVG can change during the year)
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
    if (payment.employee && payment.employee.isRentner && ahvBaseAmount > 0) {
      const rentnerAllowance = parseFloat(company.ahvRentnerAllowance) || 1400;
      ahvBaseAmount = Math.max(0, ahvBaseAmount - rentnerAllowance);
    }
    
    if (ahvBaseAmount > 0) {
      deductions.push({
        type: "AHV",
        description: payment.employee.isRentner ? "AHV/IV/EO Abzug (Rentner)" : "AHV/IV/EO Abzug",
        percentage: ahvRate.toString(),
        baseAmount: ahvBaseAmount.toFixed(2),
        amount: (ahvBaseAmount * (ahvRate / 100)).toFixed(2),
        isAutoCalculated: true,
      });
    }

    // ALV
    const alvRate = parseFloat(company.alvEmployeeRate) || 1.1;
    const alvBaseAmount = calculateBaseAmount('subjectToAlv');
    if (alvBaseAmount > 0) {
      deductions.push({
        type: "ALV",
        description: "ALV Abzug",
        percentage: alvRate.toString(),
        baseAmount: alvBaseAmount.toFixed(2),
        amount: (alvBaseAmount * (alvRate / 100)).toFixed(2),
        isAutoCalculated: true,
      });
    }

    // NBU/SUVA - only if employee is NBU insured
    if (payment.employee && payment.employee.isNbuInsured) {
      const suvaRate = parseFloat(company.suvaNbuMaleRate) || 1.168;
      const nbuBaseAmount = calculateBaseAmount('subjectToNbu');
      if (nbuBaseAmount > 0) {
        deductions.push({
          type: "NBU",
          description: "NBU/SUVA Abzug",
          percentage: suvaRate.toString(),
          baseAmount: nbuBaseAmount.toFixed(2),
          amount: (nbuBaseAmount * (suvaRate / 100)).toFixed(2),
          isAutoCalculated: true,
        });
      }
    }

    // BVG - Use ORIGINAL values from stored deductions (don't recalculate from current employee)
    // This preserves historical BVG rates that may have changed during the year
    const originalBvgDeduction = payment.deductions.find(d => d.type === 'BVG');
    if (originalBvgDeduction) {
      deductions.push({
        type: "BVG",
        description: originalBvgDeduction.description || "BVG Abzug",
        percentage: originalBvgDeduction.percentage,
        baseAmount: originalBvgDeduction.baseAmount,
        amount: originalBvgDeduction.amount, // Keep original amount
        isAutoCalculated: true,
      });
    }

    // QST - only if employee is subject to Quellensteuer
    if (payment.employee && payment.employee.isQstSubject) {
      const qstRate = parseFloat(payment.employee.qstRate || "0");
      const qstBaseAmount = calculateBaseAmount('subjectToQst');
      if (qstBaseAmount > 0 && qstRate > 0) {
        deductions.push({
          type: "QST",
          description: "Quellensteuer Abzug",
          percentage: qstRate.toString(),
          baseAmount: qstBaseAmount.toFixed(2),
          amount: (qstBaseAmount * (qstRate / 100)).toFixed(2),
          isAutoCalculated: true,
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
      <div>
        <h1 className="text-xl font-semibold">Lohnauszahlung bearbeiten</h1>
        <p className="text-xs text-muted-foreground">
          {payment.employee.firstName} {payment.employee.lastName} - AHV: {payment.employee.ahvNumber}
        </p>
      </div>

      <Card className="py-3">
        <CardContent className="space-y-3 py-0">
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-2">
              <Label className="text-xs">Auszahlungsdatum *</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-8 text-sm"
                data-testid="input-payment-date"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">von *</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="h-8 text-sm"
                data-testid="input-period-start"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">bis *</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="h-8 text-sm"
                data-testid="input-period-end"
              />
            </div>
            <div className="col-span-4">
              <Label className="text-xs">Bemerkung</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                className="h-8 text-sm"
                data-testid="input-notes"
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <Link href={`/payroll/${params.id}`} className="flex-1">
                <Button variant="outline" className="h-8 w-full text-xs" data-testid="button-back">
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Zurück
                </Button>
              </Link>
              <Button 
                onClick={handleSubmit} 
                disabled={updatePaymentMutation.isPending} 
                className="h-8 flex-1 text-xs"
                data-testid="button-save"
              >
                <Save className="h-3 w-3 mr-1" />
                Speichern
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="py-3">
        <CardContent className="py-0">
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-8 text-xs w-[140px]">Lohnart</TableHead>
                  <TableHead className="h-8 text-xs w-[140px]">Beschreibung</TableHead>
                  <TableHead className="h-8 text-xs w-[80px] text-right">Std.</TableHead>
                  <TableHead className="h-8 text-xs w-[80px] text-right">Ansatz</TableHead>
                  <TableHead className="h-8 text-xs w-[100px] text-right">Betrag (CHF)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollItemTypes
                  .filter(t => t.isActive)
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map((type) => (
                    <TableRow key={type.code} className="h-8">
                      <TableCell className="py-1 text-xs font-medium">{type.name}</TableCell>
                      <TableCell className="py-1">
                        <Input
                          value={payrollRows[type.code]?.description || ""}
                          onChange={(e) => handleInputChange(type.code, 'description', e.target.value)}
                          placeholder="Optional"
                          className="h-7 text-xs"
                          data-testid={`input-description-${type.code}`}
                        />
                      </TableCell>
                      <TableCell className="py-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={payrollRows[type.code]?.hours || ""}
                          onChange={(e) => handleInputChange(type.code, 'hours', e.target.value)}
                          placeholder="0"
                          className="h-7 text-xs text-right"
                          data-testid={`input-hours-${type.code}`}
                        />
                      </TableCell>
                      <TableCell className="py-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={payrollRows[type.code]?.hourlyRate || ""}
                          onChange={(e) => handleInputChange(type.code, 'hourlyRate', e.target.value)}
                          placeholder="0.00"
                          className="h-7 text-xs text-right"
                          data-testid={`input-rate-${type.code}`}
                        />
                      </TableCell>
                      <TableCell className="py-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={payrollRows[type.code]?.amount || ""}
                          onChange={(e) => handleInputChange(type.code, 'amount', e.target.value)}
                          placeholder="0.00"
                          className="h-7 text-xs font-mono text-right"
                          data-testid={`input-amount-${type.code}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="py-3">
        <CardContent className="py-0">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
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
            <div className="flex justify-between text-xs">
              <span className="font-medium">Total Abzüge:</span>
              <span className="font-mono">CHF {totalDeductions.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>Nettolohn:</span>
              <span className="font-mono">CHF {netSalary.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
