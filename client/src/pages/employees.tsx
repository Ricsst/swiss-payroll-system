import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Edit, Trash2, MoreVertical, FileText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeSchema, type InsertEmployee, type Employee } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type SortField = 'lastName' | 'gender' | null;
type SortOrder = 'asc' | 'desc';

export default function Employees() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const { toast } = useToast();

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: company } = useQuery({
    queryKey: ["/api/company"],
  });

  const form = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "Mann",
      birthDate: "",
      address: "",
      email: "",
      entryDate: "",
      exitDate: undefined,
      ahvNumber: "",
      hasAccidentInsurance: true,
      hasAhv: true,
      hasAlv: true,
      isNbuInsured: true,
      isRentner: false,
      bankName: "",
      bankIban: "",
      bankBic: "",
      monthlySalary: undefined,
      employmentLevel: undefined,
      hourlyRate: undefined,
      bvgDeductionAmount: undefined,
      bvgDeductionPercentage: undefined,
      childAllowanceAmount: undefined,
      childAllowanceNote: "",
      isActive: true,
      companyId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmployee) =>
      apiRequest("POST", "/api/employees", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Mitarbeiter erfolgreich erstellt" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Mitarbeiter konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertEmployee }) =>
      apiRequest("PATCH", `/api/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Mitarbeiter erfolgreich aktualisiert" });
      setIsDialogOpen(false);
      setEditingEmployee(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Mitarbeiter konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest("DELETE", `/api/employees/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Mitarbeiter erfolgreich gelöscht" });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Mitarbeiter konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmployee) => {
    const companyId = (company as any)?.id;
    if (!companyId) {
      toast({
        title: "Keine Firma konfiguriert",
        description: "Bitte konfigurieren Sie zuerst die Firmendaten",
        variant: "destructive",
      });
      return;
    }

    const payload = { ...data, companyId };

    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.reset({
      firstName: employee.firstName,
      lastName: employee.lastName,
      gender: employee.gender || "Mann",
      birthDate: employee.birthDate,
      address: employee.address,
      email: employee.email,
      entryDate: employee.entryDate,
      exitDate: employee.exitDate || undefined,
      ahvNumber: employee.ahvNumber,
      hasAccidentInsurance: employee.hasAccidentInsurance,
      hasAhv: employee.hasAhv,
      hasAlv: employee.hasAlv,
      isNbuInsured: employee.isNbuInsured,
      isRentner: employee.isRentner,
      bankName: employee.bankName,
      bankIban: employee.bankIban,
      bankBic: employee.bankBic || "",
      monthlySalary: employee.monthlySalary || undefined,
      employmentLevel: employee.employmentLevel || undefined,
      hourlyRate: employee.hourlyRate || undefined,
      bvgDeductionAmount: employee.bvgDeductionAmount || undefined,
      bvgDeductionPercentage: employee.bvgDeductionPercentage || undefined,
      childAllowanceAmount: employee.childAllowanceAmount || undefined,
      childAllowanceNote: employee.childAllowanceNote || "",
      isActive: employee.isActive,
      companyId: employee.companyId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie diesen Mitarbeiter wirklich löschen?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingEmployee(null);
      form.reset();
    }
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSort = (field: 'lastName' | 'gender') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedEmployees = () => {
    if (!employees) return [];
    if (!sortField) return employees;
    
    return [...employees].sort((a, b) => {
      let compareValue = 0;
      
      if (sortField === 'lastName') {
        compareValue = a.lastName.localeCompare(b.lastName);
      } else if (sortField === 'gender') {
        const genderA = a.gender || 'Mann';
        const genderB = b.gender || 'Mann';
        compareValue = genderA.localeCompare(genderB);
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  };

  const sortedEmployees = getSortedEmployees();

  const renderSortIcon = (field: 'lastName' | 'gender') => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1 inline" />
      : <ArrowDown className="h-4 w-4 ml-1 inline" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="heading-employees">
            Mitarbeiter
          </h1>
          <p className="text-sm text-muted-foreground">
            Verwalten Sie Ihre Mitarbeiter und deren Daten
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-employee">
              <Plus className="h-4 w-4 mr-2" />
              Mitarbeiter hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Mitarbeiter bearbeiten" : "Neuer Mitarbeiter"}
              </DialogTitle>
              <DialogDescription>
                Erfassen Sie alle erforderlichen Mitarbeiterdaten
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Personalien</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vorname *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-firstname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nachname *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-lastname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Geschlecht *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-gender">
                                <SelectValue placeholder="Auswählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mann">Mann</SelectItem>
                              <SelectItem value="Frau">Frau</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Geburtsdatum *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-birthdate" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Anstellung</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="entryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Eintritt *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-entrydate" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="exitDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Austritt</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-exitdate"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Sozialversicherung</h3>
                  <FormField
                    control={form.control}
                    name="ahvNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AHV-Nummer *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="756.1234.5678.97"
                            className="font-mono"
                            data-testid="input-ahvnumber"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="hasAhv"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-hasahv"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>AHV</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hasAlv"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-hasalv"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>ALV</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hasAccidentInsurance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-hasaccident"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Unfallversicherung</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isNbuInsured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-isnbuinsured"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>NBU</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isRentner"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-isrentner"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Rentner</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Bankverbindung</h3>
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank (Name und Ort) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="z.B. UBS Zürich" data-testid="input-bankname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankIban"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IBAN *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="CH93 0076 2011 6238 5295 7"
                              className="font-mono"
                              data-testid="input-bankiban"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bankBic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BIC</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="UBSWCHZH80A"
                              className="font-mono"
                              data-testid="input-bankbic"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Lohnvorgaben (Standardwerte für Lohnerfassung)</h3>
                  <p className="text-xs text-muted-foreground">
                    Diese Werte werden bei der Lohnerfassung als Vorschläge übernommen, können aber überschrieben werden.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="monthlySalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monatslohn (CHF)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value || undefined)}
                              placeholder="0.00"
                              data-testid="input-monthlysalary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="employmentLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anstellungsgrad (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value || undefined)}
                              placeholder="100.00"
                              data-testid="input-employmentlevel"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hourlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stundenlohn (CHF)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value || undefined)}
                              placeholder="0.00"
                              data-testid="input-hourlyrate"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bvgDeductionAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BVG-Abzug (CHF)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value || undefined;
                                field.onChange(value);
                                if (value) {
                                  form.setValue('bvgDeductionPercentage', undefined);
                                }
                              }}
                              placeholder="0.00"
                              data-testid="input-bvgdeductionamount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bvgDeductionPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BVG-Abzug (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value || undefined;
                                field.onChange(value);
                                if (value) {
                                  form.setValue('bvgDeductionAmount', undefined);
                                }
                              }}
                              placeholder="3.50"
                              data-testid="input-bvgdeductionpercentage"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hinweis: BVG-Abzug kann entweder in CHF oder in % angegeben werden (nur eine Eingabe möglich)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="childAllowanceAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kinderzulagen (CHF)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value || undefined)}
                              placeholder="0.00"
                              data-testid="input-childallowanceamount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="childAllowanceNote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bemerkung zu Kinderzulagen</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="z.B. 2 Kinder"
                              data-testid="input-childallowancenote"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-isactive"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Aktiv</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    data-testid="button-cancel"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-employee"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Speichern..."
                      : "Speichern"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mitarbeiterliste</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : employees && employees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover-elevate"
                    onClick={() => handleSort('lastName')}
                    data-testid="sort-lastname"
                  >
                    Name{renderSortIcon('lastName')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover-elevate"
                    onClick={() => handleSort('gender')}
                    data-testid="sort-gender"
                  >
                    Geschlecht{renderSortIcon('gender')}
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>AHV-Nummer</TableHead>
                  <TableHead>Geburtsdatum / Alter</TableHead>
                  <TableHead>Versicherung</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEmployees.map((employee) => (
                  <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                    <TableCell className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-gender-${employee.id}`}>
                        {employee.gender || "Mann"}
                      </Badge>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {employee.ahvNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {new Date(employee.birthDate).toLocaleDateString("de-CH")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {calculateAge(employee.birthDate)} Jahre
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {employee.isNbuInsured && (
                          <Badge variant="outline" className="text-xs">NBU</Badge>
                        )}
                        {employee.isRentner && (
                          <Badge variant="outline" className="text-xs">Rentner</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.isActive ? "default" : "secondary"}>
                        {employee.isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            data-testid={`button-actions-${employee.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(employee)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const year = new Date().getFullYear();
                            window.open(`/api/pdf/lohnausweis/${employee.id}?year=${year}`, '_blank');
                          }}>
                            <FileText className="h-4 w-4 mr-2" />
                            Lohnausweis {new Date().getFullYear()}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const year = new Date().getFullYear() - 1;
                            window.open(`/api/pdf/lohnausweis/${employee.id}?year=${year}`, '_blank');
                          }}>
                            <FileText className="h-4 w-4 mr-2" />
                            Lohnausweis {new Date().getFullYear() - 1}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(employee.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Keine Mitarbeiter erfasst</p>
              <p className="text-sm text-muted-foreground mt-1">
                Fügen Sie Ihren ersten Mitarbeiter hinzu
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
