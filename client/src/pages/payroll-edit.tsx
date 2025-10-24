import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [payrollRows, setPayrollRows] = useState<Record<string, PayrollItemRow>>({});
  const [backendDeductions, setBackendDeductions] = useState<any[] | null>(null);

  const { data: payment, isLoading: isLoadingPayment } = useQuery<PayrollPaymentDetail>({
    queryKey: ["/api/payroll/payments", params.id],
  });

  const { data: company } = useQuery<Company>({
    queryKey: ["/api/company"],
  });

  const { data: payrollItemTypes = [] } = useQuery<PayrollItemType[]>({
    queryKey: ["/api/payroll-item-types"],
  });

  // Format date as YYYY-MM-DD without timezone conversion
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Auto-fill period dates when month is selected
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (month && selectedYear) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(selectedYear);
      
      // First day of month
      const firstDay = new Date(yearNum, monthNum - 1, 1);
      const firstDayStr = formatDateLocal(firstDay);
      
      // Last day of month
      const lastDay = new Date(yearNum, monthNum, 0);
      const lastDayStr = formatDateLocal(lastDay);
      
      setPeriodStart(firstDayStr);
      setPeriodEnd(lastDayStr);
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (selectedMonth && year) {
      const monthNum = parseInt(selectedMonth);
      const yearNum = parseInt(year);
      
      // First day of month
      const firstDay = new Date(yearNum, monthNum - 1, 1);
      const firstDayStr = formatDateLocal(firstDay);
      
      // Last day of month
      const lastDay = new Date(yearNum, monthNum, 0);
      const lastDayStr = formatDateLocal(lastDay);
      
      setPeriodStart(firstDayStr);
      setPeriodEnd(lastDayStr);
    }
  };

  // Load payment data into form when available
  useEffect(() => {
    if (payment && payrollItemTypes.length > 0) {
      setPaymentDate(payment.paymentDate.split('T')[0]);
      setPeriodStart(payment.periodStart.split('T')[0]);
      setPeriodEnd(payment.periodEnd.split('T')[0]);
      setNotes(payment.notes || "");
      
      // Set month and year from payment data
      setSelectedMonth(payment.paymentMonth.toString());
      setSelectedYear(payment.paymentYear.toString());

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

  // Live preview of deductions when payroll items or period changes
  useEffect(() => {
    const fetchDeductions = async () => {
      if (!payment?.employeeId || !periodEnd) {
        setBackendDeductions(null);
        return;
      }

      // Extract payment month and year from period end date
      const periodEndDate = new Date(periodEnd);
      const paymentMonth = periodEndDate.getMonth() + 1;
      const paymentYear = periodEndDate.getFullYear();

      // Filter out empty rows
      const payrollItems = Object.values(payrollRows)
        .filter(row => parseFloat(row.amount) > 0)
        .map(row => ({
          type: row.type,
          description: row.description || undefined,
          amount: row.amount,
          hours: row.hours || undefined,
          hourlyRate: row.hourlyRate || undefined,
        }));

      if (payrollItems.length === 0) {
        setBackendDeductions([]);
        return;
      }

      try {
        const response = await fetch("/api/payroll/preview-deductions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: payment.employeeId,
            paymentMonth,
            paymentYear,
            payrollItems,
            periodEnd, // for prorated ALV/NBU calculation
          }),
        });

        if (response.ok) {
          const deductions = await response.json();
          setBackendDeductions(deductions);
        } else {
          setBackendDeductions([]);
        }
      } catch (error) {
        console.error("Error fetching deduction preview:", error);
        setBackendDeductions([]);
      }
    };

    fetchDeductions();
  }, [payment?.employeeId, periodEnd, payrollRows]);

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/payroll/payments/${params.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/employee-payroll-overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/yearly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/monthly"] });
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

    // Send empty deductions array - backend will recalculate with cumulative ALV/NBU limits
    const payload = {
      employeeId: payment.employeeId,
      paymentDate,
      periodStart,
      periodEnd,
      paymentMonth: new Date(periodEnd).getMonth() + 1,
      paymentYear: new Date(periodEnd).getFullYear(),
      notes: notes || null,
      items,
      deductions: [], // Backend recalculates with cumulative limits
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

  // Use live preview of deductions (with cumulative ALV/NBU limits)
  // Falls back to stored deductions only if preview hasn't been fetched yet (null)
  // Empty array from backend is intentional and should be shown
  const deductions = backendDeductions !== null ? backendDeductions : (payment?.deductions || []);
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
              <Label className="text-xs">Monat *</Label>
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-8 text-sm" data-testid="select-month">
                  <SelectValue placeholder="Monat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Januar</SelectItem>
                  <SelectItem value="2">Februar</SelectItem>
                  <SelectItem value="3">März</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">Mai</SelectItem>
                  <SelectItem value="6">Juni</SelectItem>
                  <SelectItem value="7">Juli</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">Oktober</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">Dezember</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              <Label className="text-xs">Jahr *</Label>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="h-8 text-sm" data-testid="select-year">
                  <SelectValue placeholder="Jahr" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027, 2028].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <div 
                key={index} 
                className="flex justify-between text-xs text-muted-foreground"
                data-testid={`row-deduction-${d.type}`}
              >
                <span data-testid={`text-deduction-description-${d.type}`}>{d.description || d.type}</span>
                <span className="font-mono" data-testid={`text-deduction-amount-${d.type}`}>CHF {d.amount}</span>
              </div>
            ))}
            {deductions.length > 0 && backendDeductions !== null && (
              <div className="text-xs text-muted-foreground italic pt-1">
                Vorschau mit kumulativen ALV/NBU Höchstlöhnen
              </div>
            )}
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
