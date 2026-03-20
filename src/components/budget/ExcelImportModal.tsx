
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ATIVIDADES_PRINCIPAIS } from '@/types/budget';

interface ExcelImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ExcelRow {
  'Atividade Principal': string;
  'Atividade Secundária': string;
  'Unidade': string;
  'Quantidade': number;
  'Custo Material': number;
  'Custo Mão de Obra': number;
}

const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ open, onOpenChange, onImportComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedProjectId } = useProject();

  const validateRow = (row: any, index: number): string[] => {
    const errors: string[] = [];
    if (!row['Atividade Principal']) errors.push(`Linha ${index + 2}: Atividade Principal é obrigatória`);
    else if (!ATIVIDADES_PRINCIPAIS.includes(row['Atividade Principal'])) errors.push(`Linha ${index + 2}: Atividade Principal "${row['Atividade Principal']}" não é válida`);
    if (!row['Atividade Secundária']) errors.push(`Linha ${index + 2}: Atividade Secundária é obrigatória`);
    if (!row['Unidade']) errors.push(`Linha ${index + 2}: Unidade é obrigatória`);
    else if (!['m', 'm²', 'm³', 'vb'].includes(row['Unidade'])) errors.push(`Linha ${index + 2}: Unidade deve ser m, m², m³ ou vb`);
    if (!row['Quantidade'] || isNaN(Number(row['Quantidade'])) || Number(row['Quantidade']) <= 0) errors.push(`Linha ${index + 2}: Quantidade deve ser um número maior que zero`);
    if (!row['Custo Material'] || isNaN(Number(row['Custo Material'])) || Number(row['Custo Material']) < 0) errors.push(`Linha ${index + 2}: Custo Material deve ser um número válido`);
    if (!row['Custo Mão de Obra'] || isNaN(Number(row['Custo Mão de Obra'])) || Number(row['Custo Mão de Obra']) < 0) errors.push(`Linha ${index + 2}: Custo Mão de Obra deve ser um número válido`);
    return errors;
  };

  const processExcelFile = async (file: File) => {
    if (!user || !selectedProjectId) return;
    setIsUploading(true);
    setValidationErrors([]);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
      if (jsonData.length === 0) throw new Error('O arquivo Excel está vazio ou não possui dados válidos');

      const allErrors: string[] = [];
      jsonData.forEach((row, index) => { allErrors.push(...validateRow(row, index)); });
      if (allErrors.length > 0) { setValidationErrors(allErrors); return; }

      let successCount = 0;
      for (const row of jsonData) {
        try {
          let { data: existingOrcamento, error: searchError } = await supabase
            .from('orcamentos').select('id')
            .eq('user_id', user.id).eq('project_id', selectedProjectId)
            .eq('atividade_principal', row['Atividade Principal']).single();
          if (searchError && searchError.code !== 'PGRST116') throw searchError;

          let orcamentoId: string;
          if (!existingOrcamento) {
            const { data: newOrcamento, error: orcamentoError } = await supabase
              .from('orcamentos')
              .insert({ user_id: user.id, project_id: selectedProjectId, atividade_principal: row['Atividade Principal'] })
              .select('id').single();
            if (orcamentoError) throw orcamentoError;
            orcamentoId = newOrcamento.id;
          } else {
            orcamentoId = existingOrcamento.id;
          }

          const { error: atividadeError } = await supabase.from('orcamento_atividades').insert({
            orcamento_id: orcamentoId, descricao: row['Atividade Secundária'],
            unidade: row['Unidade'], quantidade: Number(row['Quantidade']),
            custo_material: Number(row['Custo Material']), custo_mao_obra: Number(row['Custo Mão de Obra'])
          });
          if (atividadeError) throw atividadeError;
          successCount++;
        } catch (error: any) {
          allErrors.push(`Erro ao importar linha: ${error.message}`);
        }
      }

      if (allErrors.length > 0) {
        setValidationErrors(allErrors);
      } else {
        toast({ title: 'Importação concluída', description: `${successCount} atividades foram importadas com sucesso.` });
        onImportComplete();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({ title: 'Erro na importação', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      { 'Atividade Principal': 'Estrutura', 'Atividade Secundária': 'Concretagem de laje', 'Unidade': 'm³', 'Quantidade': 25, 'Custo Material': 12500, 'Custo Mão de Obra': 5000 },
      { 'Atividade Principal': 'Serviços preliminares', 'Atividade Secundária': 'Tapume e isolamento', 'Unidade': 'm', 'Quantidade': 100, 'Custo Material': 3000, 'Custo Mão de Obra': 1200 }
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orçamento');
    XLSX.writeFile(workbook, 'modelo_orcamento.xlsx');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#1e2914] border-[#2f3b24]">
        <DialogHeader><DialogTitle className="text-[#8b4a12] flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" />Importar Orçamento via Excel</DialogTitle></DialogHeader>
        <div className="space-y-6">
          <div className="bg-[#262d1f] rounded-lg p-4 border border-[#2f3b24]">
            <h3 className="text-[#8b4a12] font-semibold mb-2">Instruções de Importação</h3>
            <ul className="text-sm text-[#d6d6d6] space-y-1">
              <li>• O arquivo deve estar no formato .xlsx</li><li>• Tamanho máximo: 10MB</li>
              <li>• Use os cabeçalhos exatos: Atividade Principal, Atividade Secundária, Unidade, Quantidade, Custo Material, Custo Mão de Obra</li>
              <li>• Unidades aceitas: m, m², m³, vb</li>
            </ul>
            <Button onClick={downloadTemplate} variant="outline" className="mt-3 border-[#dda23a] text-[#dda23a] hover:bg-[#dda23a] hover:text-[#151f0e]">
              <Download className="h-4 w-4 mr-2" />Baixar Modelo Excel
            </Button>
          </div>
          <div>
            <Label htmlFor="excel-file" className="text-[#8b4a12]">Arquivo Excel (.xlsx)</Label>
            <Input id="excel-file" type="file" accept=".xlsx" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 10 * 1024 * 1024) { toast({ title: 'Arquivo muito grande', description: 'O arquivo deve ter no máximo 10MB', variant: 'destructive' }); return; }
                processExcelFile(file);
              }
            }} disabled={isUploading} className="bg-[#262d1f] border-[#7b420e] text-white cursor-pointer" />
          </div>
          {validationErrors.length > 0 && (
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2"><AlertCircle className="h-4 w-4 text-red-400" /><h4 className="text-red-400 font-semibold">Erros de Validação</h4></div>
              <ul className="text-sm text-red-300 space-y-1 max-h-40 overflow-y-auto">{validationErrors.map((error, index) => <li key={index}>• {error}</li>)}</ul>
            </div>
          )}
          {isUploading && <div className="flex items-center justify-center py-8"><div className="flex items-center gap-3"><Upload className="h-5 w-5 text-[#dda23a] animate-pulse" /><span className="text-[#d6d6d6]">Processando arquivo...</span></div></div>}
          <div className="flex gap-3"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-[#2f3b24] text-[#d6d6d6] hover:bg-[#2f3b24]" disabled={isUploading}>Cancelar</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImportModal;
