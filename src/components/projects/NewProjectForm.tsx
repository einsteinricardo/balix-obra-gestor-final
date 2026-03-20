
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
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  name: z.string().min(3, 'Nome do projeto deve ter no mínimo 3 caracteres'),
  address: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  technical_manager: z.string().min(3, 'Nome do responsável deve ter no mínimo 3 caracteres'),
});

type FormValues = z.infer<typeof formSchema>;

interface NewProjectFormProps {
  onClose: (refresh?: boolean) => void;
}

const NewProjectForm: React.FC<NewProjectFormProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      technical_manager: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para criar um projeto.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: result, error } = await supabase
        .from('projects')
        .insert([{
          name: data.name,
          address: data.address,
          technical_manager: data.technical_manager,
          user_id: user.id
        }])
        .select();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }

      toast({
        title: 'Projeto criado com sucesso',
        description: 'O projeto foi adicionado ao sistema.',
      });

      onClose(true);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: 'Erro ao criar projeto',
        description: error.message || 'Erro desconhecido ao criar projeto',
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
                <Input placeholder="Ex: Residencial Villa Serena" {...field} />
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
                <Input placeholder="Ex: Rua das Flores, 123, São Paulo - SP" {...field} />
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
                <Input placeholder="Nome do responsável pela obra" {...field} />
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
            {isSubmitting ? 'Criando...' : 'Criar Projeto'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NewProjectForm;
