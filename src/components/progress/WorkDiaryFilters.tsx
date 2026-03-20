
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, FilterX } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkDiaryFiltersProps {
  onFilterChange: (filters: {
    startDate?: string;
    endDate?: string;
    period?: string;
  }) => void;
}

const WorkDiaryFilters: React.FC<WorkDiaryFiltersProps> = ({ onFilterChange }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const handleCustomPeriodFilter = () => {
    onFilterChange({ startDate, endDate });
  };

  const handleWeekFilter = (weekOption: string) => {
    setSelectedWeek(weekOption);
    const today = new Date();
    let start: Date, end: Date;

    switch (weekOption) {
      case 'current':
        start = startOfWeek(today, { locale: ptBR });
        end = endOfWeek(today, { locale: ptBR });
        break;
      case 'last':
        start = startOfWeek(subWeeks(today, 1), { locale: ptBR });
        end = endOfWeek(subWeeks(today, 1), { locale: ptBR });
        break;
      default:
        return;
    }

    onFilterChange({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    });
  };

  const handleMonthFilter = (monthOption: string) => {
    setSelectedMonth(monthOption);
    const today = new Date();
    let start: Date, end: Date;

    switch (monthOption) {
      case 'current':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'last':
        start = startOfMonth(subMonths(today, 1));
        end = endOfMonth(subMonths(today, 1));
        break;
      default:
        // Handle specific months (1-12)
        const monthNum = parseInt(monthOption);
        if (monthNum >= 1 && monthNum <= 12) {
          start = new Date(today.getFullYear(), monthNum - 1, 1);
          end = endOfMonth(start);
        } else {
          return;
        }
    }

    onFilterChange({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    });
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedWeek('');
    setSelectedMonth('');
    onFilterChange({});
  };

  const hasActiveFilters = startDate || endDate || selectedWeek || selectedMonth;

  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  return (
    <div className="bg-[#1e2914] p-6 rounded-xl border border-[#2f3b24] mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-[#8b4a12]" />
        <h3 className="text-lg font-semibold text-[#8b4a12]">Filtros Avançados</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Período Personalizado */}
        <div className="space-y-3">
          <Label className="text-white font-medium">Período Personalizado</Label>
          <div className="space-y-2">
            <div>
              <Label className="text-sm text-[#d6d6d6]">Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#262d1f] border-[#2f3b24] text-white"
              />
            </div>
            <div>
              <Label className="text-sm text-[#d6d6d6]">Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#262d1f] border-[#2f3b24] text-white"
              />
            </div>
            <Button 
              onClick={handleCustomPeriodFilter}
              className="w-full bg-[#dda23a] hover:bg-[#e8b949] text-[#151f0e]"
              disabled={!startDate || !endDate}
            >
              Filtrar Período
            </Button>
          </div>
        </div>

        {/* Filtro por Semana */}
        <div className="space-y-3">
          <Label className="text-white font-medium">Filtro por Semana</Label>
          <Select value={selectedWeek} onValueChange={handleWeekFilter}>
            <SelectTrigger className="bg-[#262d1f] border-[#2f3b24] text-white">
              <SelectValue placeholder="Selecionar Semana" />
            </SelectTrigger>
            <SelectContent className="bg-[#262d1f] border-[#2f3b24]">
              <SelectItem value="current">Semana Atual</SelectItem>
              <SelectItem value="last">Última Semana</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por Mês */}
        <div className="space-y-3">
          <Label className="text-white font-medium">Filtro por Mês</Label>
          <Select value={selectedMonth} onValueChange={handleMonthFilter}>
            <SelectTrigger className="bg-[#262d1f] border-[#2f3b24] text-white">
              <SelectValue placeholder="Selecionar Mês" />
            </SelectTrigger>
            <SelectContent className="bg-[#262d1f] border-[#2f3b24]">
              <SelectItem value="current">Mês Atual</SelectItem>
              <SelectItem value="last">Último Mês</SelectItem>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="border-[#2f3b24] text-[#d6d6d6] hover:bg-[#262d1f]"
          >
            <FilterX className="mr-2 h-4 w-4" />
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
};

export default WorkDiaryFilters;
