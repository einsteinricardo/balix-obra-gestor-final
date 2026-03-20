import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import CashFlowFilters from "@/components/financial/CashFlowFilters";
import CashFlowWeekCard from "@/components/financial/CashFlowWeekCard";
import PermissionGuard from "@/components/rbac/PermissionGuard";
import GenerateReportButton from "@/components/reports/GenerateReportButton";

const CashFlow: React.FC = () => {
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    period?: string;
  }>({});

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-primary">Fluxo de Caixa</h2>
            <p className="text-muted-foreground">
              Acompanhe a movimentação financeira semanal da sua obra.
            </p>
          </div>
          <PermissionGuard module="relatorios" action="read">
            <GenerateReportButton startDate={filters.startDate} endDate={filters.endDate} />
          </PermissionGuard>
        </div>

        <CashFlowFilters onFilterChange={setFilters} />
        <CashFlowWeekCard startDate={filters.startDate} endDate={filters.endDate} />
      </div>
    </AppLayout>
  );
};

export default CashFlow;
