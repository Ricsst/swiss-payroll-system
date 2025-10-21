import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Wallet, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Übersicht Ihrer Lohnabrechnungen
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Aktive Mitarbeiter",
      value: stats?.activeEmployees || 0,
      icon: Users,
      testId: "stat-active-employees",
    },
    {
      title: "Firma konfiguriert",
      value: stats?.hasCompany ? "Ja" : "Nein",
      icon: Building2,
      testId: "stat-company-configured",
    },
    {
      title: "Auszahlungen (Monat)",
      value: stats?.paymentsThisMonth || 0,
      icon: Wallet,
      testId: "stat-payments-month",
    },
    {
      title: "Gesamtlohn (Monat)",
      value: stats?.totalPayrollThisMonth
        ? `CHF ${Number(stats.totalPayrollThisMonth).toLocaleString("de-CH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : "CHF 0.00",
      icon: TrendingUp,
      testId: "stat-total-payroll",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="heading-dashboard">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Übersicht Ihrer Lohnabrechnungen
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold" data-testid={stat.testId}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Willkommen beim Lohnprogramm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verwalten Sie Ihre Mitarbeiter, erfassen Sie Lohnauszahlungen und erstellen
            Sie automatisch Monats- und Jahresabrechnungen mit korrekten Schweizer
            Sozialversicherungsabzügen.
          </p>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Erste Schritte:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Firmendaten erfassen und Sozialversicherungsbeiträge konfigurieren</li>
              <li>Mitarbeiter mit allen erforderlichen Daten hinzufügen</li>
              <li>Lohnauszahlungen erfassen (wöchentlich oder nach Bedarf)</li>
              <li>Monats- und Jahresabrechnungen generieren</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
