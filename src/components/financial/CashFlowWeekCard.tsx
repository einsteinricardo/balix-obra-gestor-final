import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/contexts/ProjectContext";

interface CashFlowWeekCardProps {
  startDate?: string;
  endDate?: string;
}

type EntryRow = {
  id: string;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  movement_type: string;
  description_category: string;
  item_description: string;
  location: string;
  payment_method: string;
  transaction_date: string;
  amount: number;
  item_number: number;
};

const colorByType = {
  entrada: "text-primary",
  saida: "text-destructive",
};

const CashFlowWeekCard: React.FC<CashFlowWeekCardProps> = ({ startDate, endDate }) => {
  const [weeksData, setWeeksData] = useState<Record<number, EntryRow[]>>({});
  const [loading, setLoading] = useState(true);
  const { selectedProjectId } = useProject();

  useEffect(() => {
    if (!selectedProjectId) {
      setWeeksData({});
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);

      let query = supabase
        .from("cash_flow_entries")
        .select("*")
        .eq("project_id", selectedProjectId);

      if (startDate) query = query.gte("transaction_date", startDate);
      if (endDate) query = query.lte("transaction_date", endDate);

      const { data, error } = await query
        .order("week_number", { ascending: true })
        .order("transaction_date", { ascending: true })
        .order("item_number", { ascending: true });

      if (!error && data) {
        const grouped: Record<number, EntryRow[]> = {};
        data.forEach((row: EntryRow) => {
          if (!grouped[row.week_number]) grouped[row.week_number] = [];
          grouped[row.week_number].push(row);
        });
        setWeeksData(grouped);
      } else {
        setWeeksData({});
      }

      setLoading(false);
    })();
  }, [selectedProjectId, startDate, endDate]);

  if (!selectedProjectId) {
    return (
      <Card className="mt-8 border-border bg-card p-8 text-center text-muted-foreground">
        Selecione uma obra para visualizar o fluxo de caixa.
      </Card>
    );
  }

  if (loading) {
    return <div className="py-10 text-center text-muted-foreground">Carregando fluxo de caixa...</div>;
  }

  const sortedWeeks = Object.keys(weeksData)
    .map(Number)
    .sort((a, b) => a - b);

  if (sortedWeeks.length === 0) {
    return (
      <Card className="mt-8 border-border bg-card p-8 text-center text-muted-foreground">
        Nenhum lançamento encontrado para o filtro selecionado.
      </Card>
    );
  }

  // Calculate cumulative balance
  let saldoAcumulado = 0;

  return (
    <div className="space-y-6">
      {sortedWeeks.map((wk) => {
        const rows = weeksData[wk];
        if (!rows.length) return null;

        const { week_start_date, week_end_date } = rows[0];
        const totals = rows.reduce(
          (acc, row) => {
            if (row.movement_type === "entrada") acc.entradas += Number(row.amount || 0);
            else acc.saidas += Number(row.amount || 0);
            if (row.description_category === "Materiais") acc.materiais += Number(row.amount || 0);
            if (row.description_category === "Mão de Obra") acc.mao_obra += Number(row.amount || 0);
            return acc;
          },
          { entradas: 0, saidas: 0, materiais: 0, mao_obra: 0 }
        );

        const saldoSemana = totals.entradas - totals.saidas;
        const saldoAnterior = saldoAcumulado;
        saldoAcumulado += saldoSemana;

        return (
          <Card key={wk} className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
            <div className="flex flex-col justify-between gap-3 border-b border-border bg-secondary/60 p-4 md:flex-row md:items-center">
              <div>
                <div className="text-lg font-bold text-primary">Semana {String(wk).padStart(2, "0")}</div>
                {week_start_date && week_end_date ? (
                  <p className="text-sm text-muted-foreground">
                    {new Date(`${week_start_date}T12:00:00`).toLocaleDateString("pt-BR")} -{" "}
                    {new Date(`${week_end_date}T12:00:00`).toLocaleDateString("pt-BR")}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-4 text-sm md:justify-end">
                <span className="font-semibold text-foreground">
                  Entradas: <span className="text-primary">R$ {totals.entradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </span>
                <span className="font-semibold text-foreground">
                  Saídas: <span className="text-destructive">R$ {totals.saidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Detalhamento</th>
                    <th className="px-4 py-3">Local</th>
                    <th className="px-4 py-3">Forma de pagamento</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.id} className={idx % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                      <td className="px-4 py-3 font-semibold text-primary">
                        {wk}.{row.item_number}
                      </td>
                      <td className={`px-4 py-3 ${colorByType[row.movement_type as "entrada" | "saida"] || "text-foreground"}`}>
                        {row.description_category}
                      </td>
                      <td className="px-4 py-3 text-foreground">{row.item_description}</td>
                      <td className="px-4 py-3 text-foreground">{row.location}</td>
                      <td className="px-4 py-3 text-foreground">{row.payment_method}</td>
                      <td className="px-4 py-3 text-foreground">
                        {new Date(`${row.transaction_date}T12:00:00`).toLocaleDateString("pt-BR")}
                      </td>
                      <td className={`px-4 py-3 font-bold ${colorByType[row.movement_type as "entrada" | "saida"] || "text-foreground"}`}>
                        R$ {Number(row.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border font-semibold text-foreground">
                    <td colSpan={2} className="px-4 py-2 text-right">Materiais:</td>
                    <td colSpan={5} className="px-4 py-2 text-primary">R$ {totals.materiais.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="font-semibold text-foreground">
                    <td colSpan={2} className="px-4 py-2 text-right">Mão de Obra:</td>
                    <td colSpan={5} className="px-4 py-2 text-primary">R$ {totals.mao_obra.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="font-semibold text-foreground border-t border-border">
                    <td colSpan={2} className="px-4 py-2 text-right">Saldo Semana Anterior:</td>
                    <td colSpan={5} className={`px-4 py-2 ${saldoAnterior >= 0 ? "text-primary" : "text-destructive"}`}>
                      R$ {saldoAnterior.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="font-semibold">
                    <td colSpan={2} className="px-4 py-2 text-right text-foreground">Saldo Semana:</td>
                    <td colSpan={5} className={`px-4 py-2 ${saldoSemana >= 0 ? "text-primary" : "text-destructive"}`}>
                      R$ {saldoSemana.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="font-bold bg-secondary/40">
                    <td colSpan={2} className="px-4 py-2 text-right text-foreground">Saldo Acumulado:</td>
                    <td colSpan={5} className={`px-4 py-2 ${saldoAcumulado >= 0 ? "text-primary" : "text-destructive"}`}>
                      R$ {saldoAcumulado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default CashFlowWeekCard;
