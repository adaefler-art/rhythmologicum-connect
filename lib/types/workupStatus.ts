/**
 * E6.4.4: Workup Status Types
 * 
 * Temporary types for workup status fields until Supabase types are regenerated
 * after migration 20260115050033_e6_4_4_workup_status.sql is applied.
 */

export type WorkupStatus = 'needs_more_data' | 'ready_for_review' | null

export type AssessmentWithWorkup = {
  id: string
  patient_id: string
  funnel: string
  completed_at: string | null
  status: string
  workup_status?: WorkupStatus
  missing_data_fields?: string[] | null
}

export type AssessmentListItemWithWorkup = {
  id: string
  status: string
  workup_status?: WorkupStatus
  missing_data_fields?: string[] | null
}
