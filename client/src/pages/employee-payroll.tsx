import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Save, Calculator, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Employee, Company } from "@shared/schema";
import { PAYROLL_ITEM_TYPES } from "@shared/schema";

interface PayrollItemRow {
  type: string;
  description: string;
  amount: string;
  hours: string;
  hourlyRate: string;
}

export default function EmployeePayroll() {
  const { toast } = useToast();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  
  // Initialize all payroll item types as rows
  const [payrollRows, setPayrollRows] = useState<Record<string, PayrollItemRow>>(() => {
    const rows: Record<string, PayrollItemRow> = {};
    PAYROLL_ITEM_TYPES.forEach(type => {
      rows[type] = {
        type,
        description: "",
        amount: "",
        hours: "",
        hourlyRate: "",
      };
    });
    return rows;
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: company } = useQuery<Company>({
    queryKey: ["/api/company"],
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/payroll/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fehler beim Erstellen der Lohnauszahlung");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments"] });
      toast({
        title: "Erfolg",
        description: "Lohnauszahlung wurde erstellt",
      });
      // Reset form
      const resetRows: Record<string, PayrollItemRow> = {};
      PAYROLL_ITEM_TYPES.forEach(type => {
        resetRows[type] = {
          type,
          description: "",
          amount: "",
          hours: "",
          hourlyRate: "",
        };
      });
      setPayrollRows(resetRows);
      setNotes("");
      // Move to next employee
      navigateToNextEmployee();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get active employees
  const activeEmployees = employees.filter(e => e.isActive);
  const currentEmployeeIndex = activeEmployees.findIndex(e => e.id === selectedEmployeeId);
  const canNavigatePrevious = currentEmployeeIndex > 0;
  const canNavigateNext = currentEmployeeIndex >= 0 && currentEmployeeIndex < activeEmployees.length - 1;

  // Employee navigation
  const navigateToPreviousEmployee = () => {
    if (canNavigatePrevious) {
      setSelectedEmployeeId(activeEmployees[currentEmployeeIndex - 1].id);
    }
  };

  const navigateToNextEmployee = () => {
    if (canNavigateNext) {
      setSelectedEmployeeId(activeEmployees[currentEmployeeIndex + 1].id);
    }
  };

  // Handle month selection
  const handleMonthChange = (monthValue: string) => {
    setSelectedMonth(monthValue);
    
    if (!monthValue) {
      setPeriodStart("");
      setPeriodEnd("");
      return;
    }

    // Parse month value (format: "2025-10")
    const [year, month] = monthValue.split("-").map(Number);
    
    // First day of month
    const firstDay = new Date(year, month - 1, 1);
    const startDate = firstDay.toISOString().split('T')[0];
    
    // Last day of month
    const lastDay = new Date(year, month, 0);
    const endDate = lastDay.toISOString().split('T')[0];
    
    setPeriodStart(startDate);
    setPeriodEnd(endDate);
  };

  const updatePayrollRow = (type: string, field: keyof PayrollItemRow, value: string) => {
    setPayrollRows(prev => {
      const updated = { ...prev };
      updated[type] = { ...updated[type], [field]: value };
      
      // Auto-calculate amount for Stundenlohn
      if (type === "Stundenlohn" && (field === "hours" || field === "hourlyRate")) {
        const item = updated[type];
        if (item.hours && item.hourlyRate) {
          const hours = parseFloat(item.hours);
          const rate = parseFloat(item.hourlyRate);
          if (!isNaN(hours) && !isNaN(rate)) {
            item.amount = (hours * rate).toFixed(2);
          }
        }
      }
      
      return updated;
    });
  };

  const calculateTotals = () => {
    const grossSalary = Object.values(payrollRows).reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);

    return { grossSalary };
  };

  const calculateDeductions = (grossSalary: number) => {
    if (!company) return [];

    const deductions: any[] = [];
    
    // AHV (5.3%)
    const ahvRate = parseFloat(company.ahvEmployeeRate) || 5.3;
    deductions.push({
      type: "AHV",
      description: "AHV/IV/EO Abzug",
      percentage: ahvRate.toString(),
      baseAmount: grossSalary.toFixed(2),
      amount: (grossSalary * (ahvRate / 100)).toFixed(2),
      isAutoCalculated: true,
    });

    // ALV (1.1%)
    const alvRate = parseFloat(company.alvEmployeeRate) || 1.1;
    deductions.push({
      type: "ALV",
      description: "ALV Abzug",
      percentage: alvRate.toString(),
      baseAmount: grossSalary.toFixed(2),
      amount: (grossSalary * (alvRate / 100)).toFixed(2),
      isAutoCalculated: true,
    });

    // NBU/SUVA (1.168%)
    const suvaRate = parseFloat(company.suvaNbuMaleRate) || 1.168;
    deductions.push({
      type: "NBU",
      description: "NBU/SUVA Abzug",
      percentage: suvaRate.toString(),
      baseAmount: grossSalary.toFixed(2),
      amount: (grossSalary * (suvaRate / 100)).toFixed(2),
      isAutoCalculated: true,
    });

    // BVG - approximately 3.5% of gross salary
    const bvgAmount = grossSalary * 0.035;
    deductions.push({
      type: "BVG",
      description: "Pensionskasse",
      percentage: null,
      baseAmount: null,
      amount: bvgAmount.toFixed(2),
      isAutoCalculated: false,
    });

    return deductions;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie einen Mitarbeiter aus",
        variant: "destructive",
      });
      return;
    }

    if (!periodStart || !periodEnd) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie die Abrechnungsperiode",
        variant: "destructive",
      });
      return;
    }

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
      toast({
        title: "Fehler",
        description: "Bitte fügen Sie mindestens eine Lohnart hinzu",
        variant: "destructive",
      });
      return;
    }

    const { grossSalary } = calculateTotals();
    const deductions = calculateDeductions(grossSalary);

    // Calculate payment month and year based on period end date (not payment date)
    const periodEndDate = new Date(periodEnd);
    
    const paymentData = {
      employeeId: selectedEmployeeId,
      paymentDate,
      periodStart,
      periodEnd,
      paymentMonth: periodEndDate.getMonth() + 1,
      paymentYear: periodEndDate.getFullYear(),
      notes,
      payrollItems,
      deductions,
    };

    createPaymentMutation.mutate(paymentData);
  };

  const { grossSalary } = calculateTotals();
  const deductions = calculateDeductions(grossSalary);
  const totalDeductions = deductions.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const netSalary = grossSalary - totalDeductions;

  const selectedEmployee = activeEmployees.find(e => e.id === selectedEmployeeId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lohnerfassung pro Mitarbeiter</h1>
        <p className="text-sm text-muted-foreground">
          Schnelle Erfassung mit Tabellenansicht
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mitarbeiter & Periode</CardTitle>
            <CardDescription>Wählen Sie den Mitarbeiter und die Abrechnungsperiode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employee">Mitarbeiter *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={navigateToPreviousEmployee}
                  disabled={!canNavigatePrevious}
                  data-testid="button-previous-employee"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger id="employee" data-testid="select-employee" className="flex-1">
                    <SelectValue placeholder="Mitarbeiter wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={navigateToNextEmployee}
                  disabled={!canNavigateNext}
                  data-testid="button-next-employee"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {selectedEmployee && (
                <p className="text-sm text-muted-foreground mt-1">
                  AHV: {selectedEmployee.ahvNumber}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="selectedMonth">Monat wählen</Label>
                <Input
                  id="selectedMonth"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  data-testid="input-month"
                />
              </div>
              <div>
                <Label htmlFor="periodStart">Periode von *</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
                  data-testid="input-period-start"
                />
              </div>
              <div>
                <Label htmlFor="periodEnd">Periode bis *</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  required
                  data-testid="input-period-end"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentDate">Auszahlungsdatum *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  data-testid="input-payment-date"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notizen</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionale Notizen"
                  data-testid="input-notes"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lohnarten & Zulagen</CardTitle>
            <CardDescription>Tragen Sie die Beträge direkt in die Tabelle ein</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Lohnart</TableHead>
                    <TableHead className="w-[200px]">Beschreibung</TableHead>
                    <TableHead className="w-[120px] text-right">Menge/Std.</TableHead>
                    <TableHead className="w-[120px] text-right">Ansatz</TableHead>
                    <TableHead className="w-[140px] text-right">Betrag (CHF)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PAYROLL_ITEM_TYPES.map((type) => {
                    const row = payrollRows[type];
                    const isStundenlohn = type === "Stundenlohn";
                    
                    return (
                      <TableRow key={type}>
                        <TableCell className="font-medium">{type}</TableCell>
                        <TableCell>
                          <Input
                            value={row.description}
                            onChange={(e) => updatePayrollRow(type, "description", e.target.value)}
                            placeholder="Optional"
                            className="h-8"
                            data-testid={`input-description-${type}`}
                          />
                        </TableCell>
                        <TableCell>
                          {isStundenlohn ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={row.hours}
                              onChange={(e) => updatePayrollRow(type, "hours", e.target.value)}
                              placeholder="0.00"
                              className="h-8 text-right"
                              data-testid={`input-hours-${type}`}
                            />
                          ) : (
                            <div className="h-8" />
                          )}
                        </TableCell>
                        <TableCell>
                          {isStundenlohn ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={row.hourlyRate}
                              onChange={(e) => updatePayrollRow(type, "hourlyRate", e.target.value)}
                              placeholder="0.00"
                              className="h-8 text-right"
                              data-testid={`input-hourly-rate-${type}`}
                            />
                          ) : (
                            <div className="h-8" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={row.amount}
                            onChange={(e) => updatePayrollRow(type, "amount", e.target.value)}
                            placeholder="0.00"
                            className="h-8 text-right font-medium"
                            data-testid={`input-amount-${type}`}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Berechnung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary/50 rounded-md">
                <p className="text-sm text-muted-foreground">Bruttolohn</p>
                <p className="text-2xl font-bold" data-testid="text-gross-salary">
                  CHF {grossSalary.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-secondary/50 rounded-md">
                <p className="text-sm text-muted-foreground">Abzüge</p>
                <p className="text-2xl font-bold text-destructive" data-testid="text-deductions">
                  CHF {totalDeductions.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-primary/10 rounded-md">
                <p className="text-sm text-muted-foreground">Nettolohn</p>
                <p className="text-2xl font-bold text-primary" data-testid="text-net-salary">
                  CHF {netSalary.toFixed(2)}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Abzüge im Detail:</h4>
              <div className="space-y-2">
                {deductions.map((deduction, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {deduction.type} {deduction.percentage && `(${deduction.percentage}%)`}
                    </span>
                    <span className="font-medium">CHF {parseFloat(deduction.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={createPaymentMutation.isPending}
            data-testid="button-submit"
          >
            <Save className="h-4 w-4 mr-2" />
            {createPaymentMutation.isPending ? "Speichern..." : "Lohnauszahlung speichern"}
          </Button>
        </div>
      </form>
    </div>
  );
}
