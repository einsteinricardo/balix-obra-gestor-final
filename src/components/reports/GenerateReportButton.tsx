import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { FileText, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';
import CashFlowReportPDF from './CashFlowReportPDF';
import ReceiptsReportPDF from './ReceiptsReportPDF';

interface GenerateReportButtonProps {
  startDate?: string;
  endDate?: string;
  mode: 'fluxo' | 'comprovantes';
}

interface EntryRow {
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
  receipt_url?: string;
}

const GenerateReportButton: React.FC<GenerateReportButtonProps> = ({ startDate, endDate, mode }) => {
  const [loading, setLoading] = useState(false);
  const { selectedProject, selectedProjectId } = useProject();

  const handleGenerate = async () => {
    if (!selectedProjectId || !selectedProject) {
      toast.error('Selecione uma obra para gerar o relatório.');
      return;
    }

    setLoading(true);

    try {
      let query = supabase
        .from('cash_flow_entries')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('week_number', { ascending: true })
        .order('transaction_date', { ascending: true })
        .order('item_number', { ascending: true });

      if (startDate) query = query.gte('transaction_date', startDate);
      if (endDate) query = query.lte('transaction_date', endDate);

      const { data, error } = await query;

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('Nenhum lançamento encontrado para gerar o relatório.');
        setLoading(false);
        return;
      }

      // Group by week
      const grouped: Record<number, EntryRow[]> = {};
      (data as EntryRow[]).forEach((row) => {
        if (!grouped[row.week_number]) grouped[row.week_number] = [];
        grouped[row.week_number].push(row);
      });

      const sortedWeeks = Object.keys(grouped).map(Number).sort((a, b) => a - b);

      let saldoAcumulado = 0;
      let totalEntradas = 0;
      let totalSaidas = 0;

      const weeks = sortedWeeks.map((wk) => {
        const rows = grouped[wk];
        const entradas = rows.filter(r => r.movement_type === 'entrada').reduce((s, r) => s + Number(r.amount), 0);
        const saidas = rows.filter(r => r.movement_type === 'saida').reduce((s, r) => s + Number(r.amount), 0);
        const saldoSemana = entradas - saidas;
        const saldoAnterior = saldoAcumulado;
        saldoAcumulado += saldoSemana;
        totalEntradas += entradas;
        totalSaidas += saidas;

        return {
          weekNumber: wk,
          startDate: rows[0].week_start_date,
          endDate: rows[0].week_end_date,
          entradas,
          saidas,
          saldoSemana,
          saldoAnterior,
          saldoAcumulado,
          items: rows.map(r => ({
            itemNumber: r.item_number,
            descriptionCategory: r.description_category,
            itemDescription: r.item_description,
            location: r.location,
            paymentMethod: r.payment_method,
            transactionDate: r.transaction_date,
            amount: Number(r.amount),
            movementType: r.movement_type,
            receiptUrls: r.receipt_url ? r.receipt_url.split(',') : [],
          })),
        };
      });

      let filterPeriod: string | undefined;
      if (startDate && endDate) {
        const s = new Date(`${startDate}T12:00:00`).toLocaleDateString('pt-BR');
        const e = new Date(`${endDate}T12:00:00`).toLocaleDateString('pt-BR');
        filterPeriod = `${s} — ${e}`;
      }

      const reportContent = mode === 'fluxo' ? (
        <CashFlowReportPDF
          projectName={selectedProject.name}
          technicalManager={selectedProject.technical_manager || ''}
          weeks={weeks}
          totalEntradas={totalEntradas}
          totalSaidas={totalSaidas}
          saldoFinal={saldoAcumulado}
          filterPeriod={filterPeriod}
        />
      ) : (
        <ReceiptsReportPDF
          projectName={selectedProject.name}
          technicalManager={selectedProject.technical_manager || ''}
          weeks={weeks}
          filterPeriod={filterPeriod}
        />
      );

      const blob = await pdf(reportContent).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = selectedProject.name.replace(/[^a-zA-Z0-9]/g, '_');
      const title = mode === 'fluxo' ? 'Relatorio_Fluxo_Caixa' : 'Relatorio_Comprovantes';
      
      link.href = url;
      link.download = `${title}_${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Relatório PDF gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Erro ao gerar o relatório PDF.');
    } finally {
      setLoading(false);
    }
  };

  const isFluxo = mode === 'fluxo';

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={loading || !selectedProjectId} 
      variant={isFluxo ? "outline" : "default"}
      className={!isFluxo ? "bg-balix-accent hover:bg-balix-accent/90 text-[#151f0e] font-semibold" : ""}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isFluxo ? (
        <FileText className="mr-2 h-4 w-4" />
      ) : (
        <ImageIcon className="mr-2 h-4 w-4" />
      )}
      {isFluxo ? "Relatório Fluxo de Caixa" : "Relatório Comprovantes"}
    </Button>
  );
};

export default GenerateReportButton;
