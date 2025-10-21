import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { FileDown } from "lucide-react";

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
}

export default function MonthlyReport() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const { data: report, isLoading } = useQuery<MonthlyReportData>({
    queryKey: ["/api/reports/monthly", selectedYear, selectedMonth],
  });

  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  const availableYears = [2023, 2024, 2025, 2026];

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
        <Button variant="outline" data-testid="button-export-monthly">
          <FileDown className="h-4 w-4 mr-2" />
          Exportieren
        </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>
            Monatsabrechnung {monthNames[selectedMonth - 1]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : report && report.employees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableCell colSpan={2} className="font-semibold">
                    Gesamt
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
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Keine Auszahlungen für {monthNames[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
