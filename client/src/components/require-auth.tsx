import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface AuthStatus {
  isAuthenticated: boolean;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: authStatus, isLoading } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
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

  // If not authenticated, redirect to login
  if (!authStatus?.isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}
