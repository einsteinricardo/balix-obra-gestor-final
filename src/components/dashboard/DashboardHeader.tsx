
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';

interface DashboardHeaderProps {
  fullName: string | undefined;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ fullName }) => {
  const [errorCount, setErrorCount] = useState<number>(0);
  
  useEffect(() => {
    async function fetchRecentErrors() {
      try {
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        
        const { count, error } = await (supabase as any)
          .from('error_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', oneDayAgo.toISOString());
        
        if (error) {
          console.error('Error fetching error logs count:', error);
          return;
        }
        
        setErrorCount(count || 0);
      } catch (err) {
        console.error('Failed to fetch error logs count:', err);
      }
    }
    
    fetchRecentErrors();
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-3xl font-bold font-playfair">
          Bem-vindo, {fullName || 'Usuário'}!
        </h2>
        <p className="text-balix-light/80">Aqui está uma visão geral do seu sistema</p>
      </div>
      
      <div className="flex items-center gap-4">
        {errorCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/admin/error-logs" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs bg-destructive">
                    {errorCount}
                  </Badge>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{errorCount} erros nas últimas 24 horas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
