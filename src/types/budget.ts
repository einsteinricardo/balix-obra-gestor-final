
export interface Orcamento {
  id: string;
  user_id: string;
  project_id?: string;
  atividade_principal: string;
  created_at: string;
}

export interface OrcamentoAtividade {
  id: string;
  orcamento_id: string;
  descricao: string;
  unidade: 'm' | 'm²' | 'm³' | 'vb';
  quantidade: number;
  custo_material: number;
  custo_mao_obra: number;
  custo_total: number;
  created_at: string;
}

export interface CronogramaExecucao {
  id: string;
  atividade_id: string;
  data_inicio_semana: string;
  percentual_executado: number;
  valor_executado: number;
  created_at: string;
}

export interface OrcamentoWithAtividades extends Orcamento {
  atividades: OrcamentoAtividade[];
}

export interface AtividadeWithExecucoes extends OrcamentoAtividade {
  execucoes: CronogramaExecucao[];
}

export const ATIVIDADES_PRINCIPAIS = [
  'Serviços preliminares',
  'Movimentação de terra',
  'Estrutura',
  'Paredes e Painéis',
  'Revestimentos',
  'Pisos',
  'Esquadrias e ferragens',
  'Instalações hidrossanitárias',
  'Louças e metais',
  'Soleiras, peitoris e bancadas',
  'Instalações elétricas',
  'Impermeabilização',
  'Cobertura',
  'Pintura'
] as const;

export type AtividadePrincipal = typeof ATIVIDADES_PRINCIPAIS[number];
