
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { DocumentFormValues } from './document-schema';
import { Upload, File, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DocumentFileInputProps {
  form: UseFormReturn<DocumentFormValues>;
}

const DocumentFileInput: React.FC<DocumentFileInputProps> = ({ form }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isError, setIsError] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
  };

  const handleFile = (file: File | null) => {
    if (file) {
      if (file.size > 10000000) {
        setIsError(true);
        form.setError('file', { 
          type: 'manual', 
          message: 'O arquivo deve ter menos de 10MB' 
        });
        return;
      }
      
      setIsError(false);
      setSelectedFile(file);
      form.setValue('file', file);
      form.clearErrors('file');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getFileTypeIcon = () => {
    if (!selectedFile) return null;
    
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <img 
        src={URL.createObjectURL(selectedFile)} 
        alt="Preview" 
        className="h-10 w-10 object-cover rounded"
      />;
    }
    
    return <File className="h-10 w-10 text-balix-accent" />;
  };

  return (
    <FormItem>
      <FormLabel>Arquivo</FormLabel>
      <FormControl>
        <div 
          className={cn(
            "flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 transition-colors",
            isDragging ? "border-balix-accent bg-balix-accent/5" : "border-gray-300",
            isError ? "border-red-500 bg-red-50" : "",
            "cursor-pointer"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <Input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-2">
                {getFileTypeIcon()}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  form.setValue('file', undefined);
                }}
              >
                Trocar arquivo
              </Button>
            </div>
          ) : (
            <>
              {isError ? (
                <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              ) : (
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
              )}
              <p className="text-sm font-medium">
                {isError ? "Arquivo muito grande" : "Arraste e solte um arquivo aqui ou clique para selecionar"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: PDF, DOC, XLS, JPG, PNG (máx. 10MB)
              </p>
            </>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

export default DocumentFileInput;
