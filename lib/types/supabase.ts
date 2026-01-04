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
      assessment_events: {
        Row: {
          assessment_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json
        }
        Insert: {
          assessment_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
        }
        Update: {
          assessment_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "assessment_events_assessment_id_fkey"
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
          current_step_id: string | null
          funnel: string
          funnel_id: string | null
          id: string
          patient_id: string
          started_at: string
          state: Database["public"]["Enums"]["assessment_state"] | null
          status: Database["public"]["Enums"]["assessment_status"]
        }
        Insert: {
          completed_at?: string | null
          current_step_id?: string | null
          funnel: string
          funnel_id?: string | null
          id?: string
          patient_id: string
          started_at?: string
          state?: Database["public"]["Enums"]["assessment_state"] | null
          status?: Database["public"]["Enums"]["assessment_status"]
        }
        Update: {
          completed_at?: string | null
          current_step_id?: string | null
          funnel?: string
          funnel_id?: string | null
          id?: string
          patient_id?: string
          started_at?: string
          state?: Database["public"]["Enums"]["assessment_state"] | null
          status?: Database["public"]["Enums"]["assessment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "assessments_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "funnel_steps"
            referencedColumns: ["id"]
          },
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
      audit_log: {
        Row: {
          action: string
          actor_role: Database["public"]["Enums"]["user_role"] | null
          actor_user_id: string | null
          created_at: string
          diff: Json | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          org_id: string | null
          source: string | null
        }
        Insert: {
          action: string
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          actor_user_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          source?: string | null
        }
        Update: {
          action?: string
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          actor_user_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calculated_results: {
        Row: {
          algorithm_version: string
          assessment_id: string
          computed_at: string
          created_at: string
          funnel_version_id: string | null
          id: string
          inputs_hash: string | null
          priority_ranking: Json | null
          risk_models: Json | null
          scores: Json
        }
        Insert: {
          algorithm_version: string
          assessment_id: string
          computed_at?: string
          created_at?: string
          funnel_version_id?: string | null
          id?: string
          inputs_hash?: string | null
          priority_ranking?: Json | null
          risk_models?: Json | null
          scores?: Json
        }
        Update: {
          algorithm_version?: string
          assessment_id?: string
          computed_at?: string
          created_at?: string
          funnel_version_id?: string | null
          id?: string
          inputs_hash?: string | null
          priority_ranking?: Json | null
          risk_models?: Json | null
          scores?: Json
        }
        Relationships: [
          {
            foreignKeyName: "calculated_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calculated_results_funnel_version_id_fkey"
            columns: ["funnel_version_id"]
            isOneToOne: false
            referencedRelation: "funnel_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      clinician_patient_assignments: {
        Row: {
          clinician_user_id: string
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          patient_user_id: string
        }
        Insert: {
          clinician_user_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          patient_user_id: string
        }
        Update: {
          clinician_user_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          patient_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinician_patient_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      documents: {
        Row: {
          assessment_id: string | null
          confidence: Json | null
          confidence_json: Json | null
          confirmed_at: string | null
          confirmed_data: Json | null
          created_at: string
          doc_type: string | null
          extracted_data: Json | null
          extracted_json: Json | null
          extractor_version: string | null
          id: string
          input_hash: string | null
          parsing_status: Database["public"]["Enums"]["parsing_status"]
          storage_path: string
          updated_at: string | null
        }
        Insert: {
          assessment_id?: string | null
          confidence?: Json | null
          confidence_json?: Json | null
          confirmed_at?: string | null
          confirmed_data?: Json | null
          created_at?: string
          doc_type?: string | null
          extracted_data?: Json | null
          extracted_json?: Json | null
          extractor_version?: string | null
          id?: string
          input_hash?: string | null
          parsing_status?: Database["public"]["Enums"]["parsing_status"]
          storage_path: string
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string | null
          confidence?: Json | null
          confidence_json?: Json | null
          confirmed_at?: string | null
          confirmed_data?: Json | null
          created_at?: string
          doc_type?: string | null
          extracted_data?: Json | null
          extracted_json?: Json | null
          extractor_version?: string | null
          id?: string
          input_hash?: string | null
          parsing_status?: Database["public"]["Enums"]["parsing_status"]
          storage_path?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
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
      funnel_versions: {
        Row: {
          algorithm_bundle_version: string
          content_manifest: Json
          created_at: string
          funnel_id: string
          id: string
          is_default: boolean
          prompt_version: string
          questionnaire_config: Json
          rollout_percent: number | null
          updated_at: string | null
          version: string
        }
        Insert: {
          algorithm_bundle_version?: string
          content_manifest?: Json
          created_at?: string
          funnel_id: string
          id?: string
          is_default?: boolean
          prompt_version?: string
          questionnaire_config?: Json
          rollout_percent?: number | null
          updated_at?: string | null
          version: string
        }
        Update: {
          algorithm_bundle_version?: string
          content_manifest?: Json
          created_at?: string
          funnel_id?: string
          id?: string
          is_default?: boolean
          prompt_version?: string
          questionnaire_config?: Json
          rollout_percent?: number | null
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_versions_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels_catalog"
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
      funnels_catalog: {
        Row: {
          created_at: string
          default_version_id: string | null
          description: string | null
          est_duration_min: number | null
          id: string
          is_active: boolean
          org_id: string | null
          outcomes: Json | null
          pillar_id: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          default_version_id?: string | null
          description?: string | null
          est_duration_min?: number | null
          id?: string
          is_active?: boolean
          org_id?: string | null
          outcomes?: Json | null
          pillar_id?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          default_version_id?: string | null
          description?: string | null
          est_duration_min?: number | null
          id?: string
          is_active?: boolean
          org_id?: string | null
          outcomes?: Json | null
          pillar_id?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnels_catalog_default_version_id_fkey"
            columns: ["default_version_id"]
            isOneToOne: false
            referencedRelation: "funnel_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_validation_results: {
        Row: {
          created_at: string
          critical_flags_count: number
          engine_version: string
          flags_raised_count: number
          id: string
          info_flags_count: number
          job_id: string
          overall_passed: boolean
          overall_status: Database["public"]["Enums"]["validation_status"]
          rules_evaluated_count: number
          ruleset_hash: string
          sections_id: string | null
          updated_at: string
          validated_at: string
          validation_data: Json
          validation_time_ms: number
          validation_version: string
          warning_flags_count: number
        }
        Insert: {
          created_at?: string
          critical_flags_count?: number
          engine_version: string
          flags_raised_count?: number
          id?: string
          info_flags_count?: number
          job_id: string
          overall_passed: boolean
          overall_status: Database["public"]["Enums"]["validation_status"]
          rules_evaluated_count?: number
          ruleset_hash: string
          sections_id?: string | null
          updated_at?: string
          validated_at: string
          validation_data: Json
          validation_time_ms?: number
          validation_version?: string
          warning_flags_count?: number
        }
        Update: {
          created_at?: string
          critical_flags_count?: number
          engine_version?: string
          flags_raised_count?: number
          id?: string
          info_flags_count?: number
          job_id?: string
          overall_passed?: boolean
          overall_status?: Database["public"]["Enums"]["validation_status"]
          rules_evaluated_count?: number
          ruleset_hash?: string
          sections_id?: string | null
          updated_at?: string
          validated_at?: string
          validation_data?: Json
          validation_time_ms?: number
          validation_version?: string
          warning_flags_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          id: string
          payload: Json
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template_key: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          payload?: Json
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_key: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          payload?: Json
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_key?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      patient_funnels: {
        Row: {
          active_version_id: string | null
          completed_at: string | null
          created_at: string
          funnel_id: string
          id: string
          patient_id: string
          started_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          active_version_id?: string | null
          completed_at?: string | null
          created_at?: string
          funnel_id: string
          id?: string
          patient_id: string
          started_at?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          active_version_id?: string | null
          completed_at?: string | null
          created_at?: string
          funnel_id?: string
          id?: string
          patient_id?: string
          started_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_funnels_active_version_id_fkey"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "funnel_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_funnels_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_funnels_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      pillars: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      priority_rankings: {
        Row: {
          algorithm_version: string
          created_at: string
          id: string
          job_id: string
          program_tier: string | null
          ranked_at: string
          ranking_data: Json
          ranking_version: string
          registry_version: string
          risk_bundle_id: string
          updated_at: string
        }
        Insert: {
          algorithm_version: string
          created_at?: string
          id?: string
          job_id: string
          program_tier?: string | null
          ranked_at: string
          ranking_data: Json
          ranking_version?: string
          registry_version: string
          risk_bundle_id: string
          updated_at?: string
        }
        Update: {
          algorithm_version?: string
          created_at?: string
          id?: string
          job_id?: string
          program_tier?: string | null
          ranked_at?: string
          ranking_data?: Json
          ranking_version?: string
          registry_version?: string
          risk_bundle_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "priority_rankings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "processing_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "priority_rankings_risk_bundle_id_fkey"
            columns: ["risk_bundle_id"]
            isOneToOne: false
            referencedRelation: "risk_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_jobs: {
        Row: {
          assessment_id: string
          attempt: number
          completed_at: string | null
          correlation_id: string
          created_at: string
          errors: Json | null
          id: string
          max_attempts: number
          schema_version: string
          stage: Database["public"]["Enums"]["processing_stage"]
          started_at: string | null
          status: Database["public"]["Enums"]["processing_status"]
          updated_at: string
        }
        Insert: {
          assessment_id: string
          attempt?: number
          completed_at?: string | null
          correlation_id: string
          created_at?: string
          errors?: Json | null
          id?: string
          max_attempts?: number
          schema_version?: string
          stage?: Database["public"]["Enums"]["processing_stage"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["processing_status"]
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          attempt?: number
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          errors?: Json | null
          id?: string
          max_attempts?: number
          schema_version?: string
          stage?: Database["public"]["Enums"]["processing_stage"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["processing_status"]
          updated_at?: string
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
      report_sections: {
        Row: {
          content_version: number
          created_at: string
          fallback_count: number | null
          generated_at: string
          generation_time_ms: number | null
          id: string
          job_id: string
          llm_call_count: number | null
          program_tier: string | null
          prompt_bundle_version: string | null
          ranking_id: string | null
          risk_bundle_id: string
          sections_data: Json
          sections_version: string
          updated_at: string
        }
        Insert: {
          content_version?: number
          created_at?: string
          fallback_count?: number | null
          generated_at: string
          generation_time_ms?: number | null
          id?: string
          job_id: string
          llm_call_count?: number | null
          program_tier?: string | null
          prompt_bundle_version?: string | null
          ranking_id?: string | null
          risk_bundle_id: string
          sections_data: Json
          sections_version?: string
          updated_at?: string
        }
        Update: {
          content_version?: number
          created_at?: string
          fallback_count?: number | null
          generated_at?: string
          generation_time_ms?: number | null
          id?: string
          job_id?: string
          llm_call_count?: number | null
          program_tier?: string | null
          prompt_bundle_version?: string | null
          ranking_id?: string | null
          risk_bundle_id?: string
          sections_data?: Json
          sections_version?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_sections_legacy: {
        Row: {
          citations_meta: Json | null
          content: string
          created_at: string
          id: string
          prompt_version: string | null
          report_id: string
          section_key: string
        }
        Insert: {
          citations_meta?: Json | null
          content: string
          created_at?: string
          id?: string
          prompt_version?: string | null
          report_id: string
          section_key: string
        }
        Update: {
          citations_meta?: Json | null
          content?: string
          created_at?: string
          id?: string
          prompt_version?: string | null
          report_id?: string
          section_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          algorithm_version: string | null
          assessment_id: string
          citations_meta: Json | null
          created_at: string | null
          funnel_version_id: string | null
          html_path: string | null
          id: string
          pdf_path: string | null
          prompt_version: string
          report_text_short: string | null
          report_version: string
          risk_level: string | null
          safety_findings: Json | null
          safety_score: number | null
          score_numeric: number | null
          sleep_score: number | null
          status: Database["public"]["Enums"]["report_status"] | null
          updated_at: string | null
        }
        Insert: {
          algorithm_version?: string | null
          assessment_id: string
          citations_meta?: Json | null
          created_at?: string | null
          funnel_version_id?: string | null
          html_path?: string | null
          id?: string
          pdf_path?: string | null
          prompt_version?: string
          report_text_short?: string | null
          report_version?: string
          risk_level?: string | null
          safety_findings?: Json | null
          safety_score?: number | null
          score_numeric?: number | null
          sleep_score?: number | null
          status?: Database["public"]["Enums"]["report_status"] | null
          updated_at?: string | null
        }
        Update: {
          algorithm_version?: string | null
          assessment_id?: string
          citations_meta?: Json | null
          created_at?: string | null
          funnel_version_id?: string | null
          html_path?: string | null
          id?: string
          pdf_path?: string | null
          prompt_version?: string
          report_text_short?: string | null
          report_version?: string
          risk_level?: string | null
          safety_findings?: Json | null
          safety_score?: number | null
          score_numeric?: number | null
          sleep_score?: number | null
          status?: Database["public"]["Enums"]["report_status"] | null
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
          {
            foreignKeyName: "reports_funnel_version_id_fkey"
            columns: ["funnel_version_id"]
            isOneToOne: false
            referencedRelation: "funnel_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_bundles: {
        Row: {
          algorithm_version: string
          assessment_id: string
          bundle_data: Json
          calculated_at: string
          created_at: string
          funnel_version: string | null
          id: string
          job_id: string
          risk_bundle_version: string
          updated_at: string
        }
        Insert: {
          algorithm_version: string
          assessment_id: string
          bundle_data: Json
          calculated_at: string
          created_at?: string
          funnel_version?: string | null
          id?: string
          job_id: string
          risk_bundle_version?: string
          updated_at?: string
        }
        Update: {
          algorithm_version?: string
          assessment_id?: string
          bundle_data?: Json
          calculated_at?: string
          created_at?: string
          funnel_version?: string | null
          id?: string
          job_id?: string
          risk_bundle_version?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_bundles_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_bundles_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "processing_jobs"
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
      safety_check_results: {
        Row: {
          check_data: Json
          completion_tokens: number | null
          created_at: string
          critical_findings_count: number
          evaluated_at: string
          evaluation_key_hash: string | null
          evaluation_time_ms: number
          fallback_used: boolean
          findings_count: number
          high_findings_count: number
          id: string
          job_id: string
          llm_call_count: number
          low_findings_count: number
          medium_findings_count: number
          model_max_tokens: number | null
          model_name: string | null
          model_provider: string
          model_temperature: number | null
          overall_action: Database["public"]["Enums"]["safety_action"]
          overall_severity: string
          prompt_tokens: number | null
          prompt_version: string
          safety_score: number
          safety_version: string
          sections_id: string
          total_tokens: number | null
          updated_at: string
        }
        Insert: {
          check_data: Json
          completion_tokens?: number | null
          created_at?: string
          critical_findings_count?: number
          evaluated_at: string
          evaluation_key_hash?: string | null
          evaluation_time_ms?: number
          fallback_used?: boolean
          findings_count?: number
          high_findings_count?: number
          id?: string
          job_id: string
          llm_call_count?: number
          low_findings_count?: number
          medium_findings_count?: number
          model_max_tokens?: number | null
          model_name?: string | null
          model_provider: string
          model_temperature?: number | null
          overall_action: Database["public"]["Enums"]["safety_action"]
          overall_severity: string
          prompt_tokens?: number | null
          prompt_version: string
          safety_score: number
          safety_version?: string
          sections_id: string
          total_tokens?: number | null
          updated_at?: string
        }
        Update: {
          check_data?: Json
          completion_tokens?: number | null
          created_at?: string
          critical_findings_count?: number
          evaluated_at?: string
          evaluation_key_hash?: string | null
          evaluation_time_ms?: number
          fallback_used?: boolean
          findings_count?: number
          high_findings_count?: number
          id?: string
          job_id?: string
          llm_call_count?: number
          low_findings_count?: number
          medium_findings_count?: number
          model_max_tokens?: number | null
          model_name?: string | null
          model_provider?: string
          model_temperature?: number | null
          overall_action?: Database["public"]["Enums"]["safety_action"]
          overall_severity?: string
          prompt_tokens?: number | null
          prompt_version?: string
          safety_score?: number
          safety_version?: string
          sections_id?: string
          total_tokens?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assessment_id: string | null
          assigned_to_role: Database["public"]["Enums"]["user_role"] | null
          created_at: string
          created_by_role: Database["public"]["Enums"]["user_role"] | null
          due_at: string | null
          id: string
          patient_id: string | null
          payload: Json
          status: Database["public"]["Enums"]["task_status"]
          task_type: string
          updated_at: string | null
        }
        Insert: {
          assessment_id?: string | null
          assigned_to_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          created_by_role?: Database["public"]["Enums"]["user_role"] | null
          due_at?: string | null
          id?: string
          patient_id?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["task_status"]
          task_type: string
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string | null
          assigned_to_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          created_by_role?: Database["public"]["Enums"]["user_role"] | null
          due_at?: string | null
          id?: string
          patient_id?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_org_membership: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_org_membership_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_inputs_hash: { Args: { p_inputs: Json }; Returns: string }
      compute_safety_evaluation_key_hash: {
        Args: { p_prompt_version: string; p_sections_id: string }
        Returns: string
      }
      current_user_role: {
        Args: { org_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      diagnostics_pillars_sot: { Args: never; Returns: Json }
      generate_report_version: {
        Args: {
          p_algorithm_version: string
          p_funnel_version: string
          p_inputs_hash_prefix: string
          p_prompt_version: string
        }
        Returns: string
      }
      get_my_patient_profile_id: { Args: never; Returns: string }
      get_user_org_ids: { Args: never; Returns: string[] }
      has_any_role: {
        Args: { check_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      has_role: { Args: { check_role: string }; Returns: boolean }
      is_assigned_to_patient: {
        Args: { patient_uid: string }
        Returns: boolean
      }
      is_clinician: { Args: never; Returns: boolean }
      is_member_of_org: { Args: { org_id: string }; Returns: boolean }
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
      assessment_state: "draft" | "in_progress" | "completed" | "archived"
      assessment_status: "in_progress" | "completed"
      notification_status: "scheduled" | "sent" | "failed" | "cancelled"
      parsing_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "partial"
      processing_stage:
        | "pending"
        | "risk"
        | "ranking"
        | "content"
        | "validation"
        | "review"
        | "pdf"
        | "delivery"
        | "completed"
        | "failed"
      processing_status: "queued" | "in_progress" | "completed" | "failed"
      report_status: "pending" | "generating" | "completed" | "failed"
      safety_action: "PASS" | "FLAG" | "BLOCK" | "UNKNOWN"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      user_role: "patient" | "clinician" | "nurse" | "admin"
      validation_status: "pass" | "flag" | "fail"
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
      assessment_state: ["draft", "in_progress", "completed", "archived"],
      assessment_status: ["in_progress", "completed"],
      notification_status: ["scheduled", "sent", "failed", "cancelled"],
      parsing_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "partial",
      ],
      processing_stage: [
        "pending",
        "risk",
        "ranking",
        "content",
        "validation",
        "review",
        "pdf",
        "delivery",
        "completed",
        "failed",
      ],
      processing_status: ["queued", "in_progress", "completed", "failed"],
      report_status: ["pending", "generating", "completed", "failed"],
      safety_action: ["PASS", "FLAG", "BLOCK", "UNKNOWN"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      user_role: ["patient", "clinician", "nurse", "admin"],
      validation_status: ["pass", "flag", "fail"],
    },
  },
} as const

