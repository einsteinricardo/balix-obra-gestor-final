import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface ImageUploadProps {
  onUpload: (urls: string[]) => void;
  existingImages?: string[];
  multiple?: boolean;
  userId: string;
  clearOnSuccess?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  existingImages = [],
  multiple = true,
  userId,
  clearOnSuccess = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(existingImages);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const files = Array.from(event.target.files);
    const validFiles: File[] = [];
    const validUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione apenas imagens.',
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: 'Imagem muito grande',
          description: 'Tamanho máximo: 5MB',
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push(file);
      validUrls.push(URL.createObjectURL(file));
    }

    setSelectedFiles(prev => multiple ? [...prev, ...validFiles] : validFiles);
    setPreviewUrls(prev => multiple ? [...prev, ...validUrls] : validUrls);
    
    // Clear the input so selecting the same file again triggers onChange
    event.target.value = '';
  };

  const confirmUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('work-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('work-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      if (clearOnSuccess) {
        onUpload(uploadedUrls);
      } else {
        const newImages = multiple ? [...images, ...uploadedUrls] : uploadedUrls;
        setImages(newImages);
        onUpload(newImages);
      }
      
      // 1. Revogar URLs
      previewUrls.forEach((url) => URL.revokeObjectURL(url));

      // 2. Limpar estados
      setSelectedFiles([]);
      setPreviewUrls([]);

      // 3. Resetar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: 'Imagens adicionadas com sucesso',
        description: `${uploadedUrls.length} imagem(ns) carregada(s).`,
      });
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);
    onUpload(newImages);
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setPreviewUrls(prev => {
      const url = prev[indexToRemove];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleSelectImages}
          disabled={uploading}
          className="cursor-pointer max-w-xs bg-background/50"
        />
        {selectedFiles.length > 0 && (
          <Button 
            onClick={confirmUpload} 
            disabled={uploading} 
            className="bg-balix-accent hover:bg-balix-accent/90 text-[#151f0e] font-semibold"
          >
            {uploading ? (
              <Upload className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Adicionar Imagens ({selectedFiles.length})
          </Button>
        )}
      </div>

      {(images.length > 0 || previewUrls.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={`existing-${index}`} className="relative group">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative cursor-pointer rounded-lg overflow-hidden border hover:border-balix-accent transition-colors">
                    <img
                      src={imageUrl}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <Image className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <img
                    src={imageUrl}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-auto max-h-[80vh] object-contain"
                  />
                </DialogContent>
              </Dialog>
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          {previewUrls.map((previewUrl, index) => (
            <div key={`preview-${index}`} className="relative group rounded-lg overflow-hidden border-2 border-dashed border-balix-accent aspect-video md:aspect-auto">
              <img
                src={previewUrl}
                alt={`Pre-selecionada ${index + 1}`}
                className="w-full h-24 object-cover opacity-70"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 font-semibold text-white text-xs text-center p-2 hover:bg-black/60 transition-colors">
                Pronta para enviar
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={() => removeSelectedFile(index)}
                disabled={uploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
