
import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Download, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PermissionGuard from '@/components/rbac/PermissionGuard';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  title: string;
  document_type: string;
  file_url: string;
  created_at: string;
}

interface DocumentsTableProps {
  documents: Document[];
  onEdit: (document: Document) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents, onEdit, onDelete, isLoading = false }) => {
  const { selectedProjectId } = useProject();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'estrutural': 'Estrutural', 'arquitetonico': 'Arquitetônico',
      'licenca': 'Licença', 'art_rrt': 'ART/RRT', 'outros': 'Outros',
    };
    return typeMap[type] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'estrutural': 'bg-green-100 text-green-800', 'arquitetonico': 'bg-blue-100 text-blue-800',
      'licenca': 'bg-purple-100 text-purple-800', 'art_rrt': 'bg-orange-100 text-orange-800',
      'outros': 'bg-gray-100 text-gray-800',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  // Extract the storage path from the file_url to generate fresh signed URLs
  const getStoragePath = (fileUrl: string): string | null => {
    try {
      // Handle signed URLs or public URLs from Supabase storage
      const match = fileUrl.match(/\/storage\/v1\/(?:object|s3)\/(?:public\/|sign\/)?documents\/(.+?)(?:\?|$)/);
      if (match) return match[1];
      // Fallback: try to extract path after 'documents/'
      const fallback = fileUrl.split('/documents/').pop();
      if (fallback) return fallback.split('?')[0];
      return null;
    } catch {
      return null;
    }
  };

  const getFreshSignedUrl = useCallback(async (fileUrl: string): Promise<string> => {
    const path = getStoragePath(fileUrl);
    if (!path) return fileUrl;

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600); // 1 hour

    if (error || !data?.signedUrl) {
      console.error('Error creating signed URL:', error);
      return fileUrl;
    }
    return data.signedUrl;
  }, []);

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const url = await getFreshSignedUrl(fileUrl);
      // Use fetch + blob to force download
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'documento';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      toast({ title: 'Erro ao baixar', description: 'Não foi possível baixar o documento.', variant: 'destructive' });
    }
  };

  const handlePreview = async (fileUrl: string) => {
    try {
      const url = await getFreshSignedUrl(fileUrl);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(fileUrl);
    }
  };

  const isPdf = (url: string) => url.toLowerCase().includes('.pdf');
  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)/i.test(url);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando documentos...</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="rounded-lg p-8 max-w-md mx-auto border border-border bg-card">
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum documento encontrado</h3>
          <p className="text-muted-foreground mb-4">Nenhum documento foi encontrado para este projeto.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Documento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data de Upload</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>
                  <Badge className={getDocumentTypeColor(doc.document_type)}>{getDocumentTypeLabel(doc.document_type)}</Badge>
                </TableCell>
                <TableCell>{format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {(isPdf(doc.file_url) || isImage(doc.file_url)) && (
                      <Button variant="outline" size="sm" onClick={() => handlePreview(doc.file_url)} className="h-8 w-8 p-0" title="Visualizar">
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc.file_url, doc.title)} className="h-8 w-8 p-0" title="Baixar">
                      <Download className="h-3 w-3" />
                    </Button>
                    <PermissionGuard module="documentacao" action="update" obraId={selectedProjectId}>
                      <Button variant="outline" size="sm" onClick={() => onEdit(doc)} className="h-8 w-8 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </PermissionGuard>
                    <PermissionGuard module="documentacao" action="delete" obraId={selectedProjectId}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>Tem certeza que deseja excluir o documento "{doc.title}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(doc.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </PermissionGuard>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualizar Documento</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            isImage(previewUrl) ? (
              <img src={previewUrl} alt="Documento" className="w-full h-auto max-h-[70vh] object-contain" />
            ) : (
              <iframe src={previewUrl} className="w-full h-[70vh] rounded border border-border" title="Visualizar documento" />
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentsTable;
