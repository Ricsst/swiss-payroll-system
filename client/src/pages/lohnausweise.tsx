import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, Download, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  ahvNumber: string;
  isActive: boolean;
}

export default function Lohnausweise() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const availableYears = [2023, 2024, 2025, 2026];

  const activeEmployees = employees?.filter((e) => e.isActive) || [];
  
  const allSelected = selectedEmployees.length === activeEmployees.length && activeEmployees.length > 0;
  const someSelected = selectedEmployees.length > 0 && selectedEmployees.length < activeEmployees.length;

  const handleDownloadSingle = async (employeeId: string, employeeName: string) => {
    try {
      const response = await fetch(`/api/pdf/lohnausweis/${employeeId}?year=${selectedYear}`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Lohnausweis_${selectedYear}_${employeeName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Lohnausweis heruntergeladen",
        description: `Lohnausweis für ${employeeName} wurde erfolgreich heruntergeladen.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Lohnausweis konnte nicht heruntergeladen werden.",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(activeEmployees.map((e) => e.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
    }
  };

  const handleDownloadAll = async () => {
    try {
      const response = await fetch(`/api/pdf/lohnausweise-bulk?year=${selectedYear}`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Lohnausweise_${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Lohnausweise heruntergeladen",
        description: `Alle Lohnausweise für ${selectedYear} wurden erfolgreich heruntergeladen.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Lohnausweise konnten nicht heruntergeladen werden.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "Keine Auswahl",
        description: "Bitte wählen Sie mindestens einen Mitarbeiter aus",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/pdf/lohnausweise-selected`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeIds: selectedEmployees, year: selectedYear }),
      });
      
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Lohnausweise_Auswahl_${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Lohnausweise heruntergeladen",
        description: `${selectedEmployees.length} Lohnausweis(e) wurden erfolgreich heruntergeladen.`,
      });
      
      setSelectedEmployees([]);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Lohnausweise konnten nicht heruntergeladen werden.",
        variant: "destructive",
      });
    }
  };

  const sendEmailsMutation = useMutation({
    mutationFn: async (employeeIds: string[]) => {
      const res = await apiRequest("POST", "/api/lohnausweise/send-emails", {
        employeeIds,
        year: selectedYear,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      const { successCount = 0, failureCount = 0, results = [] } = data || {};

      if (failureCount === 0 && successCount > 0) {
        toast({
          title: "E-Mails versendet",
          description: `${successCount} Lohnausweis(e) wurden erfolgreich versendet`,
        });
      } else if (failureCount > 0) {
        const failedResults = results.filter((r: any) => !r.success);
        const errorMessages = failedResults.map((r: any) => r.error).join(", ");
        toast({
          title: "Teilweise erfolgreich",
          description: `${successCount} erfolgreich, ${failureCount} fehlgeschlagen: ${errorMessages}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Unbekannter Fehler",
          description: "E-Mail-Versand hat keine Ergebnisse zurückgegeben",
          variant: "destructive",
        });
      }

      setSelectedEmployees([]);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "E-Mails konnten nicht versendet werden",
        variant: "destructive",
      });
    },
  });

  const handleSendEmails = () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "Keine Auswahl",
        description: "Bitte wählen Sie mindestens einen Mitarbeiter aus",
        variant: "destructive",
      });
      return;
    }

    const message =
      selectedEmployees.length === 1
        ? "Möchten Sie den Lohnausweis per E-Mail versenden?"
        : `Möchten Sie ${selectedEmployees.length} Lohnausweise per E-Mail versenden?`;

    if (confirm(message)) {
      sendEmailsMutation.mutate(selectedEmployees);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="heading-lohnausweise">
            Lohnausweise
          </h1>
          <p className="text-sm text-muted-foreground">
            Lohnausweise gemäss Art. 125 DBG für alle Mitarbeiter
          </p>
        </div>
        <div className="flex gap-2">
          {selectedEmployees.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={handleDownloadSelected}
                disabled={sendEmailsMutation.isPending}
                data-testid="button-download-selected"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Ausgewählte herunterladen ({selectedEmployees.length})
              </Button>
              <Button
                variant="outline"
                onClick={handleSendEmails}
                disabled={sendEmailsMutation.isPending}
                data-testid="button-send-selected"
              >
                <Mail className="h-4 w-4 mr-2" />
                {sendEmailsMutation.isPending ? "Wird versendet..." : `Ausgewählte per E-Mail (${selectedEmployees.length})`}
              </Button>
            </>
          )}
          <Button
            onClick={handleDownloadAll}
            disabled={!activeEmployees.length}
            data-testid="button-download-all"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Alle herunterladen
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Jahr auswählen</CardTitle>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[180px]" data-testid="select-year">
                <SelectValue placeholder="Jahr wählen" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activeEmployees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Keine aktiven Mitarbeiter gefunden</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Alle auswählen"
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Vorname</TableHead>
                  <TableHead>AHV-Nummer</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEmployees.map((employee) => (
                  <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={(checked) =>
                          handleSelectEmployee(employee.id, checked as boolean)
                        }
                        aria-label={`Auswählen ${employee.firstName} ${employee.lastName}`}
                        data-testid={`checkbox-employee-${employee.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{employee.lastName}</TableCell>
                    <TableCell>{employee.firstName}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {employee.ahvNumber}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownloadSingle(
                            employee.id,
                            `${employee.lastName}_${employee.firstName}`
                          )
                        }
                        data-testid={`button-download-${employee.id}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
