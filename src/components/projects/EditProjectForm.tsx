
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  address: string;
  technical_manager: string;
}

const formSchema = z.object({
  name: z.string().min(3, 'Nome do projeto deve ter no mínimo 3 caracteres'),
  address: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  technical_manager: z.string().min(3, 'Nome do responsável deve ter no mínimo 3 caracteres'),
});

type FormValues = z.infer<typeof formSchema>;

interface EditProjectFormProps {
  project: Project;
  onClose: (refresh?: boolean) => void;
}

const EditProjectForm: React.FC<EditProjectFormProps> = ({ project, onClose }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project.name,
      address: project.address,
      technical_manager: project.technical_manager,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('projects')
        .update({
          name: data.name,
          address: data.address,
          technical_manager: data.technical_manager,
        })
        .eq('id', project.id)
        .select();

      if (error) {
        console.error('Error updating project:', error);
        throw error;
      }

      toast({
        title: 'Projeto atualizado com sucesso',
        description: 'As alterações foram salvas.',
      });

      onClose(true);
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast({
        title: 'Erro ao atualizar projeto',
        description: error.message || 'Erro desconhecido ao atualizar projeto',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Projeto</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="technical_manager"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsável Técnico</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onClose(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="bg-balix-accent hover:bg-balix-accent/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditProjectForm;
