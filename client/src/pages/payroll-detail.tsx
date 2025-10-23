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
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, FileDown, Lock, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface PayrollItem {
  id: string;
  type: string;
  description: string | null;
  amount: string;
  hours: number | null;
  rate: string | null;
}

interface Deduction {
  id: string;
  type: string;
  description: string | null;
  amount: string;
  rate: string | null;
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
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    ahvNumber: string;
    address: string;
    email: string;
  };
  items: PayrollItem[];
  deductions: Deduction[];
}

export default function PayrollDetail({ params }: { params: { id: string } }) {
  const { data: payment, isLoading } = useQuery<PayrollPaymentDetail>({
    queryKey: ["/api/payroll/payments", params.id],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-6">
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/payroll">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="heading-payment-detail">
              Lohnabrechnung
            </h1>
            <p className="text-sm text-muted-foreground">
              {payment.employee.firstName} {payment.employee.lastName} -{" "}
              {new Date(payment.paymentDate).toLocaleDateString("de-CH")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {payment.isLocked && (
            <Badge variant="secondary" data-testid="badge-locked">
              <Lock className="h-3 w-3 mr-1" />
              Abgeschlossen
            </Badge>
          )}
          {!payment.isLocked && (
            <Link href={`/payroll/${payment.id}/edit`}>
              <Button variant="outline" data-testid="button-edit-payment">
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            data-testid="button-export-pdf"
            onClick={() => {
              window.open(`/api/pdf/payroll/${payment.id}`, '_blank');
            }}
          >
            <FileDown className="h-4 w-4 mr-2" />
            PDF Export
          </Button>
        </div>
      </div>

      {payment.isLocked && (
        <Alert data-testid="alert-locked">
          <Lock className="h-4 w-4" />
          <AlertTitle>Abgeschlossene Lohnauszahlung</AlertTitle>
          <AlertDescription>
            Diese Lohnauszahlung wurde abgeschlossen und kann nicht mehr bearbeitet werden. 
            Sie können die Auszahlung in der Lohnauszahlungsliste entsperren, falls Änderungen nötig sind.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mitarbeiterinformationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name:</span>
              <span className="text-sm font-medium">
                {payment.employee.firstName} {payment.employee.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">AHV-Nr:</span>
              <span className="text-sm font-mono">{payment.employee.ahvNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="text-sm">{payment.employee.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Adresse:</span>
              <span className="text-sm text-right">{payment.employee.address}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zahlungsdetails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Zeitraum:</span>
              <span className="text-sm font-medium">
                {new Date(payment.periodStart).toLocaleDateString("de-CH")} -{" "}
                {new Date(payment.periodEnd).toLocaleDateString("de-CH")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Auszahlungsdatum:</span>
              <span className="text-sm font-medium">
                {new Date(payment.paymentDate).toLocaleDateString("de-CH")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Monat/Jahr:</span>
              <span className="text-sm font-medium">
                {payment.paymentMonth}/{payment.paymentYear}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lohnarten</CardTitle>
        </CardHeader>
        <CardContent>
          {payment.items && payment.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="text-center">Stunden</TableHead>
                  <TableHead className="text-right">Ansatz</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payment.items.map((item) => (
                  <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                    <TableCell>
                      <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                    <TableCell>{item.description || "-"}</TableCell>
                    <TableCell className="text-center font-mono">
                      {item.hours !== null && item.hours !== undefined ? Number(item.hours).toFixed(2) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.hourlyRate !== null && item.hourlyRate !== undefined
                        ? `CHF ${Number(item.hourlyRate).toLocaleString("de-CH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      CHF{" "}
                      {Number(item.amount).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Lohnarten erfasst
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abzüge</CardTitle>
        </CardHeader>
        <CardContent>
          {payment.deductions && payment.deductions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="text-right">Ansatz</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payment.deductions.map((deduction) => (
                  <TableRow key={deduction.id} data-testid={`row-deduction-${deduction.id}`}>
                    <TableCell>
                      <Badge variant="secondary">{deduction.type}</Badge>
                    </TableCell>
                    <TableCell>{deduction.description || "-"}</TableCell>
                    <TableCell className="text-right font-mono">
                      {deduction.percentage !== null && deduction.percentage !== undefined ? `${Number(deduction.percentage).toFixed(2)}%` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-destructive">
                      - CHF{" "}
                      {Number(deduction.amount).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Abzüge erfasst
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bruttolohn:</span>
              <span className="text-lg font-mono font-medium">
                CHF{" "}
                {Number(payment.grossSalary).toLocaleString("de-CH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Abzüge:</span>
              <span className="text-lg font-mono font-medium text-destructive">
                - CHF{" "}
                {Number(payment.totalDeductions).toLocaleString("de-CH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-base font-semibold">Nettolohn:</span>
              <span className="text-2xl font-mono font-bold text-primary">
                CHF{" "}
                {Number(payment.netSalary).toLocaleString("de-CH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
