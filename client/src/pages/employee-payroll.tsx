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
import type { Employee, Company, PayrollItemType } from "@shared/schema";

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
  const [payrollRows, setPayrollRows] = useState<Record<string, PayrollItemRow>>({});

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: company } = useQuery<Company>({
    queryKey: ["/api/company"],
  });

  const { data: payrollItemTypes = [] } = useQuery<PayrollItemType[]>({
    queryKey: ["/api/payroll-item-types"],
  });

  // Initialize payroll rows when item types are loaded
  useEffect(() => {
    if (payrollItemTypes.length > 0) {
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
      setPayrollRows(rows);
    }
  }, [payrollItemTypes]);

  // Load default values from employee when employee changes
  useEffect(() => {
    if (selectedEmployeeId && employees.length > 0 && payrollItemTypes.length > 0) {
      const employee = employees.find(e => e.id === selectedEmployeeId);
      if (employee) {
        setPayrollRows(prev => {
          const updated = { ...prev };
          
          // Set Monatslohn default value (code "01")
          if (employee.monthlySalary && updated["01"]) {
            updated["01"].amount = employee.monthlySalary;
          }
          
          // Set Stundenlohn default value (code "02")
          if (employee.hourlyRate && updated["02"]) {
            updated["02"].hourlyRate = employee.hourlyRate;
          }
          
          // Set Kinderzulagen default value (code "09")
          if (employee.childAllowanceAmount && updated["09"]) {
            updated["09"].amount = employee.childAllowanceAmount;
            updated["09"].description = employee.childAllowanceNote || "";
          }
          
          return updated;
        });
      }
    }
  }, [selectedEmployeeId, employees, payrollItemTypes]);

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
      payrollItemTypes
        .filter(type => type.isActive)
        .forEach(type => {
          resetRows[type.code] = {
            type: type.code,
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
    if (!company || payrollItemTypes.length === 0) return [];

    const deductions: any[] = [];
    
    // Get current employee for NBU and Rentner status
    const currentEmployee = employees?.find(e => e.id === selectedEmployeeId);
    
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
    
    // AHV (5.3%) - with Rentner allowance if applicable
    const ahvRate = parseFloat(company.ahvEmployeeRate) || 5.3;
    let ahvBaseAmount = calculateBaseAmount('subjectToAhv');
    
    // Apply Rentner allowance if employee is Rentner
    if (currentEmployee?.isRentner && ahvBaseAmount > 0) {
      const rentnerAllowance = parseFloat(company.ahvRentnerAllowance) || 1400;
      ahvBaseAmount = Math.max(0, ahvBaseAmount - rentnerAllowance);
    }
    
    if (ahvBaseAmount > 0) {
      deductions.push({
        type: "AHV",
        description: currentEmployee?.isRentner ? "AHV/IV/EO Abzug (Rentner)" : "AHV/IV/EO Abzug",
        percentage: ahvRate.toString(),
        baseAmount: ahvBaseAmount.toFixed(2),
        amount: (ahvBaseAmount * (ahvRate / 100)).toFixed(2),
        isAutoCalculated: true,
      });
    }

    // ALV (1.1%)
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

    // NBU/SUVA (1.168%) - only if employee is NBU insured
    if (currentEmployee?.isNbuInsured) {
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

    // BVG - use employee default or approximately 3.5% of BVG-subject salary
    const bvgBaseAmount = calculateBaseAmount('subjectToBvg');
    if (bvgBaseAmount > 0) {
      let bvgAmount: number;
      
      // Check if employee has custom BVG deduction
      if (currentEmployee?.bvgDeductionAmount) {
        // Use fixed CHF amount
        bvgAmount = parseFloat(currentEmployee.bvgDeductionAmount);
      } else if (currentEmployee?.bvgDeductionPercentage) {
        // Use percentage of BVG-subject salary
        bvgAmount = bvgBaseAmount * (parseFloat(currentEmployee.bvgDeductionPercentage) / 100);
      } else {
        // Default: 3.5% of BVG-subject salary
        bvgAmount = bvgBaseAmount * 0.035;
      }
      
      deductions.push({
        type: "BVG",
        description: "Pensionskasse",
        percentage: null,
        baseAmount: null,
        amount: bvgAmount.toFixed(2),
        isAutoCalculated: false,
      });
    }

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
    <div className="space-y-3 py-3">
      <div>
        <h1 className="text-xl font-semibold">Lohnerfassung</h1>
        <p className="text-xs text-muted-foreground">Schnelle Erfassung</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Card className="py-3">
          <CardContent className="space-y-3 py-0">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-1 flex items-center justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={navigateToPreviousEmployee}
                  disabled={!canNavigatePrevious}
                  data-testid="button-previous-employee"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Mitarbeiter *</Label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger className="h-8 text-sm" data-testid="select-employee">
                    <SelectValue placeholder="Wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEmployee && (
                  <p className="text-xs text-muted-foreground mt-0.5">AHV: {selectedEmployee.ahvNumber}</p>
                )}
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={navigateToNextEmployee}
                  disabled={!canNavigateNext}
                  data-testid="button-next-employee"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Monat</Label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="h-8 text-sm"
                  data-testid="input-month"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">von *</Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
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
                  required
                  className="h-8 text-sm"
                  data-testid="input-period-end"
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="submit"
                  disabled={createPaymentMutation.isPending}
                  className="h-8 w-full text-xs"
                  data-testid="button-submit"
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
                    .filter(itemType => itemType.isActive)
                    .map((itemType) => {
                      const row = payrollRows[itemType.code];
                      if (!row) return null;
                      
                      const isStundenlohn = itemType.code === "02" || itemType.name.toLowerCase().includes("stundenlohn");
                      
                      return (
                        <TableRow key={itemType.code} className="h-8">
                          <TableCell className="py-1 text-xs font-medium">{itemType.name}</TableCell>
                          <TableCell className="py-1">
                            <Input
                              value={row.description}
                              onChange={(e) => updatePayrollRow(itemType.code, "description", e.target.value)}
                              placeholder="Optional"
                              className="h-7 text-xs"
                              data-testid={`input-description-${itemType.code}`}
                            />
                          </TableCell>
                          <TableCell className="py-1">
                            {isStundenlohn ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={row.hours}
                                onChange={(e) => updatePayrollRow(itemType.code, "hours", e.target.value)}
                                placeholder="0.00"
                                className="h-7 text-xs text-right"
                                data-testid={`input-hours-${itemType.code}`}
                              />
                            ) : (
                              <div className="h-7" />
                            )}
                          </TableCell>
                          <TableCell className="py-1">
                            {isStundenlohn ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={row.hourlyRate}
                                onChange={(e) => updatePayrollRow(itemType.code, "hourlyRate", e.target.value)}
                                placeholder="0.00"
                                className="h-7 text-xs text-right"
                                data-testid={`input-hourly-rate-${itemType.code}`}
                              />
                            ) : (
                              <div className="h-7" />
                            )}
                          </TableCell>
                          <TableCell className="py-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={row.amount}
                              onChange={(e) => updatePayrollRow(itemType.code, "amount", e.target.value)}
                              placeholder="0.00"
                              className="h-7 text-xs text-right font-medium"
                              data-testid={`input-amount-${itemType.code}`}
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

        <Card className="py-2">
          <CardContent className="py-0">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2 bg-secondary/50 rounded-md">
                <p className="text-xs text-muted-foreground">Bruttolohn</p>
                <p className="text-lg font-bold" data-testid="text-gross-salary">
                  CHF {grossSalary.toFixed(2)}
                </p>
              </div>
              <div className="p-2 bg-secondary/50 rounded-md">
                <p className="text-xs text-muted-foreground">Abzüge</p>
                <p className="text-lg font-bold text-destructive" data-testid="text-deductions">
                  CHF {totalDeductions.toFixed(2)}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-md">
                <p className="text-xs text-muted-foreground">Nettolohn</p>
                <p className="text-lg font-bold text-primary" data-testid="text-net-salary">
                  CHF {netSalary.toFixed(2)}
                </p>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="grid grid-cols-4 gap-x-4 gap-y-1">
              {deductions.map((deduction, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {deduction.type} {deduction.percentage && `(${deduction.percentage}%)`}
                  </span>
                  <span className="font-medium">CHF {parseFloat(deduction.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
