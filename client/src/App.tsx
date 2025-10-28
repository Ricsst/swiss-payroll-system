import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { RequireTenant } from "@/components/require-tenant";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import CompanyPage from "@/pages/company";
import Payroll from "@/pages/payroll";
import PayrollNew from "@/pages/payroll-new";
import PayrollEdit from "@/pages/payroll-edit";
import PayrollDetail from "@/pages/payroll-detail";
import EmployeePayroll from "@/pages/employee-payroll";
import EmployeePayrollOverview from "@/pages/employee-payroll-overview";
import MonthlyReport from "@/pages/monthly-report";
import YearlyReport from "@/pages/yearly-report";
import Lohnausweise from "@/pages/lohnausweise";
import PayrollItemTypes from "@/pages/payroll-item-types";
import Templates from "@/pages/templates";
import QcsImport from "@/pages/qcs-import";
import CompanySelector from "@/pages/company-selector";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/select-company" component={CompanySelector} />
      <Route path="/" component={() => (
        <RequireTenant>
          <Dashboard />
        </RequireTenant>
      )} />
      <Route path="/employees" component={() => (
        <RequireTenant>
          <Employees />
        </RequireTenant>
      )} />
      <Route path="/company" component={() => (
        <RequireTenant>
          <CompanyPage />
        </RequireTenant>
      )} />
      <Route path="/payroll" component={() => (
        <RequireTenant>
          <Payroll />
        </RequireTenant>
      )} />
      <Route path="/payroll/new" component={() => (
        <RequireTenant>
          <PayrollNew />
        </RequireTenant>
      )} />
      <Route path="/payroll/:id/edit" component={(props) => (
        <RequireTenant>
          <PayrollEdit params={props.params} />
        </RequireTenant>
      )} />
      <Route path="/payroll/:id" component={(props) => (
        <RequireTenant>
          <PayrollDetail params={props.params} />
        </RequireTenant>
      )} />
      <Route path="/employee-payroll" component={() => (
        <RequireTenant>
          <EmployeePayroll />
        </RequireTenant>
      )} />
      <Route path="/employee-payroll-overview" component={() => (
        <RequireTenant>
          <EmployeePayrollOverview />
        </RequireTenant>
      )} />
      <Route path="/monthly-report" component={() => (
        <RequireTenant>
          <MonthlyReport />
        </RequireTenant>
      )} />
      <Route path="/yearly-report" component={() => (
        <RequireTenant>
          <YearlyReport />
        </RequireTenant>
      )} />
      <Route path="/lohnausweise" component={() => (
        <RequireTenant>
          <Lohnausweise />
        </RequireTenant>
      )} />
      <Route path="/payroll-item-types" component={() => (
        <RequireTenant>
          <PayrollItemTypes />
        </RequireTenant>
      )} />
      <Route path="/templates" component={() => (
        <RequireTenant>
          <Templates />
        </RequireTenant>
      )} />
      <Route path="/qcs-import" component={() => (
        <RequireTenant>
          <QcsImport />
        </RequireTenant>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "14rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-7xl mx-auto">
                    <Router />
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
