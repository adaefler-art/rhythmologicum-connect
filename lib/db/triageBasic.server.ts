import 'server-only'

import type { Database } from '@/lib/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

type CaseState = 'needs_input' | 'in_progress' | 'ready_for_review' | 'resolved' | 'snoozed'

type BasicTriageCase = {
  case_id: string
  patient_id: string
  funnel_id: string | null
  funnel_slug: string
  first_name: string | null
  last_name: string | null
  preferred_name: string | null
  patient_display: string
  case_state: CaseState
  attention_items: string[] | null
  attention_level: 'critical' | 'warn' | 'info' | 'none'
  next_action: 'clinician_review' | 'admin_investigate' | 'clinician_contact' | 'system_retry' | 'patient_provide_data' | 'patient_continue' | 'none'
  assigned_at: string
  last_activity_at: string
  updated_at: string
  completed_at: string | null
  is_active: boolean
  snoozed_until: string | null
  priority_score: number
}

function buildPatientDisplay(profile: {
  full_name: string | null
  first_name: string | null
  last_name: string | null
  preferred_name: string | null
} | null): {
  first_name: string | null
  last_name: string | null
  preferred_name: string | null
  patient_display: string
} {
  if (!profile) {
    return {
      first_name: null,
      last_name: null,
      preferred_name: null,
      patient_display: '',
    }
  }

  const name = profile.full_name?.trim()
  if (name) {
    return {
      first_name: profile.first_name,
      last_name: profile.last_name,
      preferred_name: profile.preferred_name,
      patient_display: name,
    }
  }

  const combined = [profile.preferred_name, profile.first_name, profile.last_name]
    .filter((part) => part && part.trim())
    .join(' ')
    .trim()

  return {
    first_name: profile.first_name,
    last_name: profile.last_name,
    preferred_name: profile.preferred_name,
    patient_display: combined,
  }
}

function deriveCaseState(row: {
  status: Database['public']['Enums']['assessment_status']
  workup_status: Database['public']['Enums']['workup_status'] | null
}): CaseState {
  if (row.status === 'completed') {
    return row.workup_status === 'ready_for_review' ? 'ready_for_review' : 'resolved'
  }

  if (row.workup_status === 'needs_more_data') {
    return 'needs_input'
  }

  return 'in_progress'
}

export async function fetchBasicTriageCases(
  supabase: SupabaseClient<Database>,
  limit: number,
): Promise<BasicTriageCase[]> {
  const { data, error } = await supabase
    .from('assessments')
    .select(
      `
      id,
      patient_id,
      funnel,
      funnel_id,
      started_at,
      status,
      workup_status,
      completed_at,
      patient_profiles (
        full_name,
        first_name,
        last_name,
        preferred_name
      )
    `,
    )
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    throw error || new Error('No triage cases returned')
  }

  return data.map((row) => {
    const profile = Array.isArray(row.patient_profiles)
      ? row.patient_profiles[0] ?? null
      : row.patient_profiles ?? null
    const nameFields = buildPatientDisplay(profile)
    const caseState = deriveCaseState({
      status: row.status,
      workup_status: row.workup_status,
    })
    const assignedAt = row.started_at

    return {
      case_id: row.id,
      patient_id: row.patient_id,
      funnel_id: row.funnel_id,
      funnel_slug: row.funnel?.trim() || '—',
      first_name: nameFields.first_name,
      last_name: nameFields.last_name,
      preferred_name: nameFields.preferred_name,
      patient_display: nameFields.patient_display,
      case_state: caseState,
      attention_items: null,
      attention_level: 'none',
      next_action: caseState === 'ready_for_review' ? 'clinician_review' : 'none',
      assigned_at: assignedAt,
      last_activity_at: assignedAt,
      updated_at: assignedAt,
      completed_at: row.completed_at,
      is_active: caseState !== 'resolved',
      snoozed_until: null,
      priority_score: 0,
    }
  })
}
