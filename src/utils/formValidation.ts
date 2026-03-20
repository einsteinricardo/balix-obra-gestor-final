
import * as z from 'zod';

// Common validation patterns
export const PATTERNS = {
  // YYYY-MM-DD format
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  // Brazilian CPF format (XXX.XXX.XXX-XX)
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  // Brazilian phone number format ((XX) XXXXX-XXXX)
  PHONE: /^\(\d{2}\) \d{5}-\d{4}$/,
  // Email format
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// Common file validation logic
export const fileValidation = (
  maxSize: number = 5 * 1024 * 1024, // 5MB default
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) => {
  return z.instanceof(File)
    .refine((file) => file.size <= maxSize, `O arquivo deve ter menos de ${Math.floor(maxSize / (1024 * 1024))}MB`)
    .refine((file) => allowedTypes.includes(file.type), `Tipo de arquivo não permitido. Apenas ${allowedTypes.map(type => type.split('/')[1]).join(', ')} são aceitos.`);
};

// Document validation schema
export const documentValidationSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  documentType: z.string().min(1, 'Selecione um tipo de documento'),
  file: z.instanceof(File)
    .refine((file) => file.size < 10_000_000, {
      message: 'Arquivo deve ter menos de 10MB',
    })
    .optional()
    .or(z.string().min(1))
    .or(z.literal(undefined)),
  project_id: z.string().min(1, 'ID do projeto é obrigatório'),
});

// Financial record validation schema
export const financialValidationSchema = z.object({
  type: z.string().min(1, 'Tipo é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  description: z.string().min(3, 'Descrição é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória')
    .refine((date) => PATTERNS.DATE.test(date), 'Data em formato inválido'),
  project_id: z.string().min(1, 'ID do projeto é obrigatório'),
});

// Progress tracking validation schema
export const progressValidationSchema = z.object({
  stage: z.string().min(1, 'Etapa é obrigatória'),
  description: z.string().min(3, 'Descrição é obrigatória'),
  execution_percentage: z.coerce.number()
    .min(0, 'Progresso não pode ser negativo')
    .max(100, 'Progresso não pode exceder 100%'),
  date: z.string().min(1, 'Data é obrigatória')
    .refine((date) => PATTERNS.DATE.test(date), 'Data em formato inválido'),
  project_id: z.string().min(1, 'ID do projeto é obrigatório'),
});

// Work diary validation schema
export const workDiaryValidationSchema = z.object({
  description: z.string().min(3, 'Descrição é obrigatória'),
  date: z.date({
    required_error: 'Data é obrigatória',
    invalid_type_error: 'Formato de data inválido',
  }).max(new Date(), 'Data não pode ser futura'),
  weather: z.string().min(1, 'Condição climática é obrigatória'),
  progress_id: z.string().min(1, 'ID do progresso é obrigatório'),
  responsible_id: z.string().min(1, 'Responsável é obrigatório'),
});
