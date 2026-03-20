
import { supabase } from '@/integrations/supabase/client';
import { DocumentFormValues } from './document-schema';

export async function uploadDocumentFile(file: File, projectId: string) {
  if (!file) {
    throw new Error('Nenhum arquivo selecionado');
  }

  // Generate a unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
  const filePath = `${projectId}/${fileName}`;

  // Upload file to Supabase Storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (storageError) {
    console.error('Error uploading file:', storageError);
    throw new Error(`Erro ao fazer upload: ${storageError.message}`);
  }

  // Get public URL for the uploaded file
  const { data: publicUrlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error('Falha ao obter URL do arquivo');
  }

  return publicUrlData.publicUrl;
}

export async function saveDocumentRecord(values: Omit<DocumentFormValues, 'file'> & { fileUrl: string; userId: string }) {
  const { error } = await supabase.from('documents').insert({
    title: values.title,
    document_type: values.documentType,
    file_url: values.fileUrl,
    project_id: values.project_id,
    user_id: values.userId,
  });

  if (error) {
    console.error('Error saving document record:', error);
    throw new Error(`Erro ao salvar documento: ${error.message}`);
  }
}

export async function fetchDocuments(projectId?: string, userId?: string) {
  if (!userId) {
    throw new Error('ID do usuário é obrigatório');
  }

  let query = supabase.from('documents').select('*').eq('user_id', userId);
  
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching documents:', error);
    throw new Error(`Erro ao buscar documentos: ${error.message}`);
  }
  
  return data || [];
}

export async function deleteDocument(id: string, userId: string) {
  // Get the document details first to get file URL
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('file_url')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
    
  if (fetchError) {
    console.error('Error fetching document:', fetchError);
    throw new Error(`Erro ao buscar documento: ${fetchError.message}`);
  }
  
  // Delete the document record from the database
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error deleting document:', error);
    throw new Error(`Erro ao excluir documento: ${error.message}`);
  }
  
  // Try to delete the file from storage if we have a file URL
  if (document?.file_url) {
    try {
      // Extract the storage file path from the URL
      const filePathInBucket = document.file_url.split('documents/').pop();
      
      if (filePathInBucket) {
        // Remove the file from storage
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([filePathInBucket]);
          
        if (storageError) {
          console.error('Error removing file from storage:', storageError);
        }
      }
    } catch (err) {
      console.error('Error parsing file URL or removing from storage:', err);
    }
  }
}
