import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import CashFlowFilters from "@/components/financial/CashFlowFilters";
import CashFlowWeekCard from "@/components/financial/CashFlowWeekCard";
import PermissionGuard from "@/components/rbac/PermissionGuard";
import GenerateReportButton from "@/components/reports/GenerateReportButton";

const CashFlow: React.FC = () => {
  const [filterType, setFilterType] = useState<'semana' | 'intervalo'>('semana');
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    period?: string;
  }>({});

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-primary">Fluxo de Caixa</h2>
            <p className="text-muted-foreground">
              Acompanhe a movimentação financeira semanal da sua obra.
            </p>
          </div>
          <PermissionGuard module="relatorios" action="read">
            <div className="flex flex-wrap gap-3">
              <GenerateReportButton 
                startDate={filters.startDate} 
                endDate={filters.endDate} 
                mode="fluxo"
              />
              <GenerateReportButton 
                startDate={filters.startDate} 
                endDate={filters.endDate} 
                mode="comprovantes"
              />
            </div>
          </PermissionGuard>
        </div>

        <CashFlowFilters 
          onFilterChange={setFilters} 
          filterType={filterType}
          setFilterType={setFilterType}
        />
        <CashFlowWeekCard startDate={filters.startDate} endDate={filters.endDate} />
      </div>
    </AppLayout>
  );
};

export default CashFlow;
