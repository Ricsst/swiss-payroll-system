import { Building2, Users, Wallet, Calendar, FileText, LayoutDashboard, FileCheck, PlusCircle, Tags, UserCheck, FileBarChart, Upload, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TenantStatus {
  companyKey: string | null;
  isSelected: boolean;
}

const companyNames: Record<string, string> = {
  'firma-a': 'Firma A',
  'firma-b': 'Firma B',
  'firma-c': 'Firma C',
};

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Lohnarten",
    url: "/payroll-item-types",
    icon: Tags,
  },
  {
    title: "Firma",
    url: "/company",
    icon: Building2,
  },
  {
    title: "Mitarbeiter",
    url: "/employees",
    icon: Users,
  },
  {
    title: "Lohnerfassung",
    url: "/employee-payroll",
    icon: PlusCircle,
  },
  {
    title: "Lohnauszahlungen",
    url: "/payroll",
    icon: Wallet,
  },
  {
    title: "Lohnauszahlung pro MA",
    url: "/employee-payroll-overview",
    icon: UserCheck,
  },
  {
    title: "Monatsabrechnung",
    url: "/monthly-report",
    icon: Calendar,
  },
  {
    title: "Jahresabrechnung",
    url: "/yearly-report",
    icon: FileText,
  },
  {
    title: "Lohnausweise",
    url: "/lohnausweise",
    icon: FileBarChart,
  },
  {
    title: "Lohnvorlagen",
    url: "/templates",
    icon: FileCheck,
  },
  {
    title: "QCS Import",
    url: "/qcs-import",
    icon: Upload,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();

  const { data: tenantStatus } = useQuery<TenantStatus>({
    queryKey: ["/api/tenant/current"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Clear localStorage first (for Replit iframe compatibility)
      localStorage.removeItem('selectedCompany');
      await apiRequest("POST", "/api/tenant/logout", {});
    },
    onSuccess: () => {
      queryClient.clear(); // Clear all cached queries
      setLocation("/select-company");
    },
  });

  const currentCompanyName = tenantStatus?.companyKey 
    ? companyNames[tenantStatus.companyKey] || tenantStatus.companyKey
    : 'Keine Firma ausgewählt';

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wallet className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Lohnprogramm</h2>
            <p className="text-xs text-muted-foreground truncate">{currentCompanyName}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          data-testid="button-change-company"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Firma wechseln
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
