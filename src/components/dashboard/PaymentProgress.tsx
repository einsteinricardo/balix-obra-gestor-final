import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentProgressProps {
  paymentProgress: {
    totalAmount: number;
    paidAmount: number;
    percentage: number;
    totalInstallments: number;
    paidInstallments: number;
  };
  isLoading?: boolean;
}

const PaymentProgress: React.FC<PaymentProgressProps> = ({ paymentProgress, isLoading }) => {
  const { totalAmount, paidAmount, percentage, totalInstallments, paidInstallments } = paymentProgress;
  const pendingAmount = totalAmount - paidAmount;
  const pendingInstallments = totalInstallments - paidInstallments;

  if (isLoading) {
    return (
      <Card className="h-full bg-white/[0.02] border border-white/[0.08] rounded-[16px] animate-pulse min-h-[300px]" />
    );
  }

  // Check if there's any administration data
  const hasAdministration = totalAmount > 0 || totalInstallments > 0;

  if (!hasAdministration) {
    return (
      <Card className="bg-white/[0.02] border border-white/[0.08] rounded-[16px] shadow-[0_6px_24px_rgba(0,0,0,0.25)] backdrop-blur-[6px] h-full flex flex-col pt-2 overflow-hidden">
        <CardHeader className="pb-4 shrink-0">
          <CardTitle className="text-[16px] font-semibold tracking-[0.3px] text-white/90 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[#a2632a]" /> Pagamento Administração
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/5">
            <AlertCircle className="h-6 w-6 text-white/10" />
          </div>
          <div className="space-y-1">
            <p className="text-white/60 font-medium">Nenhuma administração cadastrada</p>
            <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold">Cadastre na aba Administração</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/[0.02] border border-white/[0.08] rounded-[16px] shadow-[0_6px_24px_rgba(0,0,0,0.25)] backdrop-blur-[6px] h-full overflow-hidden flex flex-col pt-2 group transition-all duration-300">
      <CardHeader className="pb-4 flex-shrink-0">
         <CardTitle className="text-[18px] font-semibold tracking-[0.3px] text-white/90 font-playfair flex items-center gap-2">
           <Wallet className="h-5 w-5 text-[#a2632a]" /> Pagamento Administração
         </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-7 pt-0 pb-8 px-8 flex flex-col justify-center">
        {/* Main Indicator: Percentage */}
        <div className="space-y-1.5 text-center sm:text-left">
          <p className="text-[11px] text-white/30 uppercase tracking-[0.2em] font-black">Status de Quitação</p>
          <div className="flex items-baseline gap-2 justify-center sm:justify-start">
            <span className="text-5xl font-black font-playfair text-white tracking-tighter">
              {percentage}%
            </span>
            <span className="text-sm font-bold text-[#a2632a] uppercase tracking-widest bg-[#a2632a]/10 px-2 py-0.5 rounded-md">
              pago
            </span>
          </div>
        </div>

        {/* Progress Bar - Orange Balix #a2632a */}
        <div className="space-y-3">
           <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
             <div 
               className="h-full bg-[#a2632a] rounded-full shadow-[0_0_12px_rgba(162,99,42,0.4)] transition-all duration-1000 ease-out"
               style={{ width: `${percentage}%` }}
             />
           </div>
        </div>

        {/* Financial Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Valor Pago</p>
            <p className="text-lg font-black text-white/90 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(paidAmount)}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Valor Restante</p>
            <p className="text-lg font-bold text-white/40 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(pendingAmount)}
            </p>
          </div>
        </div>

        {/* Installment Details */}
        <div className="pt-5 border-t border-white/5 grid grid-cols-2 gap-4 items-center">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white/80">
              {paidInstallments} <span className="text-white/20 font-normal">de</span> {totalInstallments}
            </span>
            <span className="text-[9px] text-white/30 uppercase tracking-widest font-black">Parcelas Pagas</span>
          </div>
          <div className="text-right">
             <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
               <span className="text-xs font-black text-[#a2632a]">{pendingInstallments}</span>
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">restantes</span>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentProgress;
