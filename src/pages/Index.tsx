
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsSection from '@/components/dashboard/StatsSection';
import ShortcutsSection from '@/components/dashboard/ShortcutsSection';
import ChartsSection from '@/components/dashboard/ChartsSection';
import AlertsSection from '@/components/dashboard/AlertsSection';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function Index() {
  const [profile, setProfile] = useState<any>(null);
  const { user } = useAuth();
  const { projectsCount, financialTotal, loading } = useDashboardData();

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

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <DashboardHeader fullName={profile?.full_name} />
        
        <StatsSection 
          projectsCount={projectsCount} 
          financialTotal={financialTotal} 
        />
        
        <ShortcutsSection />
        
        <ChartsSection />
        
        <AlertsSection />
      </div>
    </AppLayout>
  );
}
