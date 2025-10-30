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
import { ArrowLeft, FileDown, Lock, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";

interface PayrollItem {
  id: string;
  type: string;
  description: string | null;
  amount: string;
  hours: number | null;
  hourlyRate: string | null;
}

interface Deduction {
  id: string;
  type: string;
  description: string | null;
  amount: string;
  percentage: string | null;
  baseAmount: string | null;
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

interface PayrollPaymentListItem {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
  };
}

export default function PayrollDetail({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  
  // Get filter params from URL
  const urlParams = new URLSearchParams(window.location.search);
  const filterYear = urlParams.get('year');
  const filterMonth = urlParams.get('month');
  
  const { data: payment, isLoading } = useQuery<PayrollPaymentDetail>({
    queryKey: ["/api/payroll/payments", params.id],
  });
  
  // Get all filtered payments for navigation
  const buildFilterQueryUrl = () => {
    const params = new URLSearchParams();
    if (filterYear) params.append('year', filterYear);
    if (filterMonth) params.append('month', filterMonth);
    const queryString = params.toString();
    return `/api/payroll/payments${queryString ? `?${queryString}` : ''}`;
  };
  
  const { data: filteredPayments } = useQuery<PayrollPaymentListItem[]>({
    queryKey: [buildFilterQueryUrl()],
    enabled: !!filterYear || !!filterMonth,
  });
  
  // Find current position in filtered list
  const currentIndex = filteredPayments?.findIndex(p => p.id === params.id) ?? -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && filteredPayments && currentIndex < filteredPayments.length - 1;
  
  const navigateToPrevious = () => {
    if (hasPrevious && filteredPayments) {
      const prevId = filteredPayments[currentIndex - 1].id;
      const queryString = urlParams.toString();
      setLocation(`/payroll/${prevId}${queryString ? `?${queryString}` : ''}`);
    }
  };
  
  const navigateToNext = () => {
    if (hasNext && filteredPayments) {
      const nextId = filteredPayments[currentIndex + 1].id;
      const queryString = urlParams.toString();
      setLocation(`/payroll/${nextId}${queryString ? `?${queryString}` : ''}`);
    }
  };

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/payroll">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold" data-testid="heading-payment-detail">
              Lohnabrechnung
            </h1>
            <p className="text-xs text-muted-foreground">
              {payment.employee.firstName} {payment.employee.lastName} -{" "}
              {new Date(payment.paymentDate).toLocaleDateString("de-CH")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {filteredPayments && filteredPayments.length > 1 && (
            <div className="flex items-center gap-1 mr-2">
              <Button 
                variant="outline" 
                size="icon"
                disabled={!hasPrevious}
                onClick={navigateToPrevious}
                data-testid="button-previous-payment"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {currentIndex + 1} / {filteredPayments.length}
              </span>
              <Button 
                variant="outline" 
                size="icon"
                disabled={!hasNext}
                onClick={navigateToNext}
                data-testid="button-next-payment"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {payment.isLocked && (
            <Badge variant="secondary" data-testid="badge-locked">
              <Lock className="h-3 w-3 mr-1" />
              Abgeschlossen
            </Badge>
          )}
          {!payment.isLocked && (
            <Link href={`/payroll/${payment.id}/edit`}>
              <Button size="sm" variant="outline" data-testid="button-edit-payment">
                <Edit className="h-3 w-3 mr-1" />
                Bearbeiten
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            variant="outline"
            data-testid="button-export-pdf"
            onClick={() => {
              window.open(`/api/pdf/payroll/${payment.id}`, '_blank');
            }}
          >
            <FileDown className="h-3 w-3 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {payment.isLocked && (
        <Alert data-testid="alert-locked" className="py-2">
          <Lock className="h-4 w-4" />
          <AlertTitle className="text-sm">Abgeschlossen</AlertTitle>
          <AlertDescription className="text-xs">
            Diese Lohnauszahlung kann nicht bearbeitet werden. In der Lohnauszahlungsliste entsperren.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm">Mitarbeiterinformationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 px-4 py-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Name:</span>
              <span className="text-xs font-medium">
                {payment.employee.firstName} {payment.employee.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">AHV-Nr:</span>
              <span className="text-xs font-mono">{payment.employee.ahvNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Email:</span>
              <span className="text-xs">{payment.employee.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Adresse:</span>
              <span className="text-xs text-right">{payment.employee.address}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm">Zahlungsdetails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 px-4 py-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Zeitraum:</span>
              <span className="text-xs font-medium">
                {new Date(payment.periodStart).toLocaleDateString("de-CH")} -{" "}
                {new Date(payment.periodEnd).toLocaleDateString("de-CH")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Auszahlungsdatum:</span>
              <span className="text-xs font-medium">
                {new Date(payment.paymentDate).toLocaleDateString("de-CH")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Monat/Jahr:</span>
              <span className="text-xs font-medium">
                {payment.paymentMonth}/{payment.paymentYear}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm">Lohnarten</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-2">
          {payment.items && payment.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="h-7">
                  <TableHead className="text-xs py-1">Typ</TableHead>
                  <TableHead className="text-xs py-1">Beschreibung</TableHead>
                  <TableHead className="text-xs py-1 text-center">Std.</TableHead>
                  <TableHead className="text-xs py-1 text-right">Ansatz</TableHead>
                  <TableHead className="text-xs py-1 text-right">Betrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payment.items.map((item) => (
                  <TableRow key={item.id} data-testid={`row-item-${item.id}`} className="h-7">
                    <TableCell className="py-1">
                      <Badge variant="outline" className="text-xs h-5">{item.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs py-1">{item.description || "-"}</TableCell>
                    <TableCell className="text-xs py-1 text-center font-mono">
                      {item.hours !== null && item.hours !== undefined ? Number(item.hours).toFixed(2) : "-"}
                    </TableCell>
                    <TableCell className="text-xs py-1 text-right font-mono">
                      {item.hourlyRate !== null && item.hourlyRate !== undefined
                        ? `CHF ${Number(item.hourlyRate).toLocaleString("de-CH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs py-1 text-right font-mono font-medium">
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
            <p className="text-xs text-muted-foreground text-center py-2">
              Keine Lohnarten erfasst
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm">Abzüge</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-2">
          {payment.deductions && payment.deductions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="h-7">
                  <TableHead className="text-xs py-1">Typ</TableHead>
                  <TableHead className="text-xs py-1">Beschreibung</TableHead>
                  <TableHead className="text-xs py-1 text-right">Ansatz</TableHead>
                  <TableHead className="text-xs py-1 text-right">Betrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payment.deductions.map((deduction) => (
                  <TableRow key={deduction.id} data-testid={`row-deduction-${deduction.id}`} className="h-7">
                    <TableCell className="py-1">
                      <Badge variant="secondary" className="text-xs h-5">{deduction.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs py-1">{deduction.description || "-"}</TableCell>
                    <TableCell className="text-xs py-1 text-right font-mono">
                      {deduction.percentage !== null && deduction.percentage !== undefined ? `${Number(deduction.percentage).toFixed(2)}%` : "-"}
                    </TableCell>
                    <TableCell className="text-xs py-1 text-right font-mono font-medium text-destructive">
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
            <p className="text-xs text-muted-foreground text-center py-2">
              Keine Abzüge erfasst
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm">Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Bruttolohn:</span>
              <span className="text-sm font-mono font-medium">
                CHF{" "}
                {Number(payment.grossSalary).toLocaleString("de-CH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Total Abzüge:</span>
              <span className="text-sm font-mono font-medium text-destructive">
                - CHF{" "}
                {Number(payment.totalDeductions).toLocaleString("de-CH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="border-t pt-1 flex justify-between items-center">
              <span className="text-sm font-semibold">Nettolohn:</span>
              <span className="text-lg font-mono font-bold text-primary">
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
