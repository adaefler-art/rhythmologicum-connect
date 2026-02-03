/**
 * E76.2: Patient Context Pack Builder v1
 * 
 * Assembles comprehensive patient context for LLM diagnosis including:
 * - Anamnesis entries (max 30)
 * - Funnel runs (max 2 per funnel)
 * - Assessment results
 * - Provenance metadata
 * - Stable inputs_hash for determinism
 */

import { createHash } from 'crypto'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

export interface AnamnesisEntry {
  id: string
  title: string
  content: Record<string, unknown>
  entry_type: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface FunnelRun {
  assessment_id: string
  funnel_slug: string
  funnel_name: string
  started_at: string
  completed_at: string | null
  status: string
  answers: Array<{
    question_id: string
    question_text: string
    answer_value: unknown
  }>
  result: {
    scores: Record<string, unknown>
    risk_models: Record<string, unknown>
    algorithm_version: string
  } | null
}

export interface PatientContextPack {
  patient_id: string
  demographics: {
    age?: number
    gender?: string
  }
  anamnesis: {
    entries: AnamnesisEntry[]
    total_count: number
    limited_to: number
  }
  funnel_runs: {
    runs: FunnelRun[]
    total_count: number
    limit_per_funnel: number
  }
  current_measures: {
    stress_score?: number
    sleep_score?: number
    risk_level?: string
  } | null
  metadata: {
    retrieved_at: string
    context_version: string
    inputs_hash: string
  }
}

const MAX_ANAMNESIS_ENTRIES = 30
const MAX_RUNS_PER_FUNNEL = 2
const CONTEXT_VERSION = 'v1'

/**
 * Build patient context pack for LLM consumption
 * @param patientId - UUID of the patient
 * @returns Comprehensive patient context with stable hash
 */
export async function buildPatientContextPack(
  patientId: string,
): Promise<PatientContextPack> {
  const supabase = createAdminSupabaseClient()

  // Fetch anamnesis entries (max 30, most recent first)
  const { data: anamnesisData, error: anamnesisError } = await supabase
    .from('anamnesis_entries')
    .select('id, title, content, entry_type, tags, created_at, updated_at')
    .eq('patient_id', patientId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(MAX_ANAMNESIS_ENTRIES)

  if (anamnesisError) {
    throw new Error(`Failed to fetch anamnesis entries: ${anamnesisError.message}`)
  }

  const anamnesisEntries: AnamnesisEntry[] = (anamnesisData || []).map((entry) => ({
    id: entry.id,
    title: entry.title,
    content: entry.content as Record<string, unknown>,
    entry_type: entry.entry_type,
    tags: entry.tags || [],
    created_at: entry.created_at,
    updated_at: entry.updated_at,
  }))

  // Get total count of anamnesis entries
  const { count: anamnesisCount } = await supabase
    .from('anamnesis_entries')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', patientId)
    .eq('is_archived', false)

  // Fetch completed assessments with funnel info
  const { data: assessmentsData, error: assessmentsError } = await supabase
    .from('assessments')
    .select(`
      id,
      funnel,
      funnel_id,
      started_at,
      completed_at,
      status,
      funnels!inner(
        slug,
        name
      )
    `)
    .eq('patient_id', patientId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  if (assessmentsError) {
    throw new Error(`Failed to fetch assessments: ${assessmentsError.message}`)
  }

  // Group assessments by funnel and limit to max 2 per funnel
  const assessmentsByFunnel = new Map<string, typeof assessmentsData>()
  const assessmentsArray = assessmentsData || []

  for (const assessment of assessmentsArray) {
    const funnelSlug = assessment.funnels?.slug || assessment.funnel
    if (!funnelSlug) continue

    const existing = assessmentsByFunnel.get(funnelSlug) || []
    if (existing.length < MAX_RUNS_PER_FUNNEL) {
      assessmentsByFunnel.set(funnelSlug, [...existing, assessment])
    }
  }

  // Flatten limited assessments
  const limitedAssessments = Array.from(assessmentsByFunnel.values()).flat()

  // Fetch answers and results for limited assessments
  const funnelRuns: FunnelRun[] = []

  for (const assessment of limitedAssessments) {
    // Fetch answers
    const { data: answersData } = await supabase
      .from('assessment_answers')
      .select(`
        question_id,
        answer_value,
        questions(question_text)
      `)
      .eq('assessment_id', assessment.id)

    // Fetch calculated results
    const { data: resultData } = await supabase
      .from('calculated_results')
      .select('scores, risk_models, algorithm_version')
      .eq('assessment_id', assessment.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const answers = (answersData || []).map((answer) => ({
      question_id: answer.question_id,
      question_text: (answer.questions as any)?.question_text || '',
      answer_value: answer.answer_value,
    }))

    funnelRuns.push({
      assessment_id: assessment.id,
      funnel_slug: assessment.funnels?.slug || assessment.funnel,
      funnel_name: assessment.funnels?.name || assessment.funnel,
      started_at: assessment.started_at,
      completed_at: assessment.completed_at,
      status: assessment.status,
      answers,
      result: resultData
        ? {
            scores: resultData.scores as Record<string, unknown>,
            risk_models: resultData.risk_models as Record<string, unknown>,
            algorithm_version: resultData.algorithm_version,
          }
        : null,
    })
  }

  // Fetch current patient measures (most recent)
  const { data: measuresData } = await supabase
    .from('patient_measures')
    .select('stress_score, sleep_score, risk_level')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Fetch patient profile for demographics
  const { data: profileData } = await supabase
    .from('patient_profiles')
    .select('date_of_birth, gender')
    .eq('id', patientId)
    .single()

  // Calculate age from date_of_birth
  let age: number | undefined
  if (profileData?.date_of_birth) {
    const dob = new Date(profileData.date_of_birth)
    const today = new Date()
    age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }
  }

  // Build the context pack
  const contextPack: PatientContextPack = {
    patient_id: patientId,
    demographics: {
      age,
      gender: profileData?.gender || undefined,
    },
    anamnesis: {
      entries: anamnesisEntries,
      total_count: anamnesisCount || 0,
      limited_to: MAX_ANAMNESIS_ENTRIES,
    },
    funnel_runs: {
      runs: funnelRuns,
      total_count: assessmentsArray.length,
      limit_per_funnel: MAX_RUNS_PER_FUNNEL,
    },
    current_measures: measuresData || null,
    metadata: {
      retrieved_at: new Date().toISOString(),
      context_version: CONTEXT_VERSION,
      inputs_hash: '', // Will be calculated below
    },
  }

  // Calculate stable inputs_hash
  contextPack.metadata.inputs_hash = calculateInputsHash(contextPack)

  return contextPack
}

/**
 * Calculate deterministic hash of context pack inputs
 * Used for detecting equivalent runs and ensuring reproducibility
 */
function calculateInputsHash(contextPack: PatientContextPack): string {
  // Create normalized representation for hashing
  const normalized = {
    patient_id: contextPack.patient_id,
    demographics: contextPack.demographics,
    anamnesis_ids: contextPack.anamnesis.entries.map((e) => e.id).sort(),
    funnel_run_ids: contextPack.funnel_runs.runs.map((r) => r.assessment_id).sort(),
    measures: contextPack.current_measures,
    context_version: contextPack.metadata.context_version,
  }

  const jsonString = JSON.stringify(normalized, Object.keys(normalized).sort())
  return createHash('sha256').update(jsonString).digest('hex')
}
