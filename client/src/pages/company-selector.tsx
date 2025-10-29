import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Company {
  key: string;
  name: string;
  hasDatabase: boolean;
}

export default function CompanySelector() {
  const [, setLocation] = useLocation();

  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/tenant/companies"],
  });

  const selectCompanyMutation = useMutation({
    mutationFn: async (companyKey: string) => {
      // Store in localStorage for Replit iframe compatibility
      localStorage.setItem('selectedCompany', companyKey);
      await apiRequest("POST", "/api/tenant", { companyKey });
    },
    onSuccess: async () => {
      // Force immediate refetch to bypass browser cache
      await queryClient.refetchQueries({ queryKey: ["/api/tenant/current"] });
      // Reload the entire app to ensure fresh state
      window.location.href = "/";
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Firma auswählen</CardTitle>
          <CardDescription>
            Wählen Sie die Firma aus, mit der Sie arbeiten möchten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {companies?.map((company) => (
            <Button
              key={company.key}
              data-testid={`button-select-${company.key}`}
              variant="outline"
              className="w-full justify-between hover-elevate active-elevate-2"
              onClick={() => selectCompanyMutation.mutate(company.key)}
              disabled={!company.hasDatabase || selectCompanyMutation.isPending}
            >
              <span className="text-lg font-medium">{company.name}</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          ))}
          {selectCompanyMutation.isPending && (
            <p className="text-sm text-muted-foreground text-center">
              Firma wird geladen...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
