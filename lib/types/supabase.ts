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
    PostgrestVersion: "14.1"
  }
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
          answer_data: Json | null
          answer_value: number
          assessment_id: string
          created_at: string
          id: string
          question_id: string
        }
        Insert: {
          answer_data?: Json | null
          answer_value: number
          assessment_id: string
          created_at?: string
          id?: string
          question_id: string
        }
        Update: {
          answer_data?: Json | null
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
          missing_data_fields: Json | null
          patient_id: string
          started_at: string
          state: Database["public"]["Enums"]["assessment_state"] | null
          status: Database["public"]["Enums"]["assessment_status"]
          workup_status: Database["public"]["Enums"]["workup_status"] | null
        }
        Insert: {
          completed_at?: string | null
          current_step_id?: string | null
          funnel: string
          funnel_id?: string | null
          id?: string
          missing_data_fields?: Json | null
          patient_id: string
          started_at?: string
          state?: Database["public"]["Enums"]["assessment_state"] | null
          status?: Database["public"]["Enums"]["assessment_status"]
          workup_status?: Database["public"]["Enums"]["workup_status"] | null
        }
        Update: {
          completed_at?: string | null
          current_step_id?: string | null
          funnel?: string
          funnel_id?: string | null
          id?: string
          missing_data_fields?: Json | null
          patient_id?: string
          started_at?: string
          state?: Database["public"]["Enums"]["assessment_state"] | null
          status?: Database["public"]["Enums"]["assessment_status"]
          workup_status?: Database["public"]["Enums"]["workup_status"] | null
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
            foreignKeyName: "audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
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
            foreignKeyName: "clinician_patient_assignments_clinician_fkey"
            columns: ["clinician_user_id"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "clinician_patient_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "clinician_patient_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_patient_assignments_patient_fkey"
            columns: ["patient_user_id"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
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
      design_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          organization_id: string | null
          token_category: string
          token_key: string
          token_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          token_category: string
          token_key: string
          token_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          token_category?: string
          token_key?: string
          token_value?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "design_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      device_shipments: {
        Row: {
          carrier: string | null
          created_at: string
          created_by_user_id: string | null
          delivered_at: string | null
          device_serial_number: string | null
          device_type: string
          expected_delivery_at: string | null
          id: string
          last_reminder_at: string | null
          metadata: Json
          notes: string | null
          ordered_at: string
          organization_id: string
          patient_id: string
          reminder_count: number
          reminder_sent_at: string | null
          return_carrier: string | null
          return_reason: string | null
          return_requested_at: string | null
          return_tracking_number: string | null
          returned_at: string | null
          shipped_at: string | null
          shipping_address: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          task_id: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          created_by_user_id?: string | null
          delivered_at?: string | null
          device_serial_number?: string | null
          device_type: string
          expected_delivery_at?: string | null
          id?: string
          last_reminder_at?: string | null
          metadata?: Json
          notes?: string | null
          ordered_at?: string
          organization_id: string
          patient_id: string
          reminder_count?: number
          reminder_sent_at?: string | null
          return_carrier?: string | null
          return_reason?: string | null
          return_requested_at?: string | null
          return_tracking_number?: string | null
          returned_at?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          task_id?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          created_by_user_id?: string | null
          delivered_at?: string | null
          device_serial_number?: string | null
          device_type?: string
          expected_delivery_at?: string | null
          id?: string
          last_reminder_at?: string | null
          metadata?: Json
          notes?: string | null
          ordered_at?: string
          organization_id?: string
          patient_id?: string
          reminder_count?: number
          reminder_sent_at?: string | null
          return_carrier?: string | null
          return_reason?: string | null
          return_requested_at?: string | null
          return_tracking_number?: string | null
          returned_at?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          task_id?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_shipments_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "device_shipments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_shipments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_shipments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
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
      idempotency_keys: {
        Row: {
          created_at: string
          endpoint_path: string
          expires_at: string
          http_method: string
          id: string
          idempotency_key: string
          request_hash: string | null
          response_body: Json
          response_status: number
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint_path: string
          expires_at?: string
          http_method?: string
          id?: string
          idempotency_key: string
          request_hash?: string | null
          response_body: Json
          response_status: number
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint_path?: string
          expires_at?: string
          http_method?: string
          id?: string
          idempotency_key?: string
          request_hash?: string | null
          response_body?: Json
          response_status?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
        ]
      }
      kpi_thresholds: {
        Row: {
          created_at: string
          created_by: string | null
          critical_threshold: number | null
          description: string | null
          evaluation_period_days: number | null
          id: string
          is_active: boolean
          kpi_key: string
          metric_type: string
          name: string
          notify_on_breach: boolean
          target_threshold: number | null
          unit: string | null
          updated_at: string
          updated_by: string | null
          warning_threshold: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          critical_threshold?: number | null
          description?: string | null
          evaluation_period_days?: number | null
          id?: string
          is_active?: boolean
          kpi_key: string
          metric_type: string
          name: string
          notify_on_breach?: boolean
          target_threshold?: number | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
          warning_threshold?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          critical_threshold?: number | null
          description?: string | null
          evaluation_period_days?: number | null
          id?: string
          is_active?: boolean
          kpi_key?: string
          metric_type?: string
          name?: string
          notify_on_breach?: boolean
          target_threshold?: number | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
          warning_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_thresholds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "kpi_thresholds_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
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
      navigation_item_configs: {
        Row: {
          created_at: string
          custom_icon: string | null
          custom_label: string | null
          id: string
          is_enabled: boolean
          navigation_item_id: string
          order_index: number
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_icon?: string | null
          custom_label?: string | null
          id?: string
          is_enabled?: boolean
          navigation_item_id: string
          order_index: number
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_icon?: string | null
          custom_label?: string | null
          id?: string
          is_enabled?: boolean
          navigation_item_id?: string
          order_index?: number
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_item_configs_navigation_item_id_fkey"
            columns: ["navigation_item_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_items: {
        Row: {
          created_at: string
          default_icon: string | null
          default_label: string
          default_order: number
          description: string | null
          id: string
          is_system: boolean
          route: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_icon?: string | null
          default_label: string
          default_order: number
          description?: string | null
          id?: string
          is_system?: boolean
          route: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_icon?: string | null
          default_label?: string
          default_order?: number
          description?: string | null
          id?: string
          is_system?: boolean
          route?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string
          channel: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          subject_template: string | null
          template_key: string
          updated_at: string
          updated_by: string | null
          variables: Json | null
        }
        Insert: {
          body_template: string
          channel: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          subject_template?: string | null
          template_key: string
          updated_at?: string
          updated_by?: string | null
          variables?: Json | null
        }
        Update: {
          body_template?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          subject_template?: string | null
          template_key?: string
          updated_at?: string
          updated_by?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          assessment_id: string | null
          channel: string
          consent_verified: boolean | null
          consent_version: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          expires_at: string | null
          failed_at: string | null
          follow_up_at: string | null
          follow_up_completed: boolean | null
          id: string
          job_id: string | null
          message: string | null
          metadata: Json | null
          notification_type: string | null
          payload: Json
          priority: string | null
          read_at: string | null
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          subject: string | null
          template_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id?: string | null
          channel: string
          consent_verified?: boolean | null
          consent_version?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          failed_at?: string | null
          follow_up_at?: string | null
          follow_up_completed?: boolean | null
          id?: string
          job_id?: string | null
          message?: string | null
          metadata?: Json | null
          notification_type?: string | null
          payload?: Json
          priority?: string | null
          read_at?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject?: string | null
          template_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string | null
          channel?: string
          consent_verified?: boolean | null
          consent_version?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          failed_at?: string | null
          follow_up_at?: string | null
          follow_up_completed?: boolean | null
          id?: string
          job_id?: string | null
          message?: string | null
          metadata?: Json | null
          notification_type?: string | null
          payload?: Json
          priority?: string | null
          read_at?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject?: string | null
          template_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
        ]
      }
      operational_settings_audit: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          operation: string
          record_id: string
          table_name: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          record_id: string
          table_name: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_settings_audit_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
        ]
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
          onboarding_status: Database["public"]["Enums"]["onboarding_status_enum"]
          sex: string | null
          user_id: string
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status_enum"]
          sex?: string | null
          user_id: string
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status_enum"]
          sex?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_state: {
        Row: {
          activity_recent: Json
          assessment_completed_at: string | null
          assessment_last_assessment_id: string | null
          assessment_progress: number
          assessment_status: string
          created_at: string
          dialog_last_context: string | null
          dialog_last_message_at: string | null
          dialog_message_count: number
          id: string
          metrics_health_score_current: number | null
          metrics_health_score_delta: number | null
          metrics_key_metrics: Json
          patient_state_version: string
          results_last_generated_at: string | null
          results_recommended_actions: Json
          results_summary_cards: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_recent?: Json
          assessment_completed_at?: string | null
          assessment_last_assessment_id?: string | null
          assessment_progress?: number
          assessment_status?: string
          created_at?: string
          dialog_last_context?: string | null
          dialog_last_message_at?: string | null
          dialog_message_count?: number
          id?: string
          metrics_health_score_current?: number | null
          metrics_health_score_delta?: number | null
          metrics_key_metrics?: Json
          patient_state_version?: string
          results_last_generated_at?: string | null
          results_recommended_actions?: Json
          results_summary_cards?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_recent?: Json
          assessment_completed_at?: string | null
          assessment_last_assessment_id?: string | null
          assessment_progress?: number
          assessment_status?: string
          created_at?: string
          dialog_last_context?: string | null
          dialog_last_message_at?: string | null
          dialog_message_count?: number
          id?: string
          metrics_health_score_current?: number | null
          metrics_health_score_delta?: number | null
          metrics_key_metrics?: Json
          patient_state_version?: string
          results_last_generated_at?: string | null
          results_recommended_actions?: Json
          results_summary_cards?: Json
          updated_at?: string
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
      pilot_flow_events: {
        Row: {
          actor_role: Database["public"]["Enums"]["user_role"] | null
          correlation_id: string
          created_at: string
          entity_id: string
          entity_type: string
          event_type: Database["public"]["Enums"]["pilot_event_type"]
          from_state: string | null
          id: string
          org_id: string | null
          patient_id: string | null
          payload_hash: string | null
          payload_json: Json | null
          to_state: string | null
        }
        Insert: {
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          correlation_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: Database["public"]["Enums"]["pilot_event_type"]
          from_state?: string | null
          id?: string
          org_id?: string | null
          patient_id?: string | null
          payload_hash?: string | null
          payload_json?: Json | null
          to_state?: string | null
        }
        Update: {
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          correlation_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: Database["public"]["Enums"]["pilot_event_type"]
          from_state?: string | null
          id?: string
          org_id?: string | null
          patient_id?: string | null
          payload_hash?: string | null
          payload_json?: Json | null
          to_state?: string | null
        }
        Relationships: []
      }
      pre_screening_calls: {
        Row: {
          call_date: string
          clinician_id: string
          created_at: string
          general_notes: string | null
          id: string
          is_suitable: boolean
          organization_id: string | null
          patient_id: string
          recommended_tier: string | null
          red_flags: Json
          red_flags_notes: string | null
          suitability_notes: string | null
          tier_notes: string | null
          updated_at: string
        }
        Insert: {
          call_date?: string
          clinician_id: string
          created_at?: string
          general_notes?: string | null
          id?: string
          is_suitable: boolean
          organization_id?: string | null
          patient_id: string
          recommended_tier?: string | null
          red_flags?: Json
          red_flags_notes?: string | null
          suitability_notes?: string | null
          tier_notes?: string | null
          updated_at?: string
        }
        Update: {
          call_date?: string
          clinician_id?: string
          created_at?: string
          general_notes?: string | null
          id?: string
          is_suitable?: boolean
          organization_id?: string | null
          patient_id?: string
          recommended_tier?: string | null
          red_flags?: Json
          red_flags_notes?: string | null
          suitability_notes?: string | null
          tier_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_screening_calls_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pre_screening_calls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_screening_calls_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          delivery_attempt: number
          delivery_metadata: Json | null
          delivery_status: string
          delivery_timestamp: string | null
          errors: Json | null
          id: string
          max_attempts: number
          pdf_generated_at: string | null
          pdf_metadata: Json | null
          pdf_path: string | null
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
          delivery_attempt?: number
          delivery_metadata?: Json | null
          delivery_status?: string
          delivery_timestamp?: string | null
          errors?: Json | null
          id?: string
          max_attempts?: number
          pdf_generated_at?: string | null
          pdf_metadata?: Json | null
          pdf_path?: string | null
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
          delivery_attempt?: number
          delivery_metadata?: Json | null
          delivery_status?: string
          delivery_timestamp?: string | null
          errors?: Json | null
          id?: string
          max_attempts?: number
          pdf_generated_at?: string | null
          pdf_metadata?: Json | null
          pdf_path?: string | null
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
      reassessment_rules: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          funnel_id: string | null
          id: string
          is_active: boolean
          priority: string | null
          rule_name: string
          schedule_cron: string | null
          schedule_interval_days: number | null
          trigger_condition: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          funnel_id?: string | null
          id?: string
          is_active?: boolean
          priority?: string | null
          rule_name: string
          schedule_cron?: string | null
          schedule_interval_days?: number | null
          trigger_condition: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          funnel_id?: string | null
          id?: string
          is_active?: boolean
          priority?: string | null
          rule_name?: string
          schedule_cron?: string | null
          schedule_interval_days?: number | null
          trigger_condition?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reassessment_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reassessment_rules_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reassessment_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
        ]
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
      review_records: {
        Row: {
          audit_metadata: Json | null
          created_at: string
          decided_at: string | null
          decision_notes: string | null
          decision_reason_code: string | null
          id: string
          is_sampled: boolean
          job_id: string
          queue_reasons: string[]
          review_iteration: number
          reviewer_role: string | null
          reviewer_user_id: string | null
          safety_check_id: string | null
          sampling_config_version: string | null
          sampling_hash: string | null
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          validation_result_id: string | null
        }
        Insert: {
          audit_metadata?: Json | null
          created_at?: string
          decided_at?: string | null
          decision_notes?: string | null
          decision_reason_code?: string | null
          id?: string
          is_sampled?: boolean
          job_id: string
          queue_reasons?: string[]
          review_iteration?: number
          reviewer_role?: string | null
          reviewer_user_id?: string | null
          safety_check_id?: string | null
          sampling_config_version?: string | null
          sampling_hash?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          validation_result_id?: string | null
        }
        Update: {
          audit_metadata?: Json | null
          created_at?: string
          decided_at?: string | null
          decision_notes?: string | null
          decision_reason_code?: string | null
          id?: string
          is_sampled?: boolean
          job_id?: string
          queue_reasons?: string[]
          review_iteration?: number
          reviewer_role?: string | null
          reviewer_user_id?: string | null
          safety_check_id?: string | null
          sampling_config_version?: string | null
          sampling_hash?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          validation_result_id?: string | null
        }
        Relationships: []
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
      shipment_events: {
        Row: {
          carrier: string | null
          created_at: string
          created_by_user_id: string | null
          event_at: string
          event_description: string | null
          event_status: Database["public"]["Enums"]["shipment_status"] | null
          event_type: string
          id: string
          location: string | null
          metadata: Json
          shipment_id: string
          tracking_number: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          created_by_user_id?: string | null
          event_at?: string
          event_description?: string | null
          event_status?: Database["public"]["Enums"]["shipment_status"] | null
          event_type: string
          id?: string
          location?: string | null
          metadata?: Json
          shipment_id: string
          tracking_number?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string
          created_by_user_id?: string | null
          event_at?: string
          event_description?: string | null
          event_status?: Database["public"]["Enums"]["shipment_status"] | null
          event_type?: string
          id?: string
          location?: string | null
          metadata?: Json
          shipment_id?: string
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "device_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      support_cases: {
        Row: {
          assigned_to_user_id: string | null
          category: Database["public"]["Enums"]["support_case_category"]
          closed_at: string | null
          created_at: string
          created_by_user_id: string | null
          description: string | null
          escalated_at: string | null
          escalated_by_user_id: string | null
          escalated_task_id: string | null
          id: string
          metadata: Json | null
          notes: string | null
          organization_id: string | null
          patient_id: string
          priority: Database["public"]["Enums"]["support_case_priority"]
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["support_case_status"]
          subject: string
          updated_at: string | null
        }
        Insert: {
          assigned_to_user_id?: string | null
          category?: Database["public"]["Enums"]["support_case_category"]
          closed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          escalated_at?: string | null
          escalated_by_user_id?: string | null
          escalated_task_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          organization_id?: string | null
          patient_id: string
          priority?: Database["public"]["Enums"]["support_case_priority"]
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_case_status"]
          subject: string
          updated_at?: string | null
        }
        Update: {
          assigned_to_user_id?: string | null
          category?: Database["public"]["Enums"]["support_case_category"]
          closed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          escalated_at?: string | null
          escalated_by_user_id?: string | null
          escalated_task_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          organization_id?: string | null
          patient_id?: string
          priority?: Database["public"]["Enums"]["support_case_priority"]
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_case_status"]
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assessment_id: string | null
          assigned_to_role: Database["public"]["Enums"]["user_role"] | null
          assigned_to_user_id: string | null
          created_at: string
          created_by_role: Database["public"]["Enums"]["user_role"] | null
          due_at: string | null
          id: string
          organization_id: string | null
          patient_id: string | null
          payload: Json
          status: Database["public"]["Enums"]["task_status"]
          task_type: string
          updated_at: string | null
        }
        Insert: {
          assessment_id?: string | null
          assigned_to_role?: Database["public"]["Enums"]["user_role"] | null
          assigned_to_user_id?: string | null
          created_at?: string
          created_by_role?: Database["public"]["Enums"]["user_role"] | null
          due_at?: string | null
          id?: string
          organization_id?: string | null
          patient_id?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["task_status"]
          task_type: string
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string | null
          assigned_to_role?: Database["public"]["Enums"]["user_role"] | null
          assigned_to_user_id?: string | null
          created_at?: string
          created_by_role?: Database["public"]["Enums"]["user_role"] | null
          due_at?: string | null
          id?: string
          organization_id?: string | null
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
            foreignKeyName: "tasks_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      triage_sessions: {
        Row: {
          correlation_id: string
          created_at: string
          id: string
          input_hash: string
          next_action: string
          patient_id: string
          rationale: string | null
          red_flags: string[]
          rules_version: string
          tier: string
        }
        Insert: {
          correlation_id: string
          created_at?: string
          id?: string
          input_hash: string
          next_action: string
          patient_id: string
          rationale?: string | null
          red_flags?: string[]
          rules_version: string
          tier: string
        }
        Update: {
          correlation_id?: string
          created_at?: string
          id?: string
          input_hash?: string
          next_action?: string
          patient_id?: string
          rationale?: string | null
          red_flags?: string[]
          rules_version?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "triage_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
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
        Relationships: [
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
        ]
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
          {
            foreignKeyName: "user_org_membership_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
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
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "pending_account_deletions"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      pending_account_deletions: {
        Row: {
          account_status: string | null
          days_remaining: number | null
          deletion_reason: string | null
          deletion_requested_at: string | null
          deletion_scheduled_for: string | null
          email: string | null
          user_id: string | null
        }
        Insert: {
          account_status?: never
          days_remaining?: never
          deletion_reason?: never
          deletion_requested_at?: never
          deletion_scheduled_for?: never
          email?: string | null
          user_id?: string | null
        }
        Update: {
          account_status?: never
          days_remaining?: never
          deletion_reason?: never
          deletion_requested_at?: never
          deletion_scheduled_for?: never
          email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_account_deletion: {
        Args: { target_user_id: string }
        Returns: Json
      }
      cleanup_expired_idempotency_keys: { Args: never; Returns: number }
      compute_inputs_hash: { Args: { p_inputs: Json }; Returns: string }
      compute_safety_evaluation_key_hash: {
        Args: { p_prompt_version: string; p_sections_id: string }
        Returns: string
      }
      compute_sampling_hash: {
        Args: { p_job_id: string; p_salt?: string }
        Returns: string
      }
      current_user_role: {
        Args: { org_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      diagnostics_pillars_sot: { Args: never; Returns: Json }
      execute_account_deletion: {
        Args: { executed_by?: string; target_user_id: string }
        Returns: Json
      }
      generate_report_version: {
        Args: {
          p_algorithm_version: string
          p_funnel_version: string
          p_inputs_hash_prefix: string
          p_prompt_version: string
        }
        Returns: string
      }
      get_design_tokens: { Args: { org_id?: string }; Returns: Json }
      get_my_patient_profile_id: { Args: never; Returns: string }
      get_user_org_ids: { Args: never; Returns: string[] }
      has_any_role: {
        Args: { check_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      has_role: { Args: { check_role: string }; Returns: boolean }
      increment_reminder_count_atomic: {
        Args: { p_reminder_timestamp: string; p_shipment_id: string }
        Returns: boolean
      }
      is_assigned_to_patient: {
        Args: { patient_uid: string }
        Returns: boolean
      }
      is_clinician: { Args: never; Returns: boolean }
      is_member_of_org: { Args: { org_id: string }; Returns: boolean }
      is_pilot_eligible: { Args: { user_id: string }; Returns: boolean }
      log_rls_violation: {
        Args: { attempted_id?: string; operation: string; table_name: string }
        Returns: undefined
      }
      request_account_deletion: {
        Args: {
          deletion_reason?: string
          retention_days?: number
          target_user_id: string
        }
        Returns: Json
      }
      set_user_role: {
        Args: { user_email: string; user_role: string }
        Returns: undefined
      }
      should_sample_job: {
        Args: {
          p_job_id: string
          p_salt?: string
          p_sampling_percentage?: number
        }
        Returns: boolean
      }
    }
    Enums: {
      assessment_state: "draft" | "in_progress" | "completed" | "archived"
      assessment_status: "in_progress" | "completed"
      notification_status:
        | "scheduled"
        | "sent"
        | "failed"
        | "cancelled"
        | "PENDING"
        | "SENT"
        | "DELIVERED"
        | "READ"
        | "FAILED"
        | "CANCELLED"
      onboarding_status_enum: "not_started" | "in_progress" | "completed"
      parsing_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "partial"
      pilot_event_type:
        | "TRIAGE_SUBMITTED"
        | "TRIAGE_ROUTED"
        | "FUNNEL_STARTED"
        | "FUNNEL_RESUMED"
        | "FUNNEL_COMPLETED"
        | "WORKUP_STARTED"
        | "WORKUP_NEEDS_MORE_DATA"
        | "WORKUP_READY_FOR_REVIEW"
        | "ESCALATION_OFFER_SHOWN"
        | "ESCALATION_OFFER_CLICKED"
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
      review_status: "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED"
      safety_action: "PASS" | "FLAG" | "BLOCK" | "UNKNOWN"
      shipment_status:
        | "ordered"
        | "shipped"
        | "in_transit"
        | "delivered"
        | "returned"
        | "cancelled"
      support_case_category:
        | "technical"
        | "medical"
        | "administrative"
        | "billing"
        | "general"
        | "other"
      support_case_priority: "low" | "medium" | "high" | "urgent"
      support_case_status:
        | "open"
        | "in_progress"
        | "escalated"
        | "resolved"
        | "closed"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      user_role: "patient" | "clinician" | "nurse" | "admin"
      validation_status: "pass" | "flag" | "fail"
      workup_status: "needs_more_data" | "ready_for_review"
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
      notification_status: [
        "scheduled",
        "sent",
        "failed",
        "cancelled",
        "PENDING",
        "SENT",
        "DELIVERED",
        "READ",
        "FAILED",
        "CANCELLED",
      ],
      onboarding_status_enum: ["not_started", "in_progress", "completed"],
      parsing_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "partial",
      ],
      pilot_event_type: [
        "TRIAGE_SUBMITTED",
        "TRIAGE_ROUTED",
        "FUNNEL_STARTED",
        "FUNNEL_RESUMED",
        "FUNNEL_COMPLETED",
        "WORKUP_STARTED",
        "WORKUP_NEEDS_MORE_DATA",
        "WORKUP_READY_FOR_REVIEW",
        "ESCALATION_OFFER_SHOWN",
        "ESCALATION_OFFER_CLICKED",
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
      review_status: ["PENDING", "APPROVED", "REJECTED", "CHANGES_REQUESTED"],
      safety_action: ["PASS", "FLAG", "BLOCK", "UNKNOWN"],
      shipment_status: [
        "ordered",
        "shipped",
        "in_transit",
        "delivered",
        "returned",
        "cancelled",
      ],
      support_case_category: [
        "technical",
        "medical",
        "administrative",
        "billing",
        "general",
        "other",
      ],
      support_case_priority: ["low", "medium", "high", "urgent"],
      support_case_status: [
        "open",
        "in_progress",
        "escalated",
        "resolved",
        "closed",
      ],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      user_role: ["patient", "clinician", "nurse", "admin"],
      validation_status: ["pass", "flag", "fail"],
      workup_status: ["needs_more_data", "ready_for_review"],
    },
  },
} as const
