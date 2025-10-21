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
import { FileDown, FileSpreadsheet, FileType } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface YearlyReportData {
  year: number;
  months: Array<{
    month: number;
    monthName: string;
    grossSalary: string;
    deductions: string;
    netSalary: string;
    paymentsCount: number;
  }>;
  totals: {
    grossSalary: string;
    deductions: string;
    netSalary: string;
    paymentsCount: number;
  };
}

export default function YearlyReport() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: report, isLoading } = useQuery<YearlyReportData>({
    queryKey: ["/api/reports/yearly", selectedYear],
  });

  const availableYears = [2023, 2024, 2025, 2026];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="heading-yearly-report">
            Jahresabrechnung
          </h1>
          <p className="text-sm text-muted-foreground">
            Übersicht aller 12 Monate für den Lohnausweis
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="button-export-yearly">
              <FileDown className="h-4 w-4 mr-2" />
              Exportieren
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              window.open(`/api/pdf/yearly-report?year=${selectedYear}`, '_blank');
            }}>
              <FileType className="h-4 w-4 mr-2" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              window.open(`/api/excel/yearly-report?year=${selectedYear}&format=xlsx`, '_blank');
            }}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel (XLSX)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              window.open(`/api/excel/yearly-report?year=${selectedYear}&format=csv`, '_blank');
            }}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jahr auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="max-w-xs" data-testid="select-year">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jahresabrechnung {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : report && report.months.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Monat</TableHead>
                  <TableHead className="text-center">Anzahl Auszahlungen</TableHead>
                  <TableHead className="text-right">Bruttolohn</TableHead>
                  <TableHead className="text-right">Abzüge</TableHead>
                  <TableHead className="text-right">Nettolohn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.months.map((month) => (
                  <TableRow key={month.month} data-testid={`row-month-${month.month}`}>
                    <TableCell className="font-medium">{month.monthName}</TableCell>
                    <TableCell className="text-center">
                      {month.paymentsCount}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      CHF {Number(month.grossSalary).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      CHF {Number(month.deductions).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      CHF {Number(month.netSalary).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Gesamt {selectedYear}</TableCell>
                  <TableCell className="text-center font-semibold">
                    {report.totals.paymentsCount}
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
                Keine Auszahlungen für {selectedYear}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
