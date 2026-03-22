import React, { useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Filter, FilterX, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CashFlowFiltersProps {
  onFilterChange: (filters: {
    startDate?: string;
    endDate?: string;
    period?: string;
  }) => void;
  filterType: 'semana' | 'intervalo';
  setFilterType: (type: 'semana' | 'intervalo') => void;
}

const months = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const CashFlowFilters: React.FC<CashFlowFiltersProps> = ({ onFilterChange, filterType, setFilterType }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const handleCustomPeriodFilter = () => {
    setSelectedWeek("");
    setSelectedMonth("");
    onFilterChange({ startDate, endDate, period: "custom" });
  };

  const handleWeekFilter = (weekOption: string) => {
    setSelectedWeek(weekOption);
    setSelectedMonth("");
    setStartDate("");
    setEndDate("");

    const today = new Date();
    let start: Date;
    let end: Date;

    switch (weekOption) {
      case "current":
        start = startOfWeek(today, { locale: ptBR, weekStartsOn: 1 });
        end = endOfWeek(today, { locale: ptBR, weekStartsOn: 1 });
        break;
      case "last":
        start = startOfWeek(subWeeks(today, 1), { locale: ptBR, weekStartsOn: 1 });
        end = endOfWeek(subWeeks(today, 1), { locale: ptBR, weekStartsOn: 1 });
        break;
      default:
        return;
    }

    onFilterChange({
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
      period: "week",
    });
  };

  const handleMonthFilter = (monthOption: string) => {
    setSelectedMonth(monthOption);
    setSelectedWeek("");
    setStartDate("");
    setEndDate("");

    const today = new Date();
    let start: Date;
    let end: Date;

    switch (monthOption) {
      case "current":
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case "last":
        start = startOfMonth(subMonths(today, 1));
        end = endOfMonth(subMonths(today, 1));
        break;
      default: {
        const monthNum = parseInt(monthOption, 10);
        if (monthNum < 1 || monthNum > 12) return;
        start = new Date(today.getFullYear(), monthNum - 1, 1);
        end = endOfMonth(start);
      }
    }

    onFilterChange({
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
      period: "month",
    });
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedWeek("");
    setSelectedMonth("");
    onFilterChange({});
  };

  const hasActiveFilters = startDate || endDate || selectedWeek || selectedMonth;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Filtros de Exibição</h3>
        </div>
        
        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as 'semana' | 'intervalo')} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="semana" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Por Semanas
            </TabsTrigger>
            <TabsTrigger value="intervalo" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Por Intervalo
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {filterType === 'intervalo' ? (
          <div className="space-y-3 md:col-span-2">
            <Label className="font-medium text-foreground">Seleção por Intervalo de Datas</Label>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="cashflow-start-date" className="text-sm text-muted-foreground">
                  Data inicial
                </Label>
                <Input
                  id="cashflow-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="cashflow-end-date" className="text-sm text-muted-foreground">
                  Data final
                </Label>
                <Input
                  id="cashflow-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background"
                />
              </div>
              <Button onClick={handleCustomPeriodFilter} className="w-full sm:w-auto" disabled={!startDate || !endDate}>
                Filtrar período
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <Label className="font-medium text-foreground">Filtro por Semana</Label>
              <Select value={selectedWeek || undefined} onValueChange={handleWeekFilter}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Selecionar semana" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Semana atual</SelectItem>
                  <SelectItem value="last">Última semana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="font-medium text-foreground">Filtro por Mês</Label>
              <Select value={selectedMonth || undefined} onValueChange={handleMonthFilter}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Selecionar mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Mês atual</SelectItem>
                  <SelectItem value="last">Último mês</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={clearFilters}>
            <FilterX className="mr-2 h-4 w-4" />
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
};

export default CashFlowFilters;
