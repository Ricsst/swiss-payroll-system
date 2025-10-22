import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import CompanyPage from "@/pages/company";
import Payroll from "@/pages/payroll";
import PayrollNew from "@/pages/payroll-new";
import PayrollDetail from "@/pages/payroll-detail";
import EmployeePayroll from "@/pages/employee-payroll";
import EmployeePayrollOverview from "@/pages/employee-payroll-overview";
import MonthlyReport from "@/pages/monthly-report";
import YearlyReport from "@/pages/yearly-report";
import PayrollItemTypes from "@/pages/payroll-item-types";
import Templates from "@/pages/templates";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/employees" component={Employees} />
      <Route path="/company" component={CompanyPage} />
      <Route path="/payroll" component={Payroll} />
      <Route path="/payroll/new" component={PayrollNew} />
      <Route path="/payroll/:id" component={PayrollDetail} />
      <Route path="/employee-payroll" component={EmployeePayroll} />
      <Route path="/employee-payroll-overview" component={EmployeePayrollOverview} />
      <Route path="/monthly-report" component={MonthlyReport} />
      <Route path="/yearly-report" component={YearlyReport} />
      <Route path="/payroll-item-types" component={PayrollItemTypes} />
      <Route path="/templates" component={Templates} />
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
