import { Building2, Users, Wallet, Calendar, FileText, LayoutDashboard, FileCheck, PlusCircle, Tags, UserCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
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
} from "@/components/ui/sidebar";

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
    title: "Lohnvorlagen",
    url: "/templates",
    icon: FileCheck,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Lohnprogramm</h2>
            <p className="text-xs text-muted-foreground">Schweizer Lohnabrechnung</p>
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
    </Sidebar>
  );
}
