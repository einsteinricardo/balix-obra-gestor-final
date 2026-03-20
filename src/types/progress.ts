
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

export interface GanttTask {
  id: string;
  project_id?: string; // Made optional
  task_name: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  created_at: string;
  user_id: string; // Added required user_id
}
