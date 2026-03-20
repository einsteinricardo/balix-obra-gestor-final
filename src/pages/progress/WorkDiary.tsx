
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/components/layout/AppLayout';
import WorkDiaryCards from '@/components/progress/WorkDiaryCards';
import WorkDiaryFilters from '@/components/progress/WorkDiaryFilters';
import WorkDiaryForm from '@/components/progress/WorkDiaryForm';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { WorkDiaryEntry } from '@/types/progress';
import PermissionGuard from '@/components/rbac/PermissionGuard';

const WorkDiary = () => {
  const [entries, setEntries] = useState<WorkDiaryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<WorkDiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<WorkDiaryEntry | null>(null);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { selectedProjectId } = useProject();

  useEffect(() => {
    if (!authLoading && user && selectedProjectId) {
      fetchEntries();
    }
  }, [user, authLoading, selectedProjectId]);

  useEffect(() => {
    setFilteredEntries(entries);
  }, [entries]);

  const fetchEntries = async () => {
    if (!user || !selectedProjectId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('work_diary')
        .select('*, diario_imagens(id, url_imagem)')
        .eq('project_id', selectedProjectId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching work diary entries:', error);
        throw error;
      }
      
      console.log('Fetched work diary entries:', data);
      setEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching work diary entries:', error);
      toast({
        title: 'Erro ao carregar entradas do diário',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filters: { startDate?: string; endDate?: string; period?: string }) => {
    let filtered = [...entries];

    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        const startDate = new Date(filters.startDate!);
        const endDate = new Date(filters.endDate!);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    setFilteredEntries(filtered);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!user) return;
    
    try {
      console.log('Deleting work diary entry:', id);
      const { error } = await supabase
        .from('work_diary')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting work diary entry:', error);
        throw error;
      }

      setEntries(entries.filter(entry => entry.id !== id));
      setFilteredEntries(filteredEntries.filter(entry => entry.id !== id));
      toast({
        title: 'Entrada excluída',
        description: 'A entrada do diário foi excluída com sucesso.',
      });
    } catch (error: any) {
      console.error('Error deleting work diary entry:', error);
      toast({
        title: 'Erro ao excluir entrada',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEditEntry = (entry: WorkDiaryEntry) => {
    setEditEntry(entry);
    setFormOpen(true);
  };

  const handleFormClose = (refresh = false) => {
    setFormOpen(false);
    setEditEntry(null);
    if (refresh) {
      fetchEntries();
    }
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dda23a]"></div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-lg text-[#d6d6d6]">Você precisa estar logado para ver o diário de obras.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#8b4a12]">Diário de Obras</h2>
            <p className="text-[#d6d6d6]">
              Registre e acompanhe as atividades diárias da sua obra.
            </p>
          </div>
          
          <PermissionGuard module="diario_obra" action="create" obraId={selectedProjectId}>
            <div className="flex gap-2">
              <Button 
                onClick={() => setFormOpen(true)}
                className="bg-[#dda23a] hover:bg-[#e8b949] text-[#151f0e]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Entrada
              </Button>
            </div>
          </PermissionGuard>
        </div>

        <WorkDiaryFilters onFilterChange={handleFilterChange} />

        <WorkDiaryCards 
          entries={filteredEntries}
          onEdit={handleEditEntry}
          onDelete={handleDeleteEntry}
          isLoading={isLoading}
        />

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-[600px] bg-[#1e2914] border-[#2f3b24]">
            <DialogHeader>
              <DialogTitle className="text-[#8b4a12]">
                {editEntry ? 'Editar Entrada' : 'Nova Entrada'}
              </DialogTitle>
            </DialogHeader>
            <WorkDiaryForm 
              entry={editEntry}
              onClose={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default WorkDiary;
