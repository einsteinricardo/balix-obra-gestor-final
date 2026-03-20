
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProgressFilterOptions } from '@/types/progress';
import { CalendarIcon, FilterX, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProgressFilterProps {
  stages: string[];
  selectedStage: string;
  onStageChange: (stage: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (dateRange: { start: string; end: string }) => void;
}

const ProgressFilter: React.FC<ProgressFilterProps> = ({ 
  stages, 
  selectedStage, 
  onStageChange, 
  dateRange, 
  onDateRangeChange 
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    dateRange.start ? new Date(dateRange.start) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    dateRange.end ? new Date(dateRange.end) : undefined
  );

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    onDateRangeChange({
      start: date ? format(date, 'yyyy-MM-dd') : '',
      end: dateRange.end
    });
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    onDateRangeChange({
      start: dateRange.start,
      end: date ? format(date, 'yyyy-MM-dd') : ''
    });
  };

  const handleStageChange = (value: string) => {
    onStageChange(value);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onStageChange('all');
    onDateRangeChange({ start: '', end: '' });
  };

  const constructionStages = [
    { value: 'servicos_preliminares', label: 'Serviços preliminares' },
    { value: 'movimentacao_terra', label: 'Movimentação de terra' },
    { value: 'estrutura', label: 'Estrutura' },
    { value: 'paredes_paineis', label: 'Paredes e Painéis' },
    { value: 'revestimento', label: 'Revestimento' },
    { value: 'pisos', label: 'Pisos' },
    { value: 'esquadria_ferragens', label: 'Esquadria e Ferragens' },
    { value: 'inst_hidrossanitarias', label: 'Instalações hidrossanitárias' },
    { value: 'loucas_metais', label: 'Louças e Metais' },
    { value: 'acabamento', label: 'Acabamento (soleiras, peitoris e bancadas)' },
    { value: 'inst_eletricas', label: 'Instalações elétricas' },
    { value: 'impermeabilizacao', label: 'Impermeabilização' },
    { value: 'cobertura', label: 'Cobertura' },
    { value: 'pintura', label: 'Pintura' },
    { value: 'other', label: 'Outro' },
  ];

  const hasActiveFilters = !!startDate || !!endDate || selectedStage !== 'all';

  return (
    <div className="bg-muted/40 p-4 rounded-lg space-y-4">
      <h3 className="text-sm font-medium mb-2">Filtrar Registros</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stage">Etapa</Label>
          <Select
            value={selectedStage}
            onValueChange={handleStageChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas as etapas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as etapas</SelectItem>
              {constructionStages.map(stage => (
                <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Data Inicial</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'dd/MM/yyyy') : 'Selecionar data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateSelect}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Data Final</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'dd/MM/yyyy') : 'Selecionar data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateSelect}
                fromDate={startDate}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            <FilterX className="mr-1 h-3 w-3" />
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProgressFilter;
