import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText,
  User,
  Calendar,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface ImportResult {
  success: boolean;
  validation: {
    employeeExists: boolean;
    employeeCreated: boolean;
    employeeUpdated: boolean;
    nameMatches: boolean;
    bvgMatches: boolean;
    employeeId: string | null;
    changes: string[];
    paymentValidation: {
      pdfAmount: string;
      calculatedAmount: string;
      difference: string;
      matches: boolean;
    };
  };
  data: {
    employee: {
      id: string;
      name: string;
      ahvNumber: string;
    };
    payrollPayment: {
      id: string;
      period: string;
      grossSalary: string;
      netSalary: string;
    };
  };
  pdfData: any;
}

export default function QcsImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch("/api/qcs/import-payroll", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Import fehlgeschlagen");
      }

      return response.json();
    },
    onSuccess: (data: ImportResult) => {
      setImportResult(data);
      setSelectedFile(null);
      
      toast({
        title: "Import erfolgreich",
        description: `Lohnabrechnung für ${data.data.employee.name} wurde erstellt`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Ungültiger Dateityp",
          description: "Bitte wählen Sie eine PDF-Datei aus",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "Keine Datei ausgewählt",
        description: "Bitte wählen Sie eine PDF-Datei aus",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate(selectedFile);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QCS Lohnabrechnung Import</h1>
        <p className="text-muted-foreground mt-2">
          Importieren Sie Lohnabrechnungen von Quality Care Solutions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PDF-Datei hochladen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pdf-upload">QCS Lohnabrechnung (PDF)</Label>
            <Input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={importMutation.isPending}
              data-testid="input-pdf-upload"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Ausgewählte Datei: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <Button
            onClick={handleImport}
            disabled={!selectedFile || importMutation.isPending}
            data-testid="button-import"
          >
            {importMutation.isPending ? (
              <>
                <Skeleton className="h-4 w-4 mr-2" />
                Importiere...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importieren
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {importMutation.isPending && (
        <Card>
          <CardHeader>
            <CardTitle>Importiere Lohnabrechnung...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      )}

      {importResult && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle>Import erfolgreich</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Mitarbeiter</span>
                  </div>
                  <div>
                    <p className="font-medium" data-testid="text-employee-name">
                      {importResult.data.employee.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      AHV: {importResult.data.employee.ahvNumber}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Periode</span>
                  </div>
                  <p className="font-medium" data-testid="text-period">
                    {importResult.data.payrollPayment.period}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Bruttolohn</span>
                  </div>
                  <p className="font-medium">
                    CHF {importResult.data.payrollPayment.grossSalary}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Nettolohn</span>
                  </div>
                  <p className="font-medium" data-testid="text-net-salary">
                    CHF {importResult.data.payrollPayment.netSalary}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Link href={`/payroll/${importResult.data.payrollPayment.id}`}>
                  <Button data-testid="button-view-payroll">
                    <FileText className="mr-2 h-4 w-4" />
                    Lohnabrechnung anzeigen
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validierung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {importResult.validation.employeeExists ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm">
                    {importResult.validation.employeeExists
                      ? "Mitarbeiter wurde gefunden"
                      : "Neuer Mitarbeiter wurde erstellt"}
                  </span>
                </div>

                {importResult.validation.employeeCreated && (
                  <Badge variant="secondary">Neuer Mitarbeiter</Badge>
                )}

                {importResult.validation.changes.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Änderungen vorgenommen</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        {importResult.validation.changes.map((change, idx) => (
                          <li key={idx} className="text-sm">{change}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Zahlungsvalidierung</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">PDF-Betrag:</span>
                    <span className="font-medium">CHF {importResult.validation.paymentValidation.pdfAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Berechneter Betrag:</span>
                    <span className="font-medium">CHF {importResult.validation.paymentValidation.calculatedAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Differenz:</span>
                    <span className="font-medium">CHF {importResult.validation.paymentValidation.difference}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    {importResult.validation.paymentValidation.matches ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">
                          Betrag stimmt überein (Toleranz: ±0.05 CHF)
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">
                          Betrag weicht ab (außerhalb Toleranz)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
