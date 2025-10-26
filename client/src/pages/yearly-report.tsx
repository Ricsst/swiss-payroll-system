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
  TableFooter,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, FileSpreadsheet, FileType } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WageSummaryByGender {
  ahvSubject: string;
  nonAhvSubject: string;
  totalRelevant: string;
  excessWage: string;
  nonUvgPremium: string;
  uvgWage: string;
  lessThan8Hours: string;
  uvgo70Plus_BU: string;
  uvgo70Plus_NBU: string;
}

interface YearlyReportData {
  year: number;
  months: Array<{
    month: number;
    monthName: string;
    grossSalary: string;
    deductions: string;
    netSalary: string;
    paymentsCount: number;
  }>;
  payrollItemSummary: Array<{
    code: string;
    type: string;
    quantity: string;
    amount: string;
  }>;
  deductionSummary: Array<{
    type: string;
    amount: string;
  }>;
  basisAmounts: {
    ahvBasis: string;
    alvBasis: string;
    nbuBasis: string;
    bvgBasis: string;
  };
  employeeSummary: Array<{
    ahvNumber: string;
    birthDate: string;
    firstName: string;
    lastName: string;
    employedFrom: number;
    employedTo: number;
    ahvWage: string;
    alvWage: string;
    alv1Wage: string;
    alv2Wage: string;
    bvgWage: string;
    childAllowance: string;
  }>;
  childAllowanceEmployees: Array<{
    ahvNumber: string;
    birthDate: string;
    firstName: string;
    lastName: string;
    employedFrom: number;
    employedTo: number;
    childAllowance: string;
  }>;
  uvgMaxIncome: string;
  wageSummary: {
    male: WageSummaryByGender;
    female: WageSummaryByGender;
  };
  totals: {
    grossSalary: string;
    deductions: string;
    netSalary: string;
    paymentsCount: number;
  };
}

export default function YearlyReport() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: report, isLoading } = useQuery<YearlyReportData>({
    queryKey: ["/api/reports/yearly", selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/reports/yearly?year=${selectedYear}`);
      if (!response.ok) throw new Error("Failed to fetch yearly report");
      return response.json();
    },
  });

  const availableYears = [2023, 2024, 2025, 2026];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="heading-yearly-report">
            Jahresabrechnung
          </h1>
          <p className="text-sm text-muted-foreground">
            Übersicht aller 12 Monate für den Lohnausweis
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="button-export-yearly">
              <FileDown className="h-4 w-4 mr-2" />
              Exportieren
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              window.open(`/api/pdf/yearly-report?year=${selectedYear}`, '_blank');
            }}>
              <FileType className="h-4 w-4 mr-2" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              window.open(`/api/excel/yearly-report?year=${selectedYear}&format=xlsx`, '_blank');
            }}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel (XLSX)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              window.open(`/api/excel/yearly-report?year=${selectedYear}&format=csv`, '_blank');
            }}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jahr auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="max-w-xs" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : report && report.totals && report.totals.paymentsCount > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Auszahlungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totals.paymentsCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bruttolohn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  CHF {Number(report.totals.grossSalary).toLocaleString("de-CH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Abzüge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  CHF {Number(report.totals.deductions).toLocaleString("de-CH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Nettolohn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  CHF {Number(report.totals.netSalary).toLocaleString("de-CH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lohnarten Rekapitulation */}
          <Card>
            <CardHeader>
              <CardTitle>Lohnarten Rekapitulation - Ganzes Jahr {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nr</TableHead>
                    <TableHead>Legende</TableHead>
                    <TableHead className="text-right">Menge</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.payrollItemSummary && report.payrollItemSummary.length > 0 ? (
                    report.payrollItemSummary.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{item.code}</TableCell>
                        <TableCell className="font-medium">{item.type}</TableCell>
                        <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(item.amount).toLocaleString("de-CH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} +
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Keine Lohnarten verfügbar
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="font-semibold border-t-2">
                    <TableCell></TableCell>
                    <TableCell>BRUTTOLOHN</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(report.totals.grossSalary).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Abzüge Details */}
          {report.deductionSummary && report.deductionSummary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Abzüge - Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Abzugstyp</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.deductionSummary.map((ded, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{ded.type}</TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(ded.amount).toLocaleString("de-CH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} -
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold border-t-2">
                      <TableCell>TOTAL ABZUEGE</TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(report.totals.deductions).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-semibold border-t-2">
                      <TableCell>NETTOLOHN</TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(report.totals.netSalary).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Basis-Beträge */}
          {report.basisAmounts && (
            <Card>
              <CardHeader>
                <CardTitle>Basis-Beträge</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">AHV-Basis</TableCell>
                      <TableCell className="text-right font-mono">
                        CHF {Number(report.basisAmounts.ahvBasis).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ALV-Basis</TableCell>
                      <TableCell className="text-right font-mono">
                        CHF {Number(report.basisAmounts.alvBasis).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">NBU-Basis</TableCell>
                      <TableCell className="text-right font-mono">
                        CHF {Number(report.basisAmounts.nbuBasis).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">BVG-Basis</TableCell>
                      <TableCell className="text-right font-mono">
                        CHF {Number(report.basisAmounts.bvgBasis).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Mitarbeiter-Übersicht */}
          {report.employeeSummary && report.employeeSummary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mitarbeiter-Übersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>AHV Nr</TableHead>
                      <TableHead>Geburtstag</TableHead>
                      <TableHead>Name Vorname</TableHead>
                      <TableHead className="text-center">Beschäftigt</TableHead>
                      <TableHead className="text-right">AHV Lohn</TableHead>
                      <TableHead className="text-right">ALV1 Lohn</TableHead>
                      <TableHead className="text-right">ALV2 Lohn</TableHead>
                      <TableHead className="text-right">BVG Lohn</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.employeeSummary.map((emp, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{emp.ahvNumber}</TableCell>
                        <TableCell>
                          {new Date(emp.birthDate).toLocaleDateString("de-CH")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {emp.lastName} {emp.firstName}
                        </TableCell>
                        <TableCell className="text-center">
                          {emp.employedFrom.toString().padStart(2, '0')} bis {emp.employedTo.toString().padStart(2, '0')}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          CHF {Number(emp.ahvWage).toLocaleString("de-CH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          CHF {Number(emp.alv1Wage).toLocaleString("de-CH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          CHF {Number(emp.alv2Wage).toLocaleString("de-CH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          CHF {Number(emp.bvgWage).toLocaleString("de-CH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={4} className="text-right">Total</TableCell>
                      <TableCell className="text-right font-mono">
                        CHF {report.employeeSummary.reduce((sum, emp) => sum + Number(emp.ahvWage), 0).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        CHF {report.employeeSummary.reduce((sum, emp) => sum + Number(emp.alv1Wage), 0).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        CHF {report.employeeSummary.reduce((sum, emp) => sum + Number(emp.alv2Wage), 0).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        CHF {report.employeeSummary.reduce((sum, emp) => sum + Number(emp.bvgWage), 0).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Kinderzulagen-Tabelle */}
          {report.childAllowanceEmployees && report.childAllowanceEmployees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Personen mit Kindergeld</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Versicherten-Nr.</TableHead>
                      <TableHead>Geburtstag</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Beschäftigungszeit von bis</TableHead>
                      <TableHead className="text-right">Kindergeld</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.childAllowanceEmployees.map((emp, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{emp.ahvNumber}</TableCell>
                        <TableCell>
                          {new Date(emp.birthDate).toLocaleDateString("de-CH")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {emp.lastName} {emp.firstName}
                        </TableCell>
                        <TableCell className="text-center">
                          {emp.employedFrom.toString().padStart(2, '0')}/{selectedYear} - {emp.employedTo.toString().padStart(2, '0')}/{selectedYear}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          CHF {Number(emp.childAllowance).toLocaleString("de-CH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Lohnsummen-Zusammenstellung nach Geschlecht */}
          {report.wageSummary && (
            <Card>
              <CardHeader>
                <CardTitle>Lohnsummen-Zusammenstellung nach Geschlecht</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Höchstlohn pro Person und Jahr CHF 300'000
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Kategorie</TableHead>
                      <TableHead className="text-right">Lohn Männer</TableHead>
                      <TableHead className="text-right">Lohn Frauen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">AHV-pflichtige Löhne gemäss Lohnbescheinigung</TableCell>
                      <TableCell className="text-right font-mono" data-testid="male-ahv-subject">
                        {Number(report.wageSummary.male.ahvSubject).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono" data-testid="female-ahv-subject">
                        {Number(report.wageSummary.female.ahvSubject).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8 text-sm text-muted-foreground">
                        + Nicht AHV-pflichtige Löhne<br />
                        <span className="text-xs">(Jugendlicher, AHV-Rentner, Praktikanten, Volontäre, Schnupperlehrlinge etc.)</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(report.wageSummary.male.nonAhvSubject) > 0 ? '+' : ''} {Number(report.wageSummary.male.nonAhvSubject).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(report.wageSummary.female.nonAhvSubject) > 0 ? '+' : ''} {Number(report.wageSummary.female.nonAhvSubject).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-semibold">
                        Total massgebende Lohnsummen<br />
                        <span className="text-xs font-normal text-muted-foreground">(Krankentaggeldversicherung und AHV-Lohnsumme für Unfallversicherung in Ergänzung)</span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        = {Number(report.wageSummary.male.totalRelevant).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        = {Number(report.wageSummary.female.totalRelevant).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Total Überschusslohnsumme (AHV-Lohn / UVG-Lohn)<br />
                        <span className="text-xs text-muted-foreground">
                          (Löhne ab CHF {Number(report.uvgMaxIncome).toLocaleString("de-CH", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })} pro Person und Jahr)
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        = {Number(report.wageSummary.male.excessWage).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        = {Number(report.wageSummary.female.excessWage).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8 text-sm text-muted-foreground">
                        - nicht UVG-prämienpflichtige Löhne<br />
                        <span className="text-xs">(z.B. EO-Entschädigungen, IV-/MV-Taggelder)</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(report.wageSummary.male.nonUvgPremium) > 0 ? '-' : ''} {Number(report.wageSummary.male.nonUvgPremium).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(report.wageSummary.female.nonUvgPremium) > 0 ? '-' : ''} {Number(report.wageSummary.female.nonUvgPremium).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-semibold">
                        Total UVG-Lohnsumme<br />
                        <span className="text-xs font-normal text-muted-foreground">
                          (Löhne bis CHF {Number(report.uvgMaxIncome).toLocaleString("de-CH", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })} pro Person und Jahr)
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        = {Number(report.wageSummary.male.uvgWage).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        = {Number(report.wageSummary.female.uvgWage).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Davon Lohnsumme von Personal mit weniger als 8 Stunden pro Woche<br />
                        <span className="text-xs font-semibold">Nur Berufsunfallversicherte</span>
                      </TableCell>
                      <TableCell className="text-right font-mono"></TableCell>
                      <TableCell className="text-right font-mono"></TableCell>
                    </TableRow>
                    <TableRow className="border-t-2 border-primary">
                      <TableCell className="font-semibold pt-4">
                        UVGO-Lohnsummen von Personen, die das 70. Altersjahr vollendet haben
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">BU-Lohnsumme</TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(report.wageSummary.male.uvgo70Plus_BU).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(report.wageSummary.female.uvgo70Plus_BU).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">NBU-Lohnsumme</TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(report.wageSummary.male.uvgo70Plus_NBU).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(report.wageSummary.female.uvgo70Plus_NBU).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Monthly Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monatsübersicht - {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Monat</TableHead>
                  <TableHead className="text-center">Anzahl Auszahlungen</TableHead>
                  <TableHead className="text-right">Bruttolohn</TableHead>
                  <TableHead className="text-right">Abzüge</TableHead>
                  <TableHead className="text-right">Nettolohn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.months.map((month) => (
                  <TableRow key={month.month} data-testid={`row-month-${month.month}`}>
                    <TableCell className="font-medium">{month.monthName}</TableCell>
                    <TableCell className="text-center">
                      {month.paymentsCount}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      CHF {Number(month.grossSalary).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      CHF {Number(month.deductions).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      CHF {Number(month.netSalary).toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Gesamt {selectedYear}</TableCell>
                  <TableCell className="text-center font-semibold">
                    {report.totals.paymentsCount}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    CHF {Number(report.totals.grossSalary).toLocaleString("de-CH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    CHF {Number(report.totals.deductions).toLocaleString("de-CH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    CHF {Number(report.totals.netSalary).toLocaleString("de-CH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">
                Keine Auszahlungen für {selectedYear}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
