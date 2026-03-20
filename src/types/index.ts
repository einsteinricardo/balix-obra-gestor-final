
export interface User {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export type UserRole = 'admin' | 'engineer' | 'architect' | 'client';

export interface Project {
  id: string;
  name: string;
  address: string;
  technical_manager: string | null;
  status: ProjectStatus;
  created_at: string;
}

export type ProjectStatus = 'in_progress' | 'completed' | 'waiting';

export interface Document {
  id: string;
  project_id: string;
  title: string;
  document_type: DocumentType;
  file_path: string;
  uploaded_at: string;
  uploaded_by: string;
}

export type DocumentType = 'structural' | 'architectural' | 'license' | 'art_rrt';

export interface ProjectStage {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  completion_percentage: number;
  status: StageStatus;
}

export type StageStatus = 'pending' | 'in_progress' | 'completed';

export interface WorkDiaryEntry {
  id: string;
  stage_id: string;
  entry_date: string;
  description: string;
  responsible_id: string;
  photo_path: string | null;
}

export interface FinancialTransaction {
  id: string;
  project_id: string;
  transaction_type: TransactionType;
  category: string;
  description: string | null;
  amount: number;
  transaction_date: string;
  created_by: string;
}

export type TransactionType = 'income' | 'expense';
