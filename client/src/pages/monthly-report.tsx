import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { downloadFile } from "@/lib/queryClient";
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
  TableFooter,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, FileSpreadsheet, FileType, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface MonthlyReportData {
  month: number;
  year: number;
  employees: Array<{
    employeeId: string;
    employeeName: string;
    totalGrossSalary: string;
    totalDeductions: string;
    totalNetSalary: string;
    paymentsCount: number;
  }>;
  totals: {
    grossSalary: string;
    deductions: string;
    netSalary: string;
  };
  deductionSummary: Array<{
    type: string;
    amount: string;
  }>;
  totalEmployees: number;
  totalPayments: number;
}

export default function MonthlyReport() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: report, isLoading } = useQuery<MonthlyReportData>({
    queryKey: [`/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`],
  });

  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  const availableYears = [2023, 2024, 2025, 2026];
  
  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };
  
  const toggleAllEmployees = () => {
    if (!report) return;
    if (selectedEmployees.size === report.employees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(report.employees.map(e => e.employeeId)));
    }
  };
  
  const downloadMonthlyPayslips = async () => {
    if (selectedEmployees.size === 0) {
      toast({
        title: "Keine Auswahl",
        description: "Bitte wählen Sie mindestens einen Mitarbeiter aus.",
        variant: "destructive",
      });
      return;
    }
    
    const employeeIds = Array.from(selectedEmployees).join(',');
    const url = `/api/pdf/monthly-payslips?year=${selectedYear}&month=${selectedMonth}&employeeIds=${employeeIds}`;
    
    // Create invisible link to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `Monatslohnabrechnungen_${monthNames[selectedMonth - 1]}_${selectedYear}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="heading-monthly-report">
            Monatsabrechnung
          </h1>
          <p className="text-sm text-muted-foreground">
            Übersicht aller Lohnauszahlungen pro Monat
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="button-export-monthly">
              <FileDown className="h-4 w-4 mr-2" />
              Exportieren
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => downloadFile(`/api/pdf/monthly-report?year=${selectedYear}&month=${selectedMonth}`)}>
              <FileType className="h-4 w-4 mr-2" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadFile(`/api/excel/monthly-report?year=${selectedYear}&month=${selectedMonth}&format=xlsx`)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel (XLSX)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadFile(`/api/excel/monthly-report?year=${selectedYear}&month=${selectedMonth}&format=csv`)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monat auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : report && report.employees.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mitarbeiter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalEmployees}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bruttolohn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  CHF {Number(report.totals.grossSalary).toLocaleString("de-CH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Abzüge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  CHF {Number(report.totals.deductions).toLocaleString("de-CH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Nettolohn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  CHF {Number(report.totals.netSalary).toLocaleString("de-CH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deduction Summary */}
          {report.deductionSummary && report.deductionSummary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Abzüge Übersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {report.deductionSummary.map((deduction) => (
                    <div key={deduction.type} className="border rounded-lg p-3">
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        {deduction.type}
                      </div>
                      <div className="text-lg font-bold">
                        CHF {Number(deduction.amount).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employee Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
              <CardTitle>
                Mitarbeiter Übersicht - {monthNames[selectedMonth - 1]} {selectedYear}
              </CardTitle>
              <Button
                onClick={downloadMonthlyPayslips}
                disabled={selectedEmployees.size === 0}
                data-testid="button-download-monthly-payslips"
              >
                <FileText className="h-4 w-4 mr-2" />
                Lohnabrechnungen ({selectedEmployees.size})
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={report.employees.length > 0 && selectedEmployees.size === report.employees.length}
                        onCheckedChange={toggleAllEmployees}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead className="text-center">Anzahl Auszahlungen</TableHead>
                    <TableHead className="text-right">Bruttolohn</TableHead>
                    <TableHead className="text-right">Abzüge</TableHead>
                    <TableHead className="text-right">Nettolohn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.employees.map((employee) => (
                    <TableRow key={employee.employeeId} data-testid={`row-employee-${employee.employeeId}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployees.has(employee.employeeId)}
                          onCheckedChange={() => toggleEmployeeSelection(employee.employeeId)}
                          data-testid={`checkbox-employee-${employee.employeeId}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {employee.employeeName}
                      </TableCell>
                      <TableCell className="text-center">
                        {employee.paymentsCount}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        CHF {Number(employee.totalGrossSalary).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        CHF {Number(employee.totalDeductions).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        CHF {Number(employee.totalNetSalary).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">
                      Total {monthNames[selectedMonth - 1]} {selectedYear}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      CHF {Number(report.totals.grossSalary).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      CHF {Number(report.totals.deductions).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      CHF {Number(report.totals.netSalary).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">
                Keine Auszahlungen für {monthNames[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
