import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Download, Lock, Unlock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  isLocked: boolean;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function Payroll() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  const buildQueryKey = () => {
    const key: any[] = ['/api/payroll/payments'];
    if (selectedYear || selectedMonth) {
      const params: Record<string, any> = {};
      if (selectedYear) params.year = selectedYear;
      if (selectedMonth) params.month = selectedMonth;
      key.push(params);
    }
    return key;
  };

  const buildQueryUrl = () => {
    const params = new URLSearchParams();
    if (selectedYear) params.append('year', selectedYear.toString());
    if (selectedMonth) params.append('month', selectedMonth.toString());
    const queryString = params.toString();
    return `/api/payroll/payments${queryString ? `?${queryString}` : ''}`;
  };

  const { data: payments, isLoading } = useQuery<PayrollPaymentWithEmployee[]>({
    queryKey: buildQueryKey(),
    queryFn: async () => {
      const res = await fetch(buildQueryUrl(), { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const lockMutation = useMutation({
    mutationFn: (paymentId: string) => 
      apiRequest("POST", `/api/payroll/payments/${paymentId}/lock`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments"] });
      toast({
        title: "Abgeschlossen",
        description: "Die Lohnauszahlung wurde abgeschlossen",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Lohnauszahlung konnte nicht abgeschlossen werden",
        variant: "destructive",
      });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (paymentId: string) => 
      apiRequest("POST", `/api/payroll/payments/${paymentId}/unlock`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments"] });
      toast({
        title: "Entsperrt",
        description: "Die Lohnauszahlung kann wieder bearbeitet werden",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Lohnauszahlung konnte nicht entsperrt werden",
        variant: "destructive",
      });
    },
  });

  // Reset selections when payments list changes (e.g., filter changes)
  useEffect(() => {
    if (payments) {
      const currentPaymentIds = payments.map(p => p.id);
      // Keep only selections that are still in the current list
      setSelectedPayments(prev => prev.filter(id => currentPaymentIds.includes(id)));
    }
  }, [payments]);

  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  const availableYears = [2023, 2024, 2025, 2026];

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked && payments) {
      setSelectedPayments(payments.map(p => p.id));
    } else {
      setSelectedPayments([]);
    }
  };

  // Handle individual selection
  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayments([...selectedPayments, paymentId]);
    } else {
      setSelectedPayments(selectedPayments.filter(id => id !== paymentId));
    }
  };

  // Check if all are selected
  const allSelected = payments && payments.length > 0 && selectedPayments.length === payments.length;
  const someSelected = selectedPayments.length > 0 && selectedPayments.length < (payments?.length || 0);

  // Handle bulk PDF export
  const handleBulkPdfExport = () => {
    if (selectedPayments.length === 0) {
      toast({
        title: "Keine Auswahl",
        description: "Bitte wählen Sie mindestens eine Auszahlung aus",
        variant: "destructive",
      });
      return;
    }

    // Open PDF export in new tab
    const paymentIds = selectedPayments.join(',');
    window.open(`/api/pdf/payroll/bulk?ids=${paymentIds}`, '_blank');
    
    toast({
      title: "PDF wird generiert",
      description: `${selectedPayments.length} Lohnabrechnung(en) werden exportiert`,
    });
  };

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
        <div className="flex gap-2">
          {selectedPayments.length > 0 && (
            <Button 
              variant="outline"
              onClick={handleBulkPdfExport}
              data-testid="button-bulk-pdf-export"
            >
              <Download className="h-4 w-4 mr-2" />
              {selectedPayments.length} als PDF
            </Button>
          )}
          <Link href="/payroll/new">
            <Button data-testid="button-new-payment">
              <Plus className="h-4 w-4 mr-2" />
              Neue Auszahlung
            </Button>
          </Link>
        </div>
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
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Alle auswählen"
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>Auszahlungsdatum</TableHead>
                  <TableHead className="text-right">Bruttolohn</TableHead>
                  <TableHead className="text-right">Abzüge</TableHead>
                  <TableHead className="text-right">Nettolohn</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPayments.includes(payment.id)}
                        onCheckedChange={(checked) => handleSelectPayment(payment.id, checked as boolean)}
                        aria-label={`Auswählen ${payment.employee.firstName} ${payment.employee.lastName}`}
                        data-testid={`checkbox-payment-${payment.id}`}
                      />
                    </TableCell>
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
                    <TableCell>
                      {payment.isLocked ? (
                        <Badge variant="secondary" data-testid={`badge-locked-${payment.id}`}>
                          Abgeschlossen
                        </Badge>
                      ) : (
                        <Badge variant="outline" data-testid={`badge-unlocked-${payment.id}`}>
                          Offen
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {payment.isLocked ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => unlockMutation.mutate(payment.id)}
                            disabled={unlockMutation.isPending}
                            data-testid={`button-unlock-${payment.id}`}
                            title="Entsperren"
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => lockMutation.mutate(payment.id)}
                            disabled={lockMutation.isPending}
                            data-testid={`button-lock-${payment.id}`}
                            title="Abschliessen"
                          >
                            <Unlock className="h-4 w-4" />
                          </Button>
                        )}
                        <Link href={`/payroll/${payment.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-view-${payment.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
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
