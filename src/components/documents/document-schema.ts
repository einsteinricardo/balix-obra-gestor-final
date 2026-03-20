
import * as z from 'zod';

export const documentFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  documentType: z.string().min(1, 'Tipo de documento é obrigatório'),
  file: z
    .instanceof(File)
    .refine((file) => file.size < 10000000, {
      message: 'O arquivo deve ter menos de 10MB',
    })
    .or(z.any()),
  project_id: z.string().optional(),
});

export type DocumentFormValues = z.infer<typeof documentFormSchema>;

export const DOCUMENT_TYPES = [
  { value: 'planta_arquitetonica', label: 'Planta Arquitetônica' },
  { value: 'projeto_estrutural', label: 'Projeto Estrutural' },
  { value: 'projeto_eletrico', label: 'Projeto Elétrico' },
  { value: 'projeto_hidraulico', label: 'Projeto Hidráulico' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'alvara', label: 'Alvará' },
  { value: 'imagem', label: 'Imagem/Foto' },
  { value: 'art', label: 'ART' },
  { value: 'licenca_ambiental', label: 'Licença Ambiental' },
  { value: 'outros', label: 'Outros' },
];
