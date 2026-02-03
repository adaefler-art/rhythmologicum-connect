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

import 'server-only'
import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'

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
    question_label: string
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
  supabase: SupabaseClient<Database>,
  patientId: string,
): Promise<PatientContextPack> {
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
    // Fetch answers with joined question data
    const { data: answersData, error: answersError } = await supabase
      .from('assessment_answers')
      .select(`
        question_id,
        answer_value
      `)
      .eq('assessment_id', assessment.id)

    if (answersError) {
      throw new Error(`Failed to fetch assessment answers: ${answersError.message}`)
    }

    const answerRows = answersData || []
    const questionIds = answerRows.map((answer) => answer.question_id).filter(Boolean)
    const questionLabelByKey = new Map<string, string>()

    if (questionIds.length > 0) {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('key, label')
        .in('key', questionIds)

      if (questionsError) {
        throw new Error(`Failed to fetch question labels: ${questionsError.message}`)
      }

      for (const question of questionsData || []) {
        questionLabelByKey.set(question.key, question.label)
      }
    }

    // Fetch calculated results
    const { data: resultData } = await supabase
      .from('calculated_results')
      .select('scores, risk_models, algorithm_version')
      .eq('assessment_id', assessment.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const answers = answerRows.map((answer) => ({
      question_id: answer.question_id,
      question_label: questionLabelByKey.get(answer.question_id) || '',
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
    .select('birth_year, sex')
    .eq('id', patientId)
    .single()

  // Calculate age from birth_year
  let age: number | undefined
  if (typeof profileData?.birth_year === 'number') {
    age = new Date().getFullYear() - profileData.birth_year
  }

  // Build the context pack
  const contextPack: PatientContextPack = {
    patient_id: patientId,
    demographics: {
      age,
      gender: profileData?.sex || undefined,
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
  // Create normalized representation for hashing with sorted keys
  const normalized = {
    anamnesis_ids: contextPack.anamnesis.entries.map((e) => e.id).sort(),
    context_version: contextPack.metadata.context_version,
    demographics: contextPack.demographics,
    funnel_run_ids: contextPack.funnel_runs.runs.map((r) => r.assessment_id).sort(),
    measures: contextPack.current_measures,
    patient_id: contextPack.patient_id,
  }

  // Use a replacer function to ensure deterministic key ordering
  const jsonString = JSON.stringify(normalized, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((sorted: Record<string, unknown>, k) => {
          sorted[k] = value[k]
          return sorted
        }, {})
    }
    return value
  })

  return createHash('sha256').update(jsonString).digest('hex')
}
