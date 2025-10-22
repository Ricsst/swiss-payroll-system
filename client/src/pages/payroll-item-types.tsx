import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPayrollItemTypeSchema, type InsertPayrollItemType, type PayrollItemType } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayrollItemTypes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItemType, setEditingItemType] = useState<PayrollItemType | null>(null);
  const { toast } = useToast();

  const { data: itemTypes, isLoading } = useQuery<PayrollItemType[]>({
    queryKey: ["/api/payroll-item-types"],
  });

  const { data: company } = useQuery({
    queryKey: ["/api/company"],
  });

  const form = useForm<InsertPayrollItemType>({
    resolver: zodResolver(insertPayrollItemTypeSchema),
    defaultValues: {
      code: "",
      name: "",
      subjectToAhv: true,
      subjectToAlv: true,
      subjectToNbu: true,
      subjectToBvg: true,
      subjectToQst: true,
      isActive: true,
      sortOrder: 0,
      companyId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPayrollItemType) =>
      apiRequest("POST", "/api/payroll-item-types", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll-item-types"] });
      toast({ title: "Lohnart erfolgreich erstellt" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Lohnart konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertPayrollItemType }) =>
      apiRequest("PATCH", `/api/payroll-item-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll-item-types"] });
      toast({ title: "Lohnart erfolgreich aktualisiert" });
      setIsDialogOpen(false);
      setEditingItemType(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Lohnart konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest("DELETE", `/api/payroll-item-types/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll-item-types"] });
      toast({ title: "Lohnart erfolgreich gelöscht" });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Lohnart konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPayrollItemType) => {
    const companyId = (company as any)?.id;
    if (!companyId) {
      toast({
        title: "Keine Firma konfiguriert",
        description: "Bitte konfigurieren Sie zuerst die Firmendaten",
        variant: "destructive",
      });
      return;
    }

    const payload = { ...data, companyId };

    if (editingItemType) {
      updateMutation.mutate({ id: editingItemType.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (itemType: PayrollItemType) => {
    setEditingItemType(itemType);
    form.reset({
      code: itemType.code,
      name: itemType.name,
      subjectToAhv: itemType.subjectToAhv,
      subjectToAlv: itemType.subjectToAlv,
      subjectToNbu: itemType.subjectToNbu,
      subjectToBvg: itemType.subjectToBvg,
      subjectToQst: itemType.subjectToQst,
      isActive: itemType.isActive,
      sortOrder: itemType.sortOrder,
      companyId: itemType.companyId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie diese Lohnart wirklich löschen?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingItemType(null);
      form.reset();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="heading-payroll-item-types">
            Lohnarten
          </h1>
          <p className="text-sm text-muted-foreground">
            Verwalten Sie die verfügbaren Lohnarten und deren Abzugspflicht
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-payroll-item-type">
              <Plus className="h-4 w-4 mr-2" />
              Lohnart hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItemType ? "Lohnart bearbeiten" : "Neue Lohnart"}
              </DialogTitle>
              <DialogDescription>
                Erfassen Sie die Lohnart und definieren Sie, für welche Abzüge sie gilt
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nr / Code *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="01" data-testid="input-code" />
                        </FormControl>
                        <FormDescription>z.B. 01, 02, 03</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sortierung</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-sortorder"
                          />
                        </FormControl>
                        <FormDescription>Reihenfolge in der Liste</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lohnart *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="z.B. Monatslohn" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormLabel>Abzugspflicht (welche Abzüge gelten für diese Lohnart)</FormLabel>
                  <div className="grid grid-cols-5 gap-4">
                    <FormField
                      control={form.control}
                      name="subjectToAhv"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-center space-y-2">
                          <FormLabel className="text-center">AHV</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-ahv"
                              className="h-6 w-6"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subjectToAlv"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-center space-y-2">
                          <FormLabel className="text-center">ALV</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-alv"
                              className="h-6 w-6"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subjectToNbu"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-center space-y-2">
                          <FormLabel className="text-center">NBU</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-nbu"
                              className="h-6 w-6"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subjectToBvg"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-center space-y-2">
                          <FormLabel className="text-center">BVG</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-bvg"
                              className="h-6 w-6"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subjectToQst"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-center space-y-2">
                          <FormLabel className="text-center">QST</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-qst"
                              className="h-6 w-6"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-isactive"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Aktiv (in Lohnerfassung verfügbar)</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    data-testid="button-cancel"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Speichern..."
                      : "Speichern"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lohnarten Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : itemTypes && itemTypes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Nr</TableHead>
                  <TableHead>Lohnarten</TableHead>
                  <TableHead className="text-center w-16">AHV</TableHead>
                  <TableHead className="text-center w-16">ALV</TableHead>
                  <TableHead className="text-center w-16">NBU</TableHead>
                  <TableHead className="text-center w-16">BVG</TableHead>
                  <TableHead className="text-center w-16">QST</TableHead>
                  <TableHead className="text-center w-24">Status</TableHead>
                  <TableHead className="text-right w-32">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...itemTypes].sort((a, b) => a.code.localeCompare(b.code)).map((itemType) => (
                  <TableRow key={itemType.id} data-testid={`row-item-type-${itemType.id}`}>
                    <TableCell className="font-mono font-medium">
                      {itemType.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {itemType.name}
                    </TableCell>
                    <TableCell className="text-center">
                      {itemType.subjectToAhv ? (
                        <Check className="h-4 w-4 mx-auto text-green-600" />
                      ) : (
                        <X className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {itemType.subjectToAlv ? (
                        <Check className="h-4 w-4 mx-auto text-green-600" />
                      ) : (
                        <X className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {itemType.subjectToNbu ? (
                        <Check className="h-4 w-4 mx-auto text-green-600" />
                      ) : (
                        <X className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {itemType.subjectToBvg ? (
                        <Check className="h-4 w-4 mx-auto text-green-600" />
                      ) : (
                        <X className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {itemType.subjectToQst ? (
                        <Check className="h-4 w-4 mx-auto text-green-600" />
                      ) : (
                        <X className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={itemType.isActive ? "default" : "secondary"}>
                        {itemType.isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(itemType)}
                          data-testid={`button-edit-${itemType.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(itemType.id)}
                          data-testid={`button-delete-${itemType.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Keine Lohnarten vorhanden. Fügen Sie die erste Lohnart hinzu.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
