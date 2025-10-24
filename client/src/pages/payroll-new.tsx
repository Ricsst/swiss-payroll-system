import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PAYROLL_ITEM_TYPES, DEDUCTION_TYPES, type Employee } from "@shared/schema";
import { Link } from "wouter";

interface PayrollItemInput {
  id: string;
  type: string;
  description: string;
  amount: string;
  hours?: string;
  hourlyRate?: string;
}

interface DeductionInput {
  id: string;
  type: string;
  description: string;
  amount: string;
  percentage?: string;
}

export default function PayrollNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");

  const [payrollItems, setPayrollItems] = useState<PayrollItemInput[]>([]);
  const [deductions, setDeductions] = useState<DeductionInput[]>([]);

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) =>
      apiRequest("POST", "/api/payroll/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/employee-payroll-overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/yearly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/monthly"] });
      toast({ title: "Lohnauszahlung erfolgreich erstellt" });
      navigate("/payroll");
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Lohnauszahlung konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const addPayrollItem = () => {
    setPayrollItems([
      ...payrollItems,
      {
        id: Math.random().toString(),
        type: "Monatslohn",
        description: "",
        amount: "0.00",
      },
    ]);
  };

  const removePayrollItem = (id: string) => {
    setPayrollItems(payrollItems.filter((item) => item.id !== id));
  };

  const updatePayrollItem = (id: string, field: string, value: string) => {
    setPayrollItems(
      payrollItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addDeduction = () => {
    setDeductions([
      ...deductions,
      {
        id: Math.random().toString(),
        type: "AHV-Abzug",
        description: "",
        amount: "0.00",
      },
    ]);
  };

  const removeDeduction = (id: string) => {
    setDeductions(deductions.filter((d) => d.id !== id));
  };

  const updateDeduction = (id: string, field: string, value: string) => {
    setDeductions(
      deductions.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const calculateGrossSalary = () => {
    return payrollItems.reduce(
      (sum, item) => sum + parseFloat(item.amount || "0"),
      0
    );
  };

  const calculateTotalDeductions = () => {
    return deductions.reduce(
      (sum, d) => sum + parseFloat(d.amount || "0"),
      0
    );
  };

  const handleSubmit = () => {
    if (!selectedEmployeeId || !paymentDate || !periodStart || !periodEnd) {
      toast({
        title: "Fehlende Daten",
        description: "Bitte füllen Sie alle erforderlichen Felder aus",
        variant: "destructive",
      });
      return;
    }

    const paymentDateObj = new Date(paymentDate);
    const data = {
      employeeId: selectedEmployeeId,
      paymentDate,
      periodStart,
      periodEnd,
      paymentMonth: paymentDateObj.getMonth() + 1,
      paymentYear: paymentDateObj.getFullYear(),
      notes,
      payrollItems: payrollItems.map((item) => ({
        type: item.type,
        description: item.description,
        amount: item.amount,
        hours: item.hours,
        hourlyRate: item.hourlyRate,
      })),
      deductions: deductions.map((d) => ({
        type: d.type,
        description: d.description,
        amount: d.amount,
        percentage: d.percentage,
        isAutoCalculated: false,
      })),
    };

    createMutation.mutate(data);
  };

  const grossSalary = calculateGrossSalary();
  const totalDeductions = calculateTotalDeductions();
  const netSalary = grossSalary - totalDeductions;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payroll">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="heading-new-payment">
            Neue Lohnauszahlung
          </h1>
          <p className="text-sm text-muted-foreground">
            Erfassen Sie eine neue Lohnauszahlung
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basisdaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="employee">Mitarbeiter *</Label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger id="employee" data-testid="select-employee">
                    <SelectValue placeholder="Mitarbeiter auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="periodStart">Zeitraum von *</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    data-testid="input-period-start"
                  />
                </div>
                <div>
                  <Label htmlFor="periodEnd">Zeitraum bis *</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    data-testid="input-period-end"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentDate">Auszahlungsdatum *</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    data-testid="input-payment-date"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notizen</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional"
                  data-testid="input-notes"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0">
              <CardTitle>Lohnarten</CardTitle>
              <Button
                size="sm"
                onClick={addPayrollItem}
                data-testid="button-add-payroll-item"
              >
                <Plus className="h-4 w-4 mr-2" />
                Hinzufügen
              </Button>
            </CardHeader>
            <CardContent>
              {payrollItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lohnart</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead className="text-right">Betrag (CHF)</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Select
                            value={item.type}
                            onValueChange={(value) =>
                              updatePayrollItem(item.id, "type", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PAYROLL_ITEM_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updatePayrollItem(item.id, "description", e.target.value)
                            }
                            placeholder="Optional"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) =>
                              updatePayrollItem(item.id, "amount", e.target.value)
                            }
                            className="text-right font-mono"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePayrollItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0">
              <CardTitle>Abzüge</CardTitle>
              <Button
                size="sm"
                onClick={addDeduction}
                data-testid="button-add-deduction"
              >
                <Plus className="h-4 w-4 mr-2" />
                Hinzufügen
              </Button>
            </CardHeader>
            <CardContent>
              {deductions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Abzugsart</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead className="text-right">Betrag (CHF)</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductions.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <Select
                            value={d.type}
                            onValueChange={(value) =>
                              updateDeduction(d.id, "type", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DEDUCTION_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={d.description}
                            onChange={(e) =>
                              updateDeduction(d.id, "description", e.target.value)
                            }
                            placeholder="Optional"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={d.amount}
                            onChange={(e) =>
                              updateDeduction(d.id, "amount", e.target.value)
                            }
                            className="text-right font-mono"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDeduction(d.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bruttolohn:</span>
                  <span className="font-mono font-semibold">
                    CHF {grossSalary.toLocaleString("de-CH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-destructive">
                  <span>Abzüge:</span>
                  <span className="font-mono font-semibold">
                    - CHF {totalDeductions.toLocaleString("de-CH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between font-semibold">
                  <span>Nettolohn:</span>
                  <span className="font-mono text-lg">
                    CHF {netSalary.toLocaleString("de-CH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                data-testid="button-create-payment"
              >
                {createMutation.isPending ? "Speichern..." : "Auszahlung erstellen"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
