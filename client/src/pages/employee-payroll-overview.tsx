import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { Employee } from "@shared/schema";

interface EmployeePayrollOverview {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    ahvNumber: string;
    entryDate: string | null;
    exitDate: string | null;
    isNbuInsured: boolean;
  };
  year: number;
  payrollItems: Array<{
    code: string;
    name: string;
    months: Record<number, string>;
    total: string;
  }>;
  deductions: Array<{
    type: string;
    months: Record<number, string>;
    total: string;
  }>;
  grossMonthlyTotals: Record<number, string>;
  deductionMonthlyTotals: Record<number, string>;
  totalGross: string;
  totalDeductions: string;
  // Basis amounts and special wages
  ahvBasis: Record<number, string>;
  alv1Basis: Record<number, string>;
  alv2Basis: Record<number, string>;
  alv1Wage: Record<number, string>;
  alv2Wage: Record<number, string>;
  nbuBasis: Record<number, string>;
  bvg: Record<number, string>;
  // Totals
  totalAhvBasis: string;
  totalAlv1Basis: string;
  totalAlv2Basis: string;
  totalAlv1Wage: string;
  totalAlv2Wage: string;
  totalNbuBasis: string;
  totalBvg: string;
}

export default function EmployeePayrollOverview() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Sort employees by name for better UX (active first, then inactive)
  const sortedEmployees = [...employees].sort((a, b) => {
    const aActive = !a.exitDate || new Date(a.exitDate) > new Date();
    const bActive = !b.exitDate || new Date(b.exitDate) > new Date();
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
  });

  const { data: overview, isLoading } = useQuery<EmployeePayrollOverview>({
    queryKey: ["/api/reports/employee-payroll-overview", { employeeId: selectedEmployeeId, year: selectedYear }],
    queryFn: async () => {
      if (!selectedEmployeeId) return null;
      const res = await fetch(`/api/reports/employee-payroll-overview?employeeId=${selectedEmployeeId}&year=${selectedYear}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!selectedEmployeeId,
  });

  // Generate year range dynamically: 5 years back to 2 years forward
  const generateYearRange = () => {
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  const availableYears = generateYearRange();

  const monthNames = ["Jan.", "Feb.", "März", "April", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez.", "13."];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="heading-employee-payroll-overview">
          Lohnauszahlung pro Mitarbeiter
        </h1>
        <p className="text-sm text-muted-foreground">
          Jahresübersicht aller Lohnauszahlungen pro Mitarbeiter
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Mitarbeiter</label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Mitarbeiter wählen" />
                </SelectTrigger>
                <SelectContent>
                  {sortedEmployees.map((emp) => {
                    const isActive = !emp.exitDate || new Date(emp.exitDate) > new Date();
                    return (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} {!isActive && "(Inaktiv)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <label className="text-sm font-medium mb-1 block">Jahr</label>
              <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
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
        </CardHeader>
      </Card>

      {!selectedEmployeeId ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              Bitte wählen Sie einen Mitarbeiter aus
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : overview ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {overview.employee.firstName} {overview.employee.lastName} - 
              AHV: {overview.employee.ahvNumber} - 
              Eintritt: {overview.employee.entryDate ? new Date(overview.employee.entryDate).toLocaleDateString("de-CH") : "..."} - 
              Austritt: {overview.employee.exitDate ? new Date(overview.employee.exitDate).toLocaleDateString("de-CH") : "..."}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 text-xs">Nr.</TableHead>
                    <TableHead className="w-48 text-xs">Legende</TableHead>
                    {monthNames.map((month) => (
                      <TableHead key={month} className="text-right text-xs w-24">
                        {month}
                      </TableHead>
                    ))}
                    <TableHead className="text-right text-xs w-32 font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Payroll Items */}
                  {overview.payrollItems.map((item) => (
                    <TableRow key={item.code}>
                      <TableCell className="text-xs font-mono">{item.code}</TableCell>
                      <TableCell className="text-xs font-medium">{item.name}</TableCell>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((month) => (
                        <TableCell key={month} className="text-right text-xs font-mono">
                          {parseFloat(item.months[month] || "0") > 0
                            ? `${parseFloat(item.months[month]).toFixed(2)} +`
                            : "0.00"}
                        </TableCell>
                      ))}
                      <TableCell className="text-right text-xs font-mono font-semibold">
                        {parseFloat(item.total) > 0
                          ? `${parseFloat(item.total).toFixed(2)} +`
                          : "0.00"}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Gross Total Row */}
                  <TableRow className="bg-secondary/50 font-semibold">
                    <TableCell colSpan={2} className="text-xs">BRUTTOLOHN</TableCell>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((month) => (
                      <TableCell key={month} className="text-right text-xs font-mono">
                        {parseFloat(overview.grossMonthlyTotals[month] || "0").toFixed(2)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right text-xs font-mono">
                      {parseFloat(overview.totalGross).toFixed(2)}
                    </TableCell>
                  </TableRow>

                  {/* Deductions */}
                  {overview.deductions.map((deduction) => (
                    <TableRow key={deduction.type}>
                      <TableCell className="text-xs font-mono"></TableCell>
                      <TableCell className="text-xs font-medium">{deduction.type}</TableCell>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((month) => (
                        <TableCell key={month} className="text-right text-xs font-mono">
                          {parseFloat(deduction.months[month] || "0") > 0
                            ? `${parseFloat(deduction.months[month]).toFixed(2)} -`
                            : "0.00"}
                        </TableCell>
                      ))}
                      <TableCell className="text-right text-xs font-mono">
                        {parseFloat(deduction.total) > 0
                          ? `${parseFloat(deduction.total).toFixed(2)} -`
                          : "0.00"}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total Deductions Row */}
                  <TableRow className="bg-secondary/50 font-semibold">
                    <TableCell colSpan={2} className="text-xs">TOTAL ABZÜGE</TableCell>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((month) => (
                      <TableCell key={month} className="text-right text-xs font-mono">
                        {parseFloat(overview.deductionMonthlyTotals[month] || "0").toFixed(2)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right text-xs font-mono">
                      {parseFloat(overview.totalDeductions).toFixed(2)}
                    </TableCell>
                  </TableRow>

                  {/* Net Salary Row */}
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell colSpan={2} className="text-xs">NETTOLOHN</TableCell>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((month) => {
                      const gross = parseFloat(overview.grossMonthlyTotals[month] || "0");
                      const deductions = parseFloat(overview.deductionMonthlyTotals[month] || "0");
                      const net = gross - deductions;
                      return (
                        <TableCell key={month} className="text-right text-xs font-mono" data-testid={`net-month-${month}`}>
                          {net.toFixed(2)}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right text-xs font-mono" data-testid="net-total">
                      {(parseFloat(overview.totalGross) - parseFloat(overview.totalDeductions)).toFixed(2)}
                    </TableCell>
                  </TableRow>

                  {/* Spacer Row */}
                  <TableRow>
                    <TableCell colSpan={15} className="h-4 bg-muted/20"></TableCell>
                  </TableRow>

                  {/* Basis Amounts Section Header */}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={2} className="text-xs font-bold">BASISBETRÄGE</TableCell>
                    <TableCell colSpan={14}></TableCell>
                  </TableRow>

                  {/* AHV Basis Row */}
                  <TableRow>
                    <TableCell className="text-xs font-mono"></TableCell>
                    <TableCell className="text-xs font-medium">AHV Basis</TableCell>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((month) => (
                      <TableCell key={month} className="text-right text-xs font-mono">
                        {parseFloat(overview.ahvBasis[month] || "0").toFixed(2)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right text-xs font-mono font-semibold">
                      {parseFloat(overview.totalAhvBasis).toFixed(2)}
                    </TableCell>
                  </TableRow>

                  {/* ALV1 Basis Row */}
                  <TableRow>
                    <TableCell className="text-xs font-mono"></TableCell>
                    <TableCell className="text-xs font-medium">ALV1 Basis (bis CHF 148'200)</TableCell>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((month) => (
                      <TableCell key={month} className="text-right text-xs font-mono">
                        {parseFloat(overview.alv1Basis[month] || "0").toFixed(2)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right text-xs font-mono font-semibold">
                      {parseFloat(overview.totalAlv1Basis).toFixed(2)}
                    </TableCell>
                  </TableRow>

                  {/* ALV2 Basis Row */}
                  <TableRow>
                    <TableCell className="text-xs font-mono"></TableCell>
                    <TableCell className="text-xs font-medium">ALV2 Basis (über CHF 148'200)</TableCell>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((month) => (
                      <TableCell key={month} className="text-right text-xs font-mono">
                        {parseFloat(overview.alv2Basis[month] || "0").toFixed(2)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right text-xs font-mono font-semibold">
                      {parseFloat(overview.totalAlv2Basis).toFixed(2)}
                    </TableCell>
                  </TableRow>

                  {/* ALV2 Lohn Row */}
                  <TableRow>
                    <TableCell className="text-xs font-mono"></TableCell>
                    <TableCell className="text-xs font-medium">ALV2 Lohn (über CHF 148'200)</TableCell>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((month) => (
                      <TableCell key={month} className="text-right text-xs font-mono">
                        {parseFloat(overview.alv2Wage[month] || "0").toFixed(2)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right text-xs font-mono font-semibold">
                      {parseFloat(overview.totalAlv2Wage).toFixed(2)}
                    </TableCell>
                  </TableRow>

                  {/* NBU Basis Row */}
                  <TableRow>
                    <TableCell className="text-xs font-mono"></TableCell>
                    <TableCell className="text-xs font-medium">
                      NBU Basis {!overview.employee.isNbuInsured && "(nicht NBU-pflichtig)"}
                    </TableCell>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((month) => (
                      <TableCell key={month} className="text-right text-xs font-mono">
                        {parseFloat(overview.nbuBasis[month] || "0").toFixed(2)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right text-xs font-mono font-semibold">
                      {parseFloat(overview.totalNbuBasis).toFixed(2)}
                    </TableCell>
                  </TableRow>

                  {/* BVG Row */}
                  <TableRow>
                    <TableCell className="text-xs font-mono"></TableCell>
                    <TableCell className="text-xs font-medium">BVG</TableCell>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((month) => (
                      <TableCell key={month} className="text-right text-xs font-mono">
                        {parseFloat(overview.bvg[month] || "0").toFixed(2)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right text-xs font-mono font-semibold">
                      {parseFloat(overview.totalBvg).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
