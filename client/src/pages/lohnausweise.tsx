import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const availableYears = [2023, 2024, 2025, 2026];

  const activeEmployees = employees?.filter((e) => e.isActive) || [];

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
        <Button
          onClick={handleDownloadAll}
          disabled={!activeEmployees.length}
          data-testid="button-download-all"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Alle herunterladen
        </Button>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Vorname</TableHead>
                  <TableHead>AHV-Nummer</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEmployees.map((employee) => (
                  <TableRow key={employee.id}>
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
