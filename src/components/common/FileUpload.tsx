
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  bucket: string;
  onUpload: (url: string) => void;
  accept?: string;
  maxSize?: number;
  userId: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  bucket,
  onUpload,
  accept = "*/*",
  maxSize = 10 * 1024 * 1024,
  userId
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      if (file.size > maxSize) {
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Store the full public URL path (for private buckets, we generate fresh signed URLs at display time)
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      onUpload(publicUrl);
      
      toast({
        title: 'Arquivo enviado com sucesso',
        description: 'O arquivo foi carregado e está pronto para uso.',
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        type="file"
        accept={accept}
        onChange={uploadFile}
        disabled={uploading}
        className="cursor-pointer"
      />
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Upload className="h-4 w-4 animate-spin" />
          Enviando arquivo...
        </div>
      )}
    </div>
  );
};

export default FileUpload;
