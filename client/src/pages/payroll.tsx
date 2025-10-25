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
import { Plus, Eye, Download, Lock, Unlock, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Mail } from "lucide-react";
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

type SortField = 'employee' | 'periodStart' | 'paymentDate' | 'grossSalary' | 'totalDeductions' | 'netSalary' | 'status';
type SortDirection = 'asc' | 'desc';

export default function Payroll() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('paymentDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Helper function to build detail URL with filter params
  const buildDetailUrl = (paymentId: string): string => {
    const params = new URLSearchParams();
    if (selectedYear) params.append('year', selectedYear.toString());
    if (selectedMonth) params.append('month', selectedMonth.toString());
    const queryString = params.toString();
    return `/payroll/${paymentId}${queryString ? `?${queryString}` : ''}`;
  };

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
      queryClient.invalidateQueries({ queryKey: ["/api/reports/employee-payroll-overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/yearly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/monthly"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/reports/employee-payroll-overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/yearly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/monthly"] });
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

  const deleteMutation = useMutation({
    mutationFn: (paymentId: string) => 
      apiRequest("DELETE", `/api/payroll/payments/${paymentId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/employee-payroll-overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/yearly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/monthly"] });
      toast({
        title: "Gelöscht",
        description: "Die Lohnauszahlung wurde erfolgreich gelöscht",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Lohnauszahlung konnte nicht gelöscht werden",
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

  // Email sending mutation
  const sendEmailsMutation = useMutation({
    mutationFn: (paymentIds: string[]) => 
      apiRequest("POST", "/api/payroll/send-payslips", { paymentIds }),
    onSuccess: (data: any) => {
      const { successCount = 0, failureCount = 0, results = [] } = data || {};
      
      if (failureCount === 0) {
        toast({
          title: "E-Mails versendet",
          description: `${successCount} Lohnabrechnung(en) wurden erfolgreich versendet`,
        });
      } else {
        const failedResults = results.filter((r: any) => !r.success);
        const errorMessages = failedResults.map((r: any) => r.error).join(', ');
        toast({
          title: "Teilweise erfolgreich",
          description: `${successCount} erfolgreich, ${failureCount} fehlgeschlagen: ${errorMessages}`,
          variant: "destructive",
        });
      }
      
      // Clear selection after sending
      setSelectedPayments([]);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "E-Mails konnten nicht versendet werden",
        variant: "destructive",
      });
    },
  });

  // Handle bulk email sending
  const handleSendEmails = () => {
    if (selectedPayments.length === 0) {
      toast({
        title: "Keine Auswahl",
        description: "Bitte wählen Sie mindestens eine Auszahlung aus",
        variant: "destructive",
      });
      return;
    }

    const message = selectedPayments.length === 1
      ? "Möchten Sie die Lohnabrechnung per E-Mail versenden?"
      : `Möchten Sie ${selectedPayments.length} Lohnabrechnungen per E-Mail versenden?`;

    if (confirm(message)) {
      sendEmailsMutation.mutate(selectedPayments);
    }
  };

  // Handle delete with confirmation
  const handleDelete = (paymentId: string, employeeName: string) => {
    if (confirm(`Möchten Sie die Lohnauszahlung für ${employeeName} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      deleteMutation.mutate(paymentId);
    }
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort payments
  const sortedPayments = payments ? [...payments].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'employee':
        aValue = `${a.employee.lastName} ${a.employee.firstName}`;
        bValue = `${b.employee.lastName} ${b.employee.firstName}`;
        break;
      case 'periodStart':
        aValue = new Date(a.periodStart);
        bValue = new Date(b.periodStart);
        break;
      case 'paymentDate':
        aValue = new Date(a.paymentDate);
        bValue = new Date(b.paymentDate);
        break;
      case 'grossSalary':
        aValue = Number(a.grossSalary);
        bValue = Number(b.grossSalary);
        break;
      case 'totalDeductions':
        aValue = Number(a.totalDeductions);
        bValue = Number(b.totalDeductions);
        break;
      case 'netSalary':
        aValue = Number(a.netSalary);
        bValue = Number(b.netSalary);
        break;
      case 'status':
        aValue = a.isLocked ? 1 : 0;
        bValue = b.isLocked ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  }) : [];

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
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
            <>
              <Button 
                variant="outline"
                onClick={handleSendEmails}
                disabled={sendEmailsMutation.isPending}
                data-testid="button-send-emails"
              >
                <Mail className="h-4 w-4 mr-2" />
                {sendEmailsMutation.isPending 
                  ? "Sende..." 
                  : `${selectedPayments.length} versenden`}
              </Button>
              <Button 
                variant="outline"
                onClick={handleBulkPdfExport}
                data-testid="button-bulk-pdf-export"
              >
                <Download className="h-4 w-4 mr-2" />
                {selectedPayments.length} als PDF
              </Button>
            </>
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
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('employee')}
                      className="h-8 px-2 -ml-2"
                      data-testid="sort-employee"
                    >
                      Mitarbeiter
                      <SortIcon field="employee" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('periodStart')}
                      className="h-8 px-2 -ml-2"
                      data-testid="sort-period"
                    >
                      Zeitraum
                      <SortIcon field="periodStart" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-32">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('paymentDate')}
                      className="h-8 px-2 -ml-2"
                      data-testid="sort-paymentDate"
                    >
                      Auszahlungsdatum
                      <SortIcon field="paymentDate" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('grossSalary')}
                      className="h-8 px-2 -mr-2 w-full justify-end"
                      data-testid="sort-grossSalary"
                    >
                      Bruttolohn
                      <SortIcon field="grossSalary" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('totalDeductions')}
                      className="h-8 px-2 -mr-2 w-full justify-end"
                      data-testid="sort-totalDeductions"
                    >
                      Abzüge
                      <SortIcon field="totalDeductions" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('netSalary')}
                      className="h-8 px-2 -mr-2 w-full justify-end"
                      data-testid="sort-netSalary"
                    >
                      Nettolohn
                      <SortIcon field="netSalary" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('status')}
                      className="h-8 px-2 -ml-2"
                      data-testid="sort-status"
                    >
                      Status
                      <SortIcon field="status" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayments.map((payment) => (
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
                        {!payment.isLocked && (
                          <Link href={`/payroll/${payment.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-edit-${payment.id}`}
                              title="Bearbeiten"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Link href={buildDetailUrl(payment.id)}>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-view-${payment.id}`}
                            title="Anzeigen"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {!payment.isLocked && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(payment.id, `${payment.employee.firstName} ${payment.employee.lastName}`)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${payment.id}`}
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
