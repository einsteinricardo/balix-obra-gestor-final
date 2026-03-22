
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsSection from '@/components/dashboard/StatsSection';
import ShortcutsSection from '@/components/dashboard/ShortcutsSection';
import ChartsSection from '@/components/dashboard/ChartsSection';
import AlertsSection from '@/components/dashboard/AlertsSection';
import IntelligentProgress from '@/components/dashboard/IntelligentProgress';
import ActivitiesStatus from '@/components/dashboard/ActivitiesStatus';
import RecentImagesGallery from '@/components/dashboard/RecentImagesGallery';
import PaymentProgress from '@/components/dashboard/PaymentProgress';
import { useAdvancedDashboardData } from '@/hooks/useAdvancedDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function Index() {
  const [profile, setProfile] = useState<any>(null);
  const { user } = useAuth();
  const { 
    projectsCount, 
    financialTotal, 
    intelligentProgress, 
    activitiesStatus, 
    recentImages, 
    monthlyCashFlow,
    expectedTotalCost,
    paymentProgress,
    userRole,
    loading 
  } = useAdvancedDashboardData();

  // Fetch user profile and update state
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        if (!user?.id) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        setProfile(data);
      } catch (error: any) {
        console.error('Error fetching profile:', error);
      }
    }

    fetchUserProfile();
  }, [user]);

  const isClient = userRole === 'Cliente' || userRole === 'cliente';

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-10 animate-pulse p-6">
          <Skeleton className="h-20 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto pb-16 space-y-8 animate-fade-in px-4 sm:px-6 lg:px-10 pt-6">
        {/* TOPO: Boas-vindas */}
        <DashboardHeader fullName={profile?.full_name} />
        
        {/* LINHA 1: KPIs Principais (4 cards) */}
        <section>
          <StatsSection 
            projectsCount={projectsCount} 
            financialTotal={financialTotal}
            expectedTotalCost={expectedTotalCost}
            userRole={userRole}
          />
        </section>

        {/* LINHA 2: Ações Rápidas (Full Width) */}
        <section id="shortcuts-section" className="bg-white/[0.01] p-8 rounded-[24px] border border-white/[0.04] backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-5 bg-[#a2632a] rounded-full shadow-[0_0_12px_rgba(162,99,42,0.4)]" />
            <h3 className="text-[16px] font-bold tracking-[1px] uppercase text-white/40">Navegação e Atalhos Operacionais</h3>
          </div>
          <ShortcutsSection />
        </section>
        
        {/* LINHA 3: Indicadores Executivos (Gauge e Fluxo) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5">
            <IntelligentProgress 
              progress={intelligentProgress} 
              expectedTotalCost={expectedTotalCost} 
            />
          </div>
          
          <div className="lg:col-span-7">
            {!isClient ? (
              <ChartsSection monthlyCashFlow={monthlyCashFlow} />
            ) : (
              <PaymentProgress paymentProgress={paymentProgress} />
            )}
          </div>
        </section>

        {/* LINHA 4: Detalhamento de Atividades e Financeiro (50/50) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <ActivitiesStatus activities={activitiesStatus} />
          
          <div className="flex flex-col gap-8">
            {!isClient ? (
              <PaymentProgress paymentProgress={paymentProgress} />
            ) : (
              <RecentImagesGallery images={recentImages} />
            )}
          </div>
        </section>

        {!isClient && (
          <section className="pt-4">
            <RecentImagesGallery images={recentImages} />
          </section>
        )}
      </div>
    </AppLayout>
  );
}
