export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cash_flow_entries: {
        Row: {
          amount: number
          created_at: string
          description_category: string
          id: string
          item_description: string
          item_number: number
          location: string
          movement_type: string
          payment_method: string
          project_id: string
          transaction_date: string
          updated_at: string
          user_id: string
          week_end_date: string
          week_number: number
          week_start_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          description_category: string
          id?: string
          item_description: string
          item_number: number
          location: string
          movement_type: string
          payment_method: string
          project_id: string
          transaction_date: string
          updated_at?: string
          user_id: string
          week_end_date: string
          week_number: number
          week_start_date: string
        }
        Update: {
          amount?: number
          created_at?: string
          description_category?: string
          id?: string
          item_description?: string
          item_number?: number
          location?: string
          movement_type?: string
          payment_method?: string
          project_id?: string
          transaction_date?: string
          updated_at?: string
          user_id?: string
          week_end_date?: string
          week_number?: number
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cronograma_execucoes: {
        Row: {
          atividade_id: string
          created_at: string
          data_inicio_semana: string
          id: string
          percentual_executado: number
          valor_executado: number
        }
        Insert: {
          atividade_id: string
          created_at?: string
          data_inicio_semana: string
          id?: string
          percentual_executado?: number
          valor_executado?: number
        }
        Update: {
          atividade_id?: string
          created_at?: string
          data_inicio_semana?: string
          id?: string
          percentual_executado?: number
          valor_executado?: number
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_execucoes_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "orcamento_atividades"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_imagens: {
        Row: {
          created_at: string
          diario_id: string
          id: string
          url_imagem: string
        }
        Insert: {
          created_at?: string
          diario_id: string
          id?: string
          url_imagem: string
        }
        Update: {
          created_at?: string
          diario_id?: string
          id?: string
          url_imagem?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_imagens_diario_id_fkey"
            columns: ["diario_id"]
            isOneToOne: false
            referencedRelation: "work_diary"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_type: string
          file_url: string
          id: string
          project_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_url: string
          id?: string
          project_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_url?: string
          id?: string
          project_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          action: string
          component: string
          created_at: string
          error_message: string
          id: string
          metadata: Json | null
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          component: string
          created_at?: string
          error_message: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          component?: string
          created_at?: string
          error_message?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      financial_records: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          project_id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description: string
          id?: string
          project_id: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          project_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      gantt_tasks: {
        Row: {
          caminho_critico: boolean | null
          created_at: string
          duracao: number
          end_date: string
          id: string
          item_orcamento_id: string | null
          predecessor_id: string | null
          progress: number | null
          project_id: string
          start_date: string
          status: string
          task_name: string
          tipo_dependencia: string | null
          user_id: string
        }
        Insert: {
          caminho_critico?: boolean | null
          created_at?: string
          duracao?: number
          end_date: string
          id?: string
          item_orcamento_id?: string | null
          predecessor_id?: string | null
          progress?: number | null
          project_id: string
          start_date: string
          status: string
          task_name: string
          tipo_dependencia?: string | null
          user_id: string
        }
        Update: {
          caminho_critico?: boolean | null
          created_at?: string
          duracao?: number
          end_date?: string
          id?: string
          item_orcamento_id?: string | null
          predecessor_id?: string | null
          progress?: number | null
          project_id?: string
          start_date?: string
          status?: string
          task_name?: string
          tipo_dependencia?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gantt_tasks_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "gantt_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_users: {
        Row: {
          created_at: string
          id: string
          obra_id: string
          role_id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          obra_id: string
          role_id: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          obra_id?: string
          role_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_users_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "rbac_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_atividades: {
        Row: {
          created_at: string
          custo_mao_obra: number
          custo_material: number
          custo_total: number | null
          descricao: string
          id: string
          orcamento_id: string
          quantidade: number
          unidade: string
        }
        Insert: {
          created_at?: string
          custo_mao_obra?: number
          custo_material?: number
          custo_total?: number | null
          descricao: string
          id?: string
          orcamento_id: string
          quantidade?: number
          unidade: string
        }
        Update: {
          created_at?: string
          custo_mao_obra?: number
          custo_material?: number
          custo_total?: number | null
          descricao?: string
          id?: string
          orcamento_id?: string
          quantidade?: number
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_atividades_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          atividade_principal: string
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          atividade_principal: string
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          atividade_principal?: string
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      project_stages: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          execution_percentage: number | null
          id: string
          image_url: string | null
          project_id: string
          stage_name: string
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          execution_percentage?: number | null
          id?: string
          image_url?: string | null
          project_id: string
          stage_name: string
          start_date: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          execution_percentage?: number | null
          id?: string
          image_url?: string | null
          project_id?: string
          stage_name?: string
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string
          created_at: string
          id: string
          name: string
          status: string | null
          technical_manager: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          name: string
          status?: string | null
          technical_manager: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          name?: string
          status?: string | null
          technical_manager?: string
          user_id?: string
        }
        Relationships: []
      }
      rbac_permissions: {
        Row: {
          acao: string
          descricao: string | null
          id: string
          modulo: string
        }
        Insert: {
          acao: string
          descricao?: string | null
          id?: string
          modulo: string
        }
        Update: {
          acao?: string
          descricao?: string | null
          id?: string
          modulo?: string
        }
        Relationships: []
      }
      rbac_role_permissions: {
        Row: {
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rbac_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "rbac_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbac_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "rbac_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      rbac_roles: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      standard_stages: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_index: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_index: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          background_image_url: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          background_image_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          background_image_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      work_diary: {
        Row: {
          created_at: string
          date: string
          description: string
          id: string
          image_url: string | null
          project_id: string
          responsible: string
          user_id: string
          weather: string | null
        }
        Insert: {
          created_at?: string
          date: string
          description: string
          id?: string
          image_url?: string | null
          project_id: string
          responsible: string
          user_id: string
          weather?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          image_url?: string | null
          project_id?: string
          responsible?: string
          user_id?: string
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_diary_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rbac_permission: {
        Args: {
          _acao: string
          _modulo: string
          _obra_id: string
          _user_id: string
        }
        Returns: boolean
      }
      get_user_obra_permissions: {
        Args: { _obra_id: string; _user_id: string }
        Returns: {
          acao: string
          modulo: string
        }[]
      }
      get_user_obra_role: {
        Args: { _obra_id: string; _user_id: string }
        Returns: {
          role_id: string
          role_nome: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member_of_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_owner: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
