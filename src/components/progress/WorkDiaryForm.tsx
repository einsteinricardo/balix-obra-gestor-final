
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { format } from 'date-fns';
import ImageUpload from '@/components/common/ImageUpload';
import { WorkDiaryEntry } from '@/types/progress';

const workDiarySchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  responsible: z.string().min(1, 'Responsável é obrigatório'),
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'partly_cloudy']).optional(),
});

type WorkDiaryFormData = z.infer<typeof workDiarySchema>;

interface WorkDiaryFormProps {
  entry?: WorkDiaryEntry;
  onClose: (refresh?: boolean) => void;
}

const WorkDiaryForm: React.FC<WorkDiaryFormProps> = ({ entry, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const existingImages = entry?.diario_imagens?.map(img => img.url_imagem) || (entry?.image_url ? entry.image_url.split(',') : []);
  const [imageUrls, setImageUrls] = useState<string[]>(existingImages);
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedProjectId } = useProject();

  const form = useForm<WorkDiaryFormData>({
    resolver: zodResolver(workDiarySchema),
    defaultValues: {
      date: entry?.date || format(new Date(), 'yyyy-MM-dd'),
      description: entry?.description || '',
      responsible: entry?.responsible || '',
      weather: entry?.weather as 'sunny' | 'cloudy' | 'rainy' | 'partly_cloudy' || 'sunny',
    },
  });

  const onSubmit = async (data: WorkDiaryFormData) => {
    if (!user || !selectedProjectId) {
      toast({
        title: 'Erro',
        description: !selectedProjectId ? 'Selecione uma obra primeiro.' : 'Você precisa estar logado.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const entryData = {
        date: data.date,
        description: data.description,
        responsible: data.responsible,
        weather: data.weather,
        user_id: user.id,
        project_id: selectedProjectId,
      };

      let currentEntryId = entry?.id;

      if (entry) {
        const { error } = await supabase.from('work_diary').update(entryData).eq('id', entry.id);
        if (error) throw error;
        toast({ title: 'Entrada atualizada', description: 'A entrada do diário foi atualizada com sucesso.' });
      } else {
        const { data: insertedData, error } = await supabase.from('work_diary').insert(entryData).select().single();
        if (error) throw error;
        currentEntryId = insertedData.id;
        toast({ title: 'Entrada registrada', description: 'A nova entrada do diário foi registrada com sucesso.' });
      }

      // Handle relational images
      if (currentEntryId) {
        // Clear previous images to sync exact forms state (Deleted imgs will be wiped here)
        await supabase.from('diario_imagens').delete().eq('diario_id', currentEntryId);
        
        if (imageUrls.length > 0) {
          const imageInserts = imageUrls.map(url => ({
            diario_id: currentEntryId,
            url_imagem: url
          }));
          const { error: imgError } = await supabase.from('diario_imagens').insert(imageInserts);
          if (imgError) {
             console.error('Falha ao salvar as múltiplas fotos:', imgError);
             throw imgError;
          }
        }
      }

      onClose(true);
    } catch (error: any) {
      toast({ title: 'Erro ao salvar entrada', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="date" render={({ field }) => (
          <FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="responsible" render={({ field }) => (
          <FormItem><FormLabel>Responsável</FormLabel><FormControl><Input placeholder="Nome do responsável" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="weather" render={({ field }) => (
          <FormItem><FormLabel>Clima</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione o clima" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="sunny">☀️ Ensolarado</SelectItem>
                <SelectItem value="partly_cloudy">⛅ Parcialmente Nublado</SelectItem>
                <SelectItem value="cloudy">☁️ Nublado</SelectItem>
                <SelectItem value="rainy">🌧️ Chuvoso</SelectItem>
              </SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Descrição das Atividades</FormLabel><FormControl>
            <Textarea placeholder="Descreva as atividades realizadas no dia..." className="min-h-[100px]" {...field} />
          </FormControl><FormMessage /></FormItem>
        )} />
        <div>
          <FormLabel>Registro Fotográfico (Fotos do Dia)</FormLabel>
          {user && <ImageUpload onUpload={setImageUrls} existingImages={imageUrls} multiple={true} userId={user.id} clearOnSuccess={true} />}
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onClose()}>Cancelar</Button>
          <Button type="submit" disabled={isLoading} className="bg-balix-accent hover:bg-balix-accent/90">
            {isLoading ? 'Salvando...' : entry ? 'Atualizar' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default WorkDiaryForm;
