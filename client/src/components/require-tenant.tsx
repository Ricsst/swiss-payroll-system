import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface TenantStatus {
  companyKey: string | null;
  isSelected: boolean;
}

export function RequireTenant({ children }: { children: React.ReactNode }) {
  const { data: tenantStatus, isLoading, error } = useQuery<TenantStatus>({
    queryKey: ["/api/tenant/current"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  // If there's an error or requiresTenantSelection flag, redirect to selector
  if (error || !tenantStatus?.isSelected) {
    return <Redirect to="/select-company" />;
  }

  return <>{children}</>;
}
