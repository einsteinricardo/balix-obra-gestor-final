
export type ProgressStage = 'foundation' | 'structure' | 'masonry' | 'roofing' | 'electrical' | 'plumbing' | 'finishing' | 'landscaping' | 'other';

export interface ProgressRecord {
  id: string;
  project_id?: string; // Made optional
  stage_name: string;
  status: string;
  description?: string;
  start_date: string;
  end_date: string;
  execution_percentage: number;
  image_url?: string;
  created_at: string;
  user_id: string; // Added required user_id
}

export interface ProgressFilterOptions {
  stage?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface WorkDiaryEntry {
  id: string;
  project_id?: string;
  date: string;
  description: string;
  responsible: string;
  image_url?: string; // Legacy fallback
  weather?: string;
  created_at: string;
  user_id: string;
  diario_imagens?: { id: string; url_imagem: string }[];
}

export type GanttDependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface GanttDependency {
  id: string;
  atividade_id: string;
  predecessora_id: string;
  tipo: GanttDependencyType;
  lag: number;
}

export interface GanttActivityPersistence {
  id: string;
  orcamento_atividade_id: string;
  data_inicio: string | null;
  data_fim: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  progresso: number;
  dependencies?: string[]; // Legacy
  fullDependencies?: GanttDependency[];
  created_at: string;
  updated_at: string;
}

export interface GanttChartViewTask {
  id: string;
  orcamento_id: string;
  name: string;
  type: 'principal' | 'secundaria';
  start: string;
  end: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed';
  delayed: boolean;
  ordem?: number;
  dependencies?: string[]; // Legacy
  itemNumber: string;
  duration: number;
  fullDependencies?: GanttDependency[];
  is_critical?: boolean;
  float?: number;
  earlyStart?: number;
  earlyFinish?: number;
  lateStart?: number;
  lateFinish?: number;
}
