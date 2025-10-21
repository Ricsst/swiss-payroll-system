import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface PayrollPaymentWithEmployee {
  id: string;
  paymentDate: string;
  periodStart: string;
  periodEnd: string;
  paymentMonth: number;
  paymentYear: number;
  grossSalary: string;
  totalDeductions: string;
  netSalary: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function Payroll() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const { data: payments, isLoading } = useQuery<PayrollPaymentWithEmployee[]>({
    queryKey: ["/api/payroll/payments", selectedYear, selectedMonth],
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
          <h1 className="text-2xl font-semibold" data-testid="heading-payroll">
            Lohnauszahlungen
          </h1>
          <p className="text-sm text-muted-foreground">
            Erfassen und verwalten Sie Lohnauszahlungen
          </p>
        </div>
        <Link href="/payroll/new">
          <Button data-testid="button-new-payment">
            <Plus className="h-4 w-4 mr-2" />
            Neue Auszahlung
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              {availableYears.map((year) => (
                <Button
                  key={year}
                  variant={selectedYear === year ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedYear(year)}
                  data-testid={`button-year-${year}`}
                >
                  {year}
                </Button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedMonth === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMonth(null)}
                data-testid="button-month-all"
              >
                Alle
              </Button>
              {monthNames.map((month, index) => (
                <Button
                  key={month}
                  variant={selectedMonth === index + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMonth(index + 1)}
                  data-testid={`button-month-${index + 1}`}
                >
                  {month.substring(0, 3)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auszahlungen</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payments && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>Auszahlungsdatum</TableHead>
                  <TableHead className="text-right">Bruttolohn</TableHead>
                  <TableHead className="text-right">Abzüge</TableHead>
                  <TableHead className="text-right">Nettolohn</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                    <TableCell className="font-medium">
                      {payment.employee.firstName} {payment.employee.lastName}
                    </TableCell>
                    <TableCell>
                      {new Date(payment.periodStart).toLocaleDateString("de-CH")} -{" "}
                      {new Date(payment.periodEnd).toLocaleDateString("de-CH")}
                    </TableCell>
                    <TableCell>
                      {new Date(payment.paymentDate).toLocaleDateString("de-CH")}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      CHF {Number(payment.grossSalary).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      CHF {Number(payment.totalDeductions).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      CHF {Number(payment.netSalary).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/payroll/${payment.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-view-${payment.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Keine Auszahlungen gefunden</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedMonth
                  ? `Für ${monthNames[selectedMonth - 1]} ${selectedYear}`
                  : `Für ${selectedYear}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
