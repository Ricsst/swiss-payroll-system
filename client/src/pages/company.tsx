import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanySchema, type InsertCompany, type Company } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const defaultFormValues: InsertCompany = {
  name: "",
  street: "",
  postalCode: "",
  city: "",
  ahvAccountingNumber: "",
  suvaCustomerNumber: "",
  payrollSenderEmail: "",
  ahvEmployeeRate: "5.3000",
  ahvEmployerRate: "5.3000",
  ahvRentnerAllowance: "1400.00",
  alvEmployeeRate: "1.1000",
  alvEmployerRate: "1.1000",
  alvMaxIncomePerYear: "148200.00",
  alvEmployee2Rate: "0.5000",
  alvEmployer2Rate: "0.5000",
  suvaNbuMaleRate: "1.1680",
  suvaNbuFemaleRate: "1.1680",
  suvaMaxIncomePerYear: "148200.00",
  ktgGavRate: "1.5150",
  berufsbeitragGavRate: "0.4000",
};

export default function CompanyPage() {
  const { toast } = useToast();

  const { data: company, isLoading } = useQuery<Company | null>({
    queryKey: ["/api/company"],
  });

  const form = useForm<InsertCompany>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: defaultFormValues,
  });

  // Update form when company data is loaded
  useEffect(() => {
    if (company && !isLoading) {
      // Convert all numeric fields to strings for form compatibility
      const formData: InsertCompany = {
        name: company.name,
        street: company.street,
        postalCode: company.postalCode,
        city: company.city,
        ahvAccountingNumber: company.ahvAccountingNumber,
        suvaCustomerNumber: company.suvaCustomerNumber || "",
        payrollSenderEmail: company.payrollSenderEmail || "",
        ahvEmployeeRate: String(company.ahvEmployeeRate),
        ahvEmployerRate: String(company.ahvEmployerRate),
        ahvRentnerAllowance: String(company.ahvRentnerAllowance),
        alvEmployeeRate: String(company.alvEmployeeRate),
        alvEmployerRate: String(company.alvEmployerRate),
        alvMaxIncomePerYear: String(company.alvMaxIncomePerYear),
        alvEmployee2Rate: String(company.alvEmployee2Rate),
        alvEmployer2Rate: String(company.alvEmployer2Rate),
        suvaNbuMaleRate: String(company.suvaNbuMaleRate),
        suvaNbuFemaleRate: String(company.suvaNbuFemaleRate),
        suvaMaxIncomePerYear: String(company.suvaMaxIncomePerYear),
        ktgGavRate: String(company.ktgGavRate),
        berufsbeitragGavRate: String(company.berufsbeitragGavRate),
      };
      form.reset(formData);
    }
  }, [company, isLoading, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertCompany) =>
      apiRequest("POST", "/api/company", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      toast({ title: "Firma erfolgreich erstellt" });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Firma konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertCompany) =>
      apiRequest("PATCH", "/api/company", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      toast({ title: "Firma erfolgreich aktualisiert" });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Firma konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCompany) => {
    if (company) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="heading-company">
          Firma
        </h1>
        <p className="text-sm text-muted-foreground">
          Konfigurieren Sie Ihre Firmendaten und Sozialversicherungsbeiträge
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Firmendaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmenname *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strasse *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-street" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLZ *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-company-postalcode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Ort *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-company-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ahvAccountingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AHV-Abrechnungsnummer *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="font-mono"
                          data-testid="input-ahv-accounting"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="suvaCustomerNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SUVA-Kundennummer</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          className="font-mono"
                          data-testid="input-suva-customer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="payrollSenderEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail für Lohnabrechnung-Versand</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        value={field.value || ""}
                        placeholder="payroll@firma.ch"
                        data-testid="input-payroll-sender-email"
                      />
                    </FormControl>
                    <FormDescription>
                      Diese E-Mail-Adresse wird als Absender beim Versenden von Lohnabrechnungen verwendet
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AHV-Beiträge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="ahvEmployeeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arbeitnehmerbeitrag (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          className="font-mono"
                          data-testid="input-ahv-employee-rate"
                        />
                      </FormControl>
                      <FormDescription>Standard: 5.3%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ahvEmployerRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arbeitgeberbeitrag (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          className="font-mono"
                          data-testid="input-ahv-employer-rate"
                        />
                      </FormControl>
                      <FormDescription>Standard: 5.3%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ahvRentnerAllowance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Freibetrag AHV-Rentner (CHF/Monat)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          className="font-mono"
                          data-testid="input-ahv-allowance"
                        />
                      </FormControl>
                      <FormDescription>Standard: CHF 1'400</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ALV-Beiträge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="alvEmployeeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arbeitnehmerbeitrag (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          className="font-mono"
                          data-testid="input-alv-employee-rate"
                        />
                      </FormControl>
                      <FormDescription>Standard: 1.1%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="alvEmployerRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arbeitgeberbeitrag (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          className="font-mono"
                          data-testid="input-alv-employer-rate"
                        />
                      </FormControl>
                      <FormDescription>Standard: 1.1%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="alvMaxIncomePerYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Höchstbetrag Limite (CHF/Jahr)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          className="font-mono"
                          data-testid="input-alv-max-income"
                        />
                      </FormControl>
                      <FormDescription>Standard: CHF 148'200</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="alvEmployee2Rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arbeitnehmerbeitrag 2 (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          className="font-mono"
                          data-testid="input-alv-employee2-rate"
                        />
                      </FormControl>
                      <FormDescription>Standard: 0.5%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="alvEmployer2Rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arbeitgeberbeitrag 2 (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          className="font-mono"
                          data-testid="input-alv-employer2-rate"
                        />
                      </FormControl>
                      <FormDescription>Standard: 0.5%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SUVA / NBU-Beiträge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="suvaNbuMaleRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NBU-Prämie Männer (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          className="font-mono"
                          data-testid="input-suva-male-rate"
                        />
                      </FormControl>
                      <FormDescription>Standard: 1.168%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="suvaNbuFemaleRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NBU-Prämie Frauen (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          className="font-mono"
                          data-testid="input-suva-female-rate"
                        />
                      </FormControl>
                      <FormDescription>Standard: 1.168%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="suvaMaxIncomePerYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Höchstbetrag (CHF/Jahr)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          className="font-mono"
                          data-testid="input-suva-max-income"
                        />
                      </FormControl>
                      <FormDescription>Standard: CHF 148'200</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>KTG GAV und Berufsbeitrag GAV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ktgGavRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>KTG GAV Personalverleih (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          className="font-mono"
                          data-testid="input-ktg-gav-rate"
                        />
                      </FormControl>
                      <FormDescription>Standard: 1.515%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="berufsbeitragGavRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Berufsbeitrag GAV Personalverleih (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          className="font-mono"
                          data-testid="input-berufsbeitrag-gav-rate"
                        />
                      </FormControl>
                      <FormDescription>Standard: 0.4%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-company"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Speichern..."
                : company
                ? "Aktualisieren"
                : "Erstellen"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
