import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { endOfWeek, format, getWeek, startOfWeek } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CurrencyInput from "@/components/financial/CurrencyInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

const formSchema = z.object({
  week_number: z.coerce.number().int().positive("Informe um número válido."),
  week_range: z.object({
    from: z.date({ required_error: "Data inicial obrigatória." }),
    to: z.date({ required_error: "Data final obrigatória." }).optional()
  }, { required_error: "Selecione o intervalo da semana." })
    .refine((data) => data.from && data.to, { message: "Selecione também a data final." })
    .refine((data) => data.from && data.to && data.from <= data.to, { message: "A data final deve ser maior." }),
  movement_type: z.enum(["entrada", "saida"], {
    required_error: "Selecione o tipo de movimentação.",
  }),
  description_category: z.string().min(1, "Selecione a categoria."),
  item_description: z.string().min(1, "Informe o detalhamento."),
  location: z.string().min(1, "Informe o local ou referência."),
  payment_method: z.string().min(1, "Selecione a forma de pagamento."),
  transaction_date: z.string().min(1, "Selecione a data."),
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  id: z.string().optional(),
});

interface FinancialFormProps {
  userId: string;
  record?: any;
  onClose: (refresh?: boolean) => void;
}

const MOVEMENT_TYPES = [
  { label: "Entrada", value: "entrada" },
  { label: "Saída", value: "saida" },
] as const;

const ENTRADAS = ["Pagamento do cliente", "Investimento", "Receita adicional", "Outros"];
const SAIDAS = ["Materiais", "Mão de Obra", "Equipamentos", "Serviços", "Licenças e Taxas", "Outros"];
const PAYMENT_METHODS = ["transferencia", "pix", "cartao_credito", "dinheiro", "boleto"];

export const FinancialForm: React.FC<FinancialFormProps> = ({ userId, record, onClose }) => {
  const { toast } = useToast();
  const { selectedProjectId } = useProject();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      week_number: record?.week_number || undefined,
      week_range: record?.week_start_date && record?.week_end_date 
        ? { from: new Date(`${record.week_start_date}T12:00:00`), to: new Date(`${record.week_end_date}T12:00:00`) } 
        : undefined,
      movement_type: (record?.movement_type || record?.type || undefined) as
        | "entrada"
        | "saida"
        | undefined,
      description_category: record?.description_category || record?.category || "",
      item_description: record?.item_description || record?.description || "",
      location: record?.location || "",
      payment_method: record?.payment_method || "",
      transaction_date: record?.transaction_date || record?.date || "",
      amount: record?.amount || 0,
      id: record?.id,
    },
  });

  useEffect(() => {
    form.reset({
      week_number: record?.week_number || undefined,
      week_range: record?.week_start_date && record?.week_end_date 
        ? { from: new Date(`${record.week_start_date}T12:00:00`), to: new Date(`${record.week_end_date}T12:00:00`) } 
        : undefined,
      movement_type: (record?.movement_type || record?.type || undefined) as
        | "entrada"
        | "saida"
        | undefined,
      description_category: record?.description_category || record?.category || "",
      item_description: record?.item_description || record?.description || "",
      location: record?.location || "",
      payment_method: record?.payment_method || "",
      transaction_date: record?.transaction_date || record?.date || "",
      amount: record?.amount || 0,
      id: record?.id,
    });
  }, [record, form]);

  const movementType = form.watch("movement_type");
  const selectedCategory = form.watch("description_category");
  const descriptionOptions = movementType === "entrada" ? ENTRADAS : movementType === "saida" ? SAIDAS : [];

  useEffect(() => {
    if (selectedCategory && !descriptionOptions.includes(selectedCategory)) {
      form.setValue("description_category", "");
    }
  }, [descriptionOptions, form, selectedCategory]);

  const getNextItemNumber = async (weekNumber: number) => {
    const { data, error } = await supabase
      .from("cash_flow_entries")
      .select("item_number")
      .eq("project_id", selectedProjectId)
      .eq("week_number", weekNumber)
      .order("item_number", { ascending: false })
      .limit(1);

    if (error) throw error;
    return ((data?.[0]?.item_number as number | undefined) || 0) + 1;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedProjectId) {
      toast({ title: "Erro", description: "Selecione uma obra primeiro.", variant: "destructive" });
      return;
    }

    try {
      const transactionDate = new Date(`${values.transaction_date}T12:00:00`);

      if (Number.isNaN(transactionDate.getTime())) {
        throw new Error("Data inválida.");
      }

      const weekStart = values.week_range.from;
      const weekEnd = values.week_range.to as Date;
      const weekNumber = values.week_number;
      const shouldRecalculateItem = !record?.id || record?.week_number !== weekNumber;
      const itemNumber = shouldRecalculateItem
        ? await getNextItemNumber(weekNumber)
        : Number(record?.item_number || 1);

      const upsertData = {
        id: record?.id,
        user_id: userId,
        project_id: selectedProjectId,
        week_number: weekNumber,
        week_start_date: format(weekStart, "yyyy-MM-dd"),
        week_end_date: format(weekEnd, "yyyy-MM-dd"),
        movement_type: values.movement_type,
        description_category: values.description_category,
        item_description: values.item_description,
        location: values.location,
        payment_method: values.payment_method,
        transaction_date: values.transaction_date,
        amount: Number(values.amount),
        item_number: itemNumber,
      };

      const { error } = await supabase.from("cash_flow_entries").upsert(upsertData);
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Movimentação financeira salva com sucesso.",
      });
      onClose(true);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-border bg-secondary/30 p-5">
        <div className="mb-5 space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Dados da movimentação</h3>
          <p className="text-sm text-muted-foreground">
            Preencha os dados do lançamento financeiro.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="week_number">Número da Semana</Label>
            <Input
              id="week_number"
              type="number"
              min="1"
              placeholder="Ex: 1, 2, 3..."
              className="bg-background/80"
              {...form.register("week_number")}
            />
            {form.formState.errors.week_number && (
              <p className="text-sm text-destructive">{form.formState.errors.week_number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Intervalo da Semana</Label>
            <DatePickerWithRange
              date={form.watch("week_range")}
              setDate={(date) => form.setValue("week_range", date as DateRange, { shouldValidate: true })}
            />
            {form.formState.errors.week_range && (
              <p className="text-sm text-destructive">{form.formState.errors.week_range.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement_type">Tipo de movimentação</Label>
            <Select
              value={movementType}
              onValueChange={(value: "entrada" | "saida") => form.setValue("movement_type", value, { shouldValidate: true })}
            >
              <SelectTrigger id="movement_type" className="bg-background/80">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.movement_type && (
              <p className="text-sm text-destructive">{form.formState.errors.movement_type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_category">Categoria</Label>
            <Select
              value={selectedCategory || undefined}
              onValueChange={(value) => form.setValue("description_category", value, { shouldValidate: true })}
              disabled={!movementType}
            >
              <SelectTrigger id="description_category" className="bg-background/80">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {descriptionOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.description_category && (
              <p className="text-sm text-destructive">{form.formState.errors.description_category.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="item_description">Descrição do item</Label>
            <Input
              id="item_description"
              placeholder="Descreva o lançamento"
              className="bg-background/80"
              {...form.register("item_description")}
            />
            {form.formState.errors.item_description && (
              <p className="text-sm text-destructive">{form.formState.errors.item_description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local / referência</Label>
            <Input
              id="location"
              placeholder="Fornecedor, cliente ou local"
              className="bg-background/80"
              {...form.register("location")}
            />
            {form.formState.errors.location && (
              <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Forma de pagamento</Label>
            <Select
              value={form.watch("payment_method") || undefined}
              onValueChange={(value) => form.setValue("payment_method", value, { shouldValidate: true })}
            >
              <SelectTrigger id="payment_method" className="bg-background/80">
                <SelectValue placeholder="Selecione a forma" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method === "transferencia"
                      ? "Transferência"
                      : method === "pix"
                        ? "Pix"
                        : method === "cartao_credito"
                          ? "Cartão de crédito"
                          : method === "dinheiro"
                            ? "Dinheiro"
                            : "Boleto"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.payment_method && (
              <p className="text-sm text-destructive">{form.formState.errors.payment_method.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction_date">Data da movimentação</Label>
            <Input
              id="transaction_date"
              type="date"
              className="bg-background/80"
              {...form.register("transaction_date")}
            />
            {form.formState.errors.transaction_date && (
              <p className="text-sm text-destructive">{form.formState.errors.transaction_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <CurrencyInput
              id="amount"
              value={form.watch("amount") || 0}
              onChange={(val) => form.setValue("amount", val, { shouldValidate: true })}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => onClose()}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar lançamento
        </Button>
      </div>
    </form>
  );
};
