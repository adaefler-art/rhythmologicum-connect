/**
 * Clinician Anamnesis API - Latest + Versions + Suggested Facts
 *
 * GET /api/clinician/patient/[patientId]/anamnesis
 * POST /api/clinician/patient/[patientId]/anamnesis
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { ErrorCode } from '@/lib/api/responseTypes'
import { getPatientOrganizationId } from '@/lib/api/anamnesis/helpers'
import { ENTRY_TYPES, validateContentSize, validateCreateEntry } from '@/lib/api/anamnesis/validation'
import type { Json } from '@/lib/types/supabase'

type RouteContext = {
  params: Promise<{ patientId: string }>
}

type SuggestedFact = {
  id: string
  label: string
  value: string
  sourceType: 'assessment' | 'report' | 'result'
  sourceId: string
  occurredAt: string | null
}

const createFromFactsSchema = z.object({
  text: z.string().min(1),
  sources: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        value: z.string(),
        sourceType: z.enum(['assessment', 'report', 'result']),
        sourceId: z.string(),
        occurredAt: z.string().nullable().optional(),
      }),
    )
    .optional(),
  title: z.string().optional(),
})

const toFactId = (fact: Omit<SuggestedFact, 'id'>) =>
  `${fact.sourceType}:${fact.sourceId}:${fact.label}`

const getNumericScore = (scores: Json | null, key: string): number | null => {
  if (!scores || typeof scores !== 'object') return null
  const value = (scores as Record<string, unknown>)[key]
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return null
}

const formatAssessmentStatus = (status: string) => {
  if (status === 'completed') return 'abgeschlossen'
  if (status === 'in_progress') return 'in Bearbeitung'
  return status
}

async function computeAnamnesisFacts(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, patientId: string) {
  const facts: SuggestedFact[] = []

  const { data: assessments, error: assessmentError } = await supabase
    .from('assessments')
    .select('id, status, started_at, completed_at, funnel, funnel_id')
    .eq('patient_id', patientId)
    .order('started_at', { ascending: false })
    .limit(5)

  if (!assessmentError && assessments) {
    assessments.forEach((assessment) => {
      const funnelLabel = assessment.funnel || assessment.funnel_id || 'Assessment'
      const statusLabel = formatAssessmentStatus(assessment.status)
      const occurredAt = assessment.completed_at || assessment.started_at

      const fact = {
        label: 'Assessment',
        value: `${funnelLabel} (${statusLabel})`,
        sourceType: 'assessment' as const,
        sourceId: assessment.id,
        occurredAt: occurredAt ?? null,
      }

      facts.push({ ...fact, id: toFactId(fact) })
    })
  }

  const assessmentIds = assessments?.map((item) => item.id) || []
  if (assessmentIds.length > 0) {
    const { data: reports } = await supabase
      .from('reports')
      .select('id, assessment_id, risk_level, created_at')
      .in('assessment_id', assessmentIds)
      .order('created_at', { ascending: false })
      .limit(5)

    reports?.forEach((report) => {
      if (report.risk_level) {
        const fact = {
          label: 'Risiko',
          value: report.risk_level,
          sourceType: 'report' as const,
          sourceId: report.id,
          occurredAt: report.created_at ?? null,
        }
        facts.push({ ...fact, id: toFactId(fact) })
      }
    })

    const { data: results } = await supabase
      .from('calculated_results')
      .select('id, assessment_id, scores, created_at')
      .in('assessment_id', assessmentIds)
      .order('created_at', { ascending: false })
      .limit(5)

    results?.forEach((result) => {
      const stressScore = getNumericScore(result.scores, 'stress_score')
      const sleepScore = getNumericScore(result.scores, 'sleep_score')

      if (stressScore !== null) {
        const fact = {
          label: 'Stress-Score',
          value: String(Math.round(stressScore)),
          sourceType: 'result' as const,
          sourceId: result.id,
          occurredAt: result.created_at ?? null,
        }
        facts.push({ ...fact, id: toFactId(fact) })
      }

      if (sleepScore !== null) {
        const fact = {
          label: 'Schlaf-Score',
          value: String(Math.round(sleepScore)),
          sourceType: 'result' as const,
          sourceId: result.id,
          occurredAt: result.created_at ?? null,
        }
        facts.push({ ...fact, id: toFactId(fact) })
      }
    })
  }

  return facts
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { patientId } = await context.params
    const endpoint = `/api/clinician/patient/${patientId}/anamnesis`
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.UNAUTHORIZED, message: 'Authentication required' },
        },
        { status: 401 },
      )
    }

    const isClinician = await hasClinicianRole()
    if (!isClinician) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.FORBIDDEN, message: 'Clinician or admin role required' },
        },
        { status: 403 },
      )
    }

    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('id', patientId)
        const { data: patient, error: patientError } = await supabase

    if (patientError || !patient) {
      return NextResponse.json({
        success: true,
        data: {
        if (patientError || !patient) {
          const admin = createAdminSupabaseClient()
          const { data: adminPatient, error: adminError } = await admin
            .from('patient_profiles')
            .select('id')
            .eq('id', patientId)
            .maybeSingle()

          if (adminError) {
            return NextResponse.json(
              {
                success: false,
                error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to verify patient' },
              },
              { status: 500 },
            )
          }

          if (adminPatient) {
            return NextResponse.json(
              { error: 'FORBIDDEN', endpoint, patientId },
              { status: 403 },
            )
          }

          return NextResponse.json(
            { error: 'NOT_FOUND', endpoint, patientId },
            { status: 404 },
          )
        }
        `
        id,
        title,
        content,
        entry_type,
        tags,
        is_archived,
        created_at,
        updated_at,
        created_by,
        updated_by
      `,
      )
      .eq('patient_id', patientId)
      .order('updated_at', { ascending: false })

    if (entryError) {
      console.error('[clinician/patient/anamnesis GET] Entry error:', entryError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch anamnesis entries' },
        },
        { status: 500 },
      )
    }

    const latestEntry = entries?.[0] ?? null
    const versions = latestEntry
      ? await supabase
          .from('anamnesis_entry_versions')
          .select('id, version_number, title, content, entry_type, tags, changed_at, change_reason')
          .eq('entry_id', latestEntry.id)
          .order('version_number', { ascending: false })
      : { data: [], error: null }

    if (versions.error) {
      console.error('[clinician/patient/anamnesis GET] Versions error:', versions.error)
    }

    const suggestedFacts = await computeAnamnesisFacts(supabase, patientId)

    console.info(
      JSON.stringify({
        event: 'ANAMNESIS_LOAD',
        patientId,
        outcome: 'success',
        rowCount: entries?.length ?? 0,
      }),
    )

    return NextResponse.json({
      success: true,
      data: {
        entries: entries ?? [],
        latestEntry,
        versions: versions.data ?? [],
        suggestedFacts,
      },
    })
  } catch (err) {
    console.error('[clinician/patient/anamnesis GET] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { patientId } = await context.params
    const endpoint = `/api/clinician/patient/${patientId}/anamnesis`
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.UNAUTHORIZED, message: 'Authentication required' },
        },
        { status: 401 },
      )
    }

    const isClinician = await hasClinicianRole()
    if (!isClinician) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.FORBIDDEN, message: 'Clinician or admin role required' },
        },
        { status: 403 },
      )
    }

    const body = await request.json()
    const isFactsPayload = typeof body?.text === 'string'

    let title = ''
    let content: Record<string, unknown> = {}
    let entryType: string | null = null
    let tags: string[] = []

    if (isFactsPayload) {
      const validated = createFromFactsSchema.parse(body)
      title = validated.title || 'Anamnese (Vorschlag)'
      content = { text: validated.text, sources: validated.sources ?? [] }
        if (patientError || !patient) {
          const admin = createAdminSupabaseClient()
          const { data: adminPatient, error: adminError } = await admin
            .from('patient_profiles')
            .select('id')
            .eq('id', patientId)
            .maybeSingle()

          if (adminError) {
            return NextResponse.json(
              {
                success: false,
                error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to verify patient' },
              },
              { status: 500 },
            )
          }

          if (adminPatient) {
            return NextResponse.json(
              { error: 'FORBIDDEN', endpoint, patientId },
              { status: 403 },
            )
          }

          return NextResponse.json(
            { error: 'NOT_FOUND', endpoint, patientId },
            { status: 404 },
          )
        }
    }

    const { data: latestEntry } = await supabase
      .from('anamnesis_entries')
      .select('*')
      .eq('patient_id', patientId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestEntry) {
      const { data: updatedEntry, error: updateError } = await supabase
        .from('anamnesis_entries')
        .update({
          title,
          content: content as Json,
          entry_type: entryType || latestEntry.entry_type,
          tags: tags.length > 0 ? tags : latestEntry.tags,
          updated_by: user.id,
        })
        .eq('id', latestEntry.id)
        .select()
        .single()

      if (updateError) {
        console.error('[clinician/patient/anamnesis POST] Update error:', updateError)
        return NextResponse.json(
          {
            success: false,
            error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to update anamnesis entry' },
          },
          { status: 500 },
        )
      }

      const { data: version } = await supabase
        .from('anamnesis_entry_versions')
        .select('*')
        .eq('entry_id', latestEntry.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      return NextResponse.json(
        { success: true, data: { entry: updatedEntry, version: version ?? null } },
        { status: 201 },
      )
    }

    const organizationId = await getPatientOrganizationId(supabase, patientId)
    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.NOT_FOUND, message: 'Patient organization not found' },
        },
        { status: 404 },
      )
    }

    const { data: newEntry, error: insertError } = await supabase
      .from('anamnesis_entries')
      .insert({
        patient_id: patientId,
        organization_id: organizationId,
        title,
        content: content as Json,
        entry_type: entryType || ENTRY_TYPES[0],
        tags,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[clinician/patient/anamnesis POST] Insert error:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to create anamnesis entry' },
        },
        { status: 500 },
      )
    }

    const { data: version } = await supabase
      .from('anamnesis_entry_versions')
      .select('*')
      .eq('entry_id', newEntry.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json(
      { success: true, data: { entry: newEntry, version: version ?? null } },
      { status: 201 },
    )
  } catch (err) {
    console.error('[clinician/patient/anamnesis POST] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
