
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import FileUpload from '@/components/common/FileUpload';

const documentFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  document_type: z.enum(['estrutural', 'arquitetonico', 'licenca', 'art_rrt', 'outros']),
  file_url: z.string().min(1, 'Arquivo é obrigatório'),
});

type DocumentFormData = z.infer<typeof documentFormSchema>;

interface DocumentUploadFormProps {
  projectId?: string;
  document?: any;
  onClose: (refresh?: boolean) => void;
}

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
  projectId,
  document,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState(document?.file_url || '');
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedProjectId } = useProject();

  const activeProjectId = projectId || selectedProjectId;

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: document?.title || '',
      document_type: document?.document_type || 'outros',
      file_url: document?.file_url || '',
    },
  });

  useEffect(() => {
    form.setValue('file_url', fileUrl);
  }, [fileUrl, form]);

  const onSubmit = async (data: DocumentFormData) => {
    if (!user) {
      toast({ title: 'Erro de autenticação', description: 'Você precisa estar logado.', variant: 'destructive' });
      return;
    }

    if (!activeProjectId) {
      toast({ title: 'Erro', description: 'Selecione uma obra primeiro.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const documentData = {
        title: data.title,
        document_type: data.document_type,
        file_url: data.file_url,
        project_id: activeProjectId,
        user_id: user.id,
      };

      if (document) {
        const { error } = await supabase.from('documents').update(documentData).eq('id', document.id);
        if (error) throw error;
        toast({ title: 'Documento atualizado', description: 'O documento foi atualizado com sucesso.' });
      } else {
        const { error } = await supabase.from('documents').insert(documentData);
        if (error) throw error;
        toast({ title: 'Documento adicionado', description: 'O novo documento foi adicionado com sucesso.' });
      }

      onClose(true);
    } catch (error: any) {
      console.error('Failed to save document:', error);
      toast({ title: 'Erro ao salvar documento', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Documento</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Projeto Estrutural, Licença de Obra..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="document_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Documento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="estrutural">📐 Estrutural</SelectItem>
                  <SelectItem value="arquitetonico">🏛️ Arquitetônico</SelectItem>
                  <SelectItem value="licenca">📋 Licença</SelectItem>
                  <SelectItem value="art_rrt">📝 ART/RRT</SelectItem>
                  <SelectItem value="outros">📄 Outros</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Arquivo do Documento</FormLabel>
          {user && (
            <FileUpload
              bucket="documents"
              onUpload={setFileUrl}
              accept=".pdf,.doc,.docx,.dwg,.jpg,.jpeg,.png"
              userId={user.id}
            />
          )}
          {fileUrl && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">✅ Arquivo carregado com sucesso</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                Ver arquivo
              </a>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onClose()}>Cancelar</Button>
          <Button type="submit" disabled={isLoading || !fileUrl} className="bg-balix-accent hover:bg-balix-accent/90">
            {isLoading ? 'Salvando...' : document ? 'Atualizar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DocumentUploadForm;
