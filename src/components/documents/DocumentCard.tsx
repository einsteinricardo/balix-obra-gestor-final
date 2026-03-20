
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Download, File, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DocumentItem {
  id: string;
  title: string;
  document_type: string;
  file_url: string;
  created_at: string;
  project_id: string;
}

interface DocumentCardProps {
  document: DocumentItem;
  onDelete: (id: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete }) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);

  const getFileType = (url: string) => {
    if (!url) return 'other';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.pdf') || lowerUrl.endsWith('.pdf')) return 'pdf';
    if (lowerUrl.match(/\.(jpeg|jpg|png|webp|gif|bmp)(\?.*)?$/)) return 'image';
    return 'other';
  };

  const fileType = getFileType(document.file_url);

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      planta_arquitetonica: 'Planta Arquitetônica',
      projeto_estrutural: 'Projeto Estrutural',
      projeto_eletrico: 'Projeto Elétrico',
      projeto_hidraulico: 'Projeto Hidráulico',
      orcamento: 'Orçamento',
      contrato: 'Contrato',
      alvara: 'Alvará',
      imagem: 'Imagem/Foto',
      outros: 'Outros',
      licenca_ambiental: 'Licença Ambiental',
      art: 'ART',
    };
    
    return typeMap[type] || 'Documento';
  };

  const getDocumentIcon = () => {
    return <File className="h-10 w-10 text-balix-accent" />;
  };

  const handleDownload = async () => {
    try {
      // Get the file name from the URL
      const fileName = document.file_url.split('/').pop();

      // Create a temporary anchor element to trigger the download
      // Using window.document instead of document to avoid the naming conflict
      const a = window.document.createElement('a');
      a.href = document.file_url;
      a.download = fileName || document.title;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);

      toast({
        title: 'Download iniciado',
        description: `O download de "${document.title}" foi iniciado.`,
      });
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Erro ao baixar documento',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDocument = async () => {
    try {
      setIsDeleting(true);
      
      // Delete the document record from the database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;

      // Extract the storage file path from the URL
      // This assumes the file URL follows the format: https://base-url/path-to-bucket/path-in-bucket
      const filePathInBucket = document.file_url.split('project-documents/').pop();
      
      if (filePathInBucket) {
        // Remove the file from storage
        const { error: storageError } = await supabase.storage
          .from('project-documents')
          .remove([filePathInBucket]);
          
        if (storageError) {
          console.error('Error removing file from storage:', storageError);
        }
      }

      toast({
        title: 'Documento excluído',
        description: `O documento "${document.title}" foi excluído com sucesso.`,
      });

      onDelete(document.id);
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Erro ao excluir documento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="dashboard-card overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getDocumentIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{document.title}</h3>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-xs text-balix-light/70">
                Tipo: <span className="text-balix-light">{getDocumentTypeLabel(document.document_type)}</span>
              </p>
              <p className="text-xs text-balix-light/70">
                Enviado em: <span className="text-balix-light">{new Date(document.created_at).toLocaleDateString('pt-BR')}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 border border-transparent rounded-full hover:bg-balix-accent/10 hover:text-balix-accent"
                  title="Visualizar"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Visualizar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-4xl h-[90vh] flex flex-col p-4">
                <DialogHeader className="mb-2">
                  <DialogTitle className="truncate pr-8">{document.title}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 w-full bg-black/5 rounded-md overflow-hidden relative flex flex-col items-center justify-center">
                  {fileType === 'pdf' ? (
                    <iframe
                      src={document.file_url}
                      className="w-full h-full border-none"
                      title={document.title}
                    />
                  ) : fileType === 'image' ? (
                    <img
                      src={document.file_url}
                      alt={document.title}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <File className="h-16 w-16 mx-auto text-balix-light/50 mb-4" />
                      <h4 className="text-lg font-medium text-balix-dark mb-2">Formato não suportado</h4>
                      <p className="text-balix-light mb-6">A visualização direta deste tipo de arquivo não está disponível.</p>
                      <Button onClick={handleDownload} className="bg-balix-accent text-white hover:bg-balix-accent/90">
                        <Download className="mr-2 h-4 w-4" />
                        Baixar Arquivo
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 rounded-full hover:bg-balix-accent/10 hover:text-balix-accent"
              onClick={handleDownload}
              title="Baixar"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Baixar</span>
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full hover:bg-red-500/10 hover:text-red-500"
                  title="Excluir"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Excluir</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir documento</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o documento "{document.title}"? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-red-500 hover:bg-red-600"
                    onClick={handleDeleteDocument}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Excluindo...' : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentCard;
