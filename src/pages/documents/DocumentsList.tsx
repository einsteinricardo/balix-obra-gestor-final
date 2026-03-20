
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/components/layout/AppLayout';
import DocumentsTable from '@/components/documents/DocumentsTable';
import DocumentUploadForm from '@/components/documents/DocumentUploadForm';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import PermissionGuard from '@/components/rbac/PermissionGuard';

interface Document {
  id: string;
  title: string;
  document_type: string;
  file_url: string;
  project_id?: string;
  created_at: string;
  user_id: string;
}

const DocumentsList = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editDocument, setEditDocument] = useState<Document | null>(null);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { selectedProjectId } = useProject();

  useEffect(() => {
    if (!authLoading && user && selectedProjectId) {
      fetchDocuments();
    }
  }, [user, authLoading, selectedProjectId]);

  const fetchDocuments = async () => {
    if (!user || !selectedProjectId) return;
    setIsLoading(true);
    try {
      const activeProjectId = projectId || selectedProjectId;
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', activeProjectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar documentos', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      setDocuments(documents.filter(doc => doc.id !== id));
      toast({ title: 'Documento excluído', description: 'O documento foi excluído com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro ao excluir documento', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditDocument = (document: Document) => { setEditDocument(document); setFormOpen(true); };
  const handleFormClose = (refresh = false) => { setFormOpen(false); setEditDocument(null); if (refresh) fetchDocuments(); };

  if (authLoading) {
    return <AppLayout><div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-balix-accent"></div></div></AppLayout>;
  }

  if (!user) {
    return <AppLayout><div className="text-center py-12"><p className="text-lg text-gray-600">Você precisa estar logado para ver os documentos.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-balix-dark">Documentos</h2>
            <p className="text-muted-foreground">{projectId ? 'Gerencie os documentos deste projeto.' : 'Gerencie todos os documentos da sua obra.'}</p>
          </div>
          <PermissionGuard module="documentacao" action="create" obraId={selectedProjectId}>
            <div className="flex gap-2">
              <Button onClick={() => setFormOpen(true)} className="bg-balix-accent hover:bg-balix-accent/90 text-white">
                <Plus className="mr-2 h-4 w-4" />Novo Documento
              </Button>
            </div>
          </PermissionGuard>
        </div>

        <DocumentsTable documents={documents} onEdit={handleEditDocument} onDelete={handleDeleteDocument} isLoading={isLoading} />

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle className="text-balix-dark">{editDocument ? 'Editar Documento' : 'Novo Documento'}</DialogTitle></DialogHeader>
            <DocumentUploadForm projectId={projectId} document={editDocument} onClose={handleFormClose} />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default DocumentsList;
