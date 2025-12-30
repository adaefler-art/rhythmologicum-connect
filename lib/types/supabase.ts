export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assessment_answers: {
        Row: {
          answer_value: number
          assessment_id: string
          created_at: string
          id: string
          question_id: string
        }
        Insert: {
          answer_value: number
          assessment_id: string
          created_at?: string
          id?: string
          question_id: string
        }
        Update: {
          answer_value?: number
          assessment_id?: string
          created_at?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_answers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          completed_at: string | null
          funnel: string
          funnel_id: string | null
          id: string
          patient_id: string
          started_at: string
          status: Database["public"]["Enums"]["assessment_status"]
        }
        Insert: {
          completed_at?: string | null
          funnel: string
          funnel_id?: string | null
          id?: string
          patient_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["assessment_status"]
        }
        Update: {
          completed_at?: string | null
          funnel?: string
          funnel_id?: string | null
          id?: string
          patient_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["assessment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "assessments_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_page_sections: {
        Row: {
          body_markdown: string
          content_page_id: string
          created_at: string
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          body_markdown: string
          content_page_id: string
          created_at?: string
          id?: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          content_page_id?: string
          created_at?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_page_sections_content_page_id_fkey"
            columns: ["content_page_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pages: {
        Row: {
          body_markdown: string
          category: string | null
          created_at: string
          deleted_at: string | null
          excerpt: string | null
          flow_step: string | null
          funnel_id: string | null
          id: string
          layout: string | null
          order_index: number | null
          priority: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body_markdown: string
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          flow_step?: string | null
          funnel_id?: string | null
          id?: string
          layout?: string | null
          order_index?: number | null
          priority?: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          flow_step?: string | null
          funnel_id?: string | null
          id?: string
          layout?: string | null
          order_index?: number | null
          priority?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_pages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_question_rules: {
        Row: {
          created_at: string
          funnel_step_id: string
          id: string
          is_active: boolean
          priority: number
          question_id: string
          rule_payload: Json
          rule_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          funnel_step_id: string
          id?: string
          is_active?: boolean
          priority?: number
          question_id: string
          rule_payload: Json
          rule_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          funnel_step_id?: string
          id?: string
          is_active?: boolean
          priority?: number
          question_id?: string
          rule_payload?: Json
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_question_rules_funnel_step_id_fkey"
            columns: ["funnel_step_id"]
            isOneToOne: false
            referencedRelation: "funnel_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_question_rules_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_step_questions: {
        Row: {
          created_at: string
          funnel_step_id: string
          id: string
          is_required: boolean
          order_index: number
          question_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          funnel_step_id: string
          id?: string
          is_required?: boolean
          order_index: number
          question_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          funnel_step_id?: string
          id?: string
          is_required?: boolean
          order_index?: number
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_step_questions_funnel_step_id_fkey"
            columns: ["funnel_step_id"]
            isOneToOne: false
            referencedRelation: "funnel_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_step_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_steps: {
        Row: {
          content_page_id: string | null
          created_at: string
          description: string | null
          funnel_id: string
          id: string
          order_index: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content_page_id?: string | null
          created_at?: string
          description?: string | null
          funnel_id: string
          id?: string
          order_index: number
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content_page_id?: string | null
          created_at?: string
          description?: string | null
          funnel_id?: string
          id?: string
          order_index?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_steps_content_page_id_fkey"
            columns: ["content_page_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_steps_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          created_at: string
          default_theme: string | null
          description: string | null
          id: string
          is_active: boolean
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_theme?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_theme?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_measures: {
        Row: {
          created_at: string | null
          id: string
          patient_id: string
          report_id: string | null
          risk_level: string
          sleep_score: number | null
          stress_score: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          patient_id: string
          report_id?: string | null
          risk_level?: string
          sleep_score?: number | null
          stress_score?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          patient_id?: string
          report_id?: string | null
          risk_level?: string
          sleep_score?: number | null
          stress_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_patient_measures_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_patient_measures_report"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_profiles: {
        Row: {
          birth_year: number | null
          created_at: string
          full_name: string | null
          id: string
          sex: string | null
          user_id: string
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          full_name?: string | null
          id?: string
          sex?: string | null
          user_id: string
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          full_name?: string | null
          id?: string
          sex?: string | null
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          help_text: string | null
          id: string
          key: string
          label: string
          max_value: number | null
          min_value: number | null
          question_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          help_text?: string | null
          id?: string
          key: string
          label: string
          max_value?: number | null
          min_value?: number | null
          question_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          help_text?: string | null
          id?: string
          key?: string
          label?: string
          max_value?: number | null
          min_value?: number | null
          question_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          assessment_id: string
          created_at: string | null
          id: string
          report_text_short: string | null
          risk_level: string | null
          score_numeric: number | null
          sleep_score: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          id?: string
          report_text_short?: string | null
          risk_level?: string | null
          score_numeric?: number | null
          sleep_score?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          id?: string
          report_text_short?: string | null
          risk_level?: string | null
          score_numeric?: number | null
          sleep_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      rls_test_results: {
        Row: {
          actual_result: string | null
          expected_result: string
          id: string
          notes: string | null
          passed: boolean | null
          test_name: string
          test_user: string
          tested_at: string | null
        }
        Insert: {
          actual_result?: string | null
          expected_result: string
          id?: string
          notes?: string | null
          passed?: boolean | null
          test_name: string
          test_user: string
          tested_at?: string | null
        }
        Update: {
          actual_result?: string | null
          expected_result?: string
          id?: string
          notes?: string | null
          passed?: boolean | null
          test_name?: string
          test_user?: string
          tested_at?: string | null
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          consent_version: string
          consented_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_version: string
          consented_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_version?: string
          consented_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_patient_profile_id: { Args: never; Returns: string }
      has_role: { Args: { check_role: string }; Returns: boolean }
      is_clinician: { Args: never; Returns: boolean }
      log_rls_violation: {
        Args: { attempted_id?: string; operation: string; table_name: string }
        Returns: undefined
      }
      set_user_role: {
        Args: { user_email: string; user_role: string }
        Returns: undefined
      }
    }
    Enums: {
      assessment_status: "in_progress" | "completed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      assessment_status: ["in_progress", "completed"],
    },
  },
} as const

