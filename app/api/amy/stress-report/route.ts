// app/api/amy/stress-report/route.ts
import { NextResponse } from 'next/server'
import type { PostgrestError } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getAmyFallbackText, type RiskLevel } from '@/lib/amyFallbacks'
import { featureFlags } from '@/lib/featureFlags'
import { logError, logPatientFlowError } from '@/lib/logging/logger'
import {
  CURRENT_ALGORITHM_VERSION,
  CURRENT_PROMPT_VERSION,
  generateReportVersion,
  computeInputsHash,
  getHashPrefix,
} from '@/lib/versioning/constants'
import { logReportGenerated } from '@/lib/audit'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { trackUsage } from '@/lib/monitoring/usageTrackingWrapper'
import {
  trackReportGenerationStarted,
  trackReportGenerationCompleted,
  trackReportGenerationFailed,
  calculateTimeToReport,
} from '@/lib/monitoring/kpi'
import { env } from '@/lib/env'

const anthropicApiKey = env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_TOKEN
const MODEL = env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929'

const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null

type AnswerRow = {
  question_id: string | null
  answer_value: number | null
}

const STRESS_KEYS = ['stress_q1', 'stress_q2', 'stress_q3', 'stress_q4', 'stress_q5']

const SLEEP_KEYS = ['sleep_q1', 'sleep_q2', 'sleep_q3']

function average(values: number[]): number | null {
  if (!values.length) return null
  const sum = values.reduce((a, b) => a + b, 0)
  return sum / values.length
}

function computeScores(answers: AnswerRow[]) {
  const startTime = Date.now()
  console.log('[stress-report/computeScores] Starting score calculation', {
    totalAnswers: answers.length,
  })

  const stressVals = answers
    .filter((a) => a.question_id && STRESS_KEYS.includes(a.question_id))
    .map((a) => a.answer_value)
    .filter((v): v is number => typeof v === 'number')

  const sleepVals = answers
    .filter((a) => a.question_id && SLEEP_KEYS.includes(a.question_id))
    .map((a) => a.answer_value)
    .filter((v): v is number => typeof v === 'number')

  console.log('[stress-report/computeScores] Collected values', {
    stressValues: stressVals.length,
    sleepValues: sleepVals.length,
  })

  const stressAvg = average(stressVals)
  const sleepAvg = average(sleepVals)

  const scaleTo100 = (avg: number | null): number | null => {
    if (avg == null) return null
    const min = 1
    const max = 5
    const normalized = (avg - min) / (max - min)
    return Math.round(normalized * 100)
  }

  const stressScore = scaleTo100(stressAvg)
  const sleepScore = scaleTo100(sleepAvg)

  let riskLevel: RiskLevel | null = null
  if (stressScore != null) {
    if (stressScore < 40) riskLevel = 'low'
    else if (stressScore < 70) riskLevel = 'moderate'
    else riskLevel = 'high'
  }

  const duration = Date.now() - startTime
  console.log('[stress-report/computeScores] Score calculation completed', {
    duration: `${duration}ms`,
    stressScore,
    sleepScore,
    riskLevel,
  })

  return { stressScore, sleepScore, riskLevel }
}

async function createAmySummary(params: {
  stressScore: number | null
  sleepScore: number | null
  riskLevel: RiskLevel | null
  answers: AnswerRow[]
}) {
  const { stressScore, sleepScore, riskLevel, answers } = params

  // Feature flag disabled → Fallback-Text
  if (!featureFlags.AMY_ENABLED) {
    console.log('[stress-report/createAmySummary] AMY feature disabled, using fallback text')
    return getAmyFallbackText({ riskLevel, stressScore, sleepScore })
  }

  // Kein Anthropic-Key → Fallback-Text
  if (!anthropic) {
    console.warn('[stress-report/createAmySummary] Anthropic not configured, using fallback text')
    return getAmyFallbackText({ riskLevel, stressScore, sleepScore })
  }

  const answersJson = JSON.stringify(answers, null, 2)
  const startTime = Date.now()

  console.log('[stress-report/createAmySummary] Starting AMY request', {
    model: MODEL,
    stressScore,
    sleepScore,
    riskLevel,
    answersCount: answers.length,
  })

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.3,
      system:
        'Du bist "AMY", eine empathische, evidenzbasierte Assistenz für Stress, Resilienz und Schlaf. ' +
        'Du sprichst mit Patienten auf Augenhöhe, in klarer, kurzer Sprache (deutsch), ohne medizinische Diagnosen zu stellen. ' +
        'Fasse die Ergebnisse in einem kurzen, gut verständlichen Fließtext zusammen (max. ~200 Wörter). ' +
        'Keine Bulletpoints, keine Überschriften.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `Hier sind die Ergebnisse eines kurzen Stress- und Schlaf-Checks.\n\n` +
                `Stress-Score (0–100): ${stressScore ?? 'nicht berechenbar'}\n` +
                `Sleep-Score (0–100): ${sleepScore ?? 'nicht berechenbar'}\n` +
                `Eingestuftes Stressniveau: ${riskLevel ?? 'nicht klassifiziert'}\n\n` +
                `Die einzelnen Antworten (JSON):\n${answersJson}\n\n` +
                `Bitte schreibe einen kurzen, motivierenden und realistischen Einordnungstext. ` +
                `Erkläre knapp, was der Wert bedeutet, und schlage 2–3 konkrete, alltagstaugliche nächste Schritte vor. ` +
                `Duzen ist erlaubt und erwünscht.`,
            },
          ],
        },
      ],
    })

    const duration = Date.now() - startTime
    const textParts = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))

    const reportText = textParts.join('\n').trim()

    console.log('[stress-report/createAmySummary] AMY request completed successfully', {
      duration: `${duration}ms`,
      model: MODEL,
      responseLength: reportText.length,
      contentBlocks: response.content.length,
    })

    return reportText
  } catch (error) {
    const duration = Date.now() - startTime

    // Determine error type for better diagnostics
    let errorType = 'unknown'
    let errorMessage = String(error)

    if (error && typeof error === 'object') {
      const err = error as { status?: number; type?: string; message?: string }

      if (err.status === 429) {
        errorType = 'rate_limit'
      } else if (err.status === 408 || errorMessage.includes('timeout')) {
        errorType = 'timeout'
      } else if (err.type === 'invalid_request_error' || errorMessage.includes('JSON')) {
        errorType = 'json_parsing'
      } else if (err.status && err.status >= 500) {
        errorType = 'api_error'
      }

      if (err.message) {
        errorMessage = err.message
      }
    }

    console.error('[stress-report/createAmySummary] AMY request failed', {
      duration: `${duration}ms`,
      errorType,
      errorMessage,
      model: MODEL,
    })

    // Log structured error for monitoring
    logError(
      'AMY API request failed',
      {
        endpoint: '/api/amy/stress-report',
        errorType,
        model: MODEL,
        duration,
      },
      error,
    )

    // LLM-Fehler → Fallback-Text verwenden
    return getAmyFallbackText({ riskLevel, stressScore, sleepScore })
  }
}

export async function POST(req: Request) {
  const requestStartTime = Date.now()
  console.log('[stress-report] POST request received')

  // Use admin client for accessing reports across users (RLS bypass for system operation)
  const supabase = createAdminSupabaseClient()

  try {
    const body = await req.json().catch((parseError) => {
      console.error('[stress-report] JSON parsing error', {
        error: String(parseError),
      })
      return null
    })
    const assessmentId = body?.assessmentId as string | undefined

    if (!assessmentId) {
      console.warn('[stress-report] Missing assessmentId in request')
      return NextResponse.json({ error: 'assessmentId fehlt im Request-Body.' }, { status: 400 })
    }

    console.log('[stress-report] Processing assessment', {
      assessmentId,
    })

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, completed_at')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      console.error('[stress-report] Assessment nicht gefunden:', assessmentError)
      return NextResponse.json({ error: 'Assessment nicht gefunden.' }, { status: 404 })
    }

    const { data: answers, error: answersError } = await supabase
      .from('assessment_answers')
      .select('question_id, answer_value')
      .eq('assessment_id', assessmentId)

    if (answersError) {
      console.error('[stress-report] Fehler beim Laden der Antworten:', answersError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Antworten aus der Datenbank.' },
        { status: 500 },
      )
    }

    const typedAnswers: AnswerRow[] = (answers ?? []) as AnswerRow[]

    const { stressScore, sleepScore, riskLevel } = computeScores(typedAnswers)

    const reportTextShort = await createAmySummary({
      stressScore,
      sleepScore,
      riskLevel,
      answers: typedAnswers,
    })

    // V05-I01.3: Generate versioned report with full traceability
    // Compute inputs hash from normalized inputs including assessment context
    const inputsForHash = {
      assessment_id: assessmentId,
      algorithm_version: CURRENT_ALGORITHM_VERSION,
      prompt_version: CURRENT_PROMPT_VERSION,
      answers: typedAnswers,
    }
    const inputsHash = await computeInputsHash(inputsForHash)
    const inputsHashPrefix = getHashPrefix(inputsHash, 8)

    const reportVersion = generateReportVersion({
      algorithmVersion: CURRENT_ALGORITHM_VERSION,
      promptVersion: CURRENT_PROMPT_VERSION,
      inputsHashPrefix,
    })

    console.log('[stress-report] Generating versioned report', {
      algorithmVersion: CURRENT_ALGORITHM_VERSION,
      promptVersion: CURRENT_PROMPT_VERSION,
      reportVersion,
      inputsHashPrefix,
    })

    const { data: existingReports, error: existingError } = await supabase
      .from('reports')
      .select('*')
      .eq('assessment_id', assessmentId)
      .limit(1)

    if (existingError) {
      console.error('[stress-report] Fehler beim Laden des Reports:', existingError)
    }

    let reportRow

    if (existingReports && existingReports.length > 0) {
      const existing = existingReports[0]
      const { data: updated, error: updateError } = await supabase
        .from('reports')
        .update({
          score_numeric: stressScore ?? existing.score_numeric,
          sleep_score: sleepScore ?? existing.sleep_score,
          risk_level: riskLevel ?? existing.risk_level,
          report_text_short: reportTextShort,
          algorithm_version: CURRENT_ALGORITHM_VERSION,
          prompt_version: CURRENT_PROMPT_VERSION,
          report_version: reportVersion,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        console.error('[stress-report] Fehler beim Update des Reports:', updateError)
        return NextResponse.json(
          { error: 'Fehler beim Aktualisieren des Reports.' },
          { status: 500 },
        )
      }

      reportRow = updated
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('reports')
        .insert({
          assessment_id: assessmentId,
          score_numeric: stressScore ?? null,
          sleep_score: sleepScore ?? null,
          risk_level: riskLevel ?? null,
          report_text_short: reportTextShort,
          algorithm_version: CURRENT_ALGORITHM_VERSION,
          prompt_version: CURRENT_PROMPT_VERSION,
          report_version: reportVersion,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[stress-report] Fehler beim Insert des Reports:', insertError)
        return NextResponse.json({ error: 'Fehler beim Anlegen des Reports.' }, { status: 500 })
      }

      reportRow = inserted
    }

    try {
      const measureResult = await upsertPatientMeasure({
        patientId: assessment.patient_id,
        reportId: reportRow.id,
        stressScore: stressScore ?? reportRow.score_numeric ?? null,
        sleepScore: sleepScore ?? reportRow.sleep_score ?? null,
        riskLevel: (riskLevel ?? reportRow.risk_level ?? null) as RiskLevel | null,
      })
      if (!measureResult.persisted) {
        console.warn(
          '[stress-report] Continuing without patient_measures persistence (recoverable)',
          {
            assessmentId,
            reportId: reportRow.id,
            step: measureResult.step,
          },
        )
      }
    } catch (measureError) {
      console.error(
        '[stress-report] Fehler beim Aktualisieren von patient_measures (non-blocking):',
        measureError,
      )
      // Do not fail the report creation if patient_measures is temporarily unavailable or schema-mismatched
      console.warn('[stress-report] Skipping patient_measures persistence and continuing response')
    }

    // Audit log: Report generated
    try {
      await logReportGenerated({
        report_id: reportRow.id,
        assessment_id: assessmentId,
        algorithm_version: CURRENT_ALGORITHM_VERSION,
        prompt_version: CURRENT_PROMPT_VERSION,
        report_version: reportVersion,
      })
    } catch (auditError) {
      // Log audit failures but don't fail the request
      console.error('[stress-report] Audit logging failed (non-blocking):', auditError)
    }

    // V05-I10.3: Track KPI - Report generation completed
    try {
      const reportCreatedAt = reportRow.created_at || new Date().toISOString()
      let timeToReportSeconds: number | undefined

      if (assessment.completed_at) {
        timeToReportSeconds = calculateTimeToReport(assessment.completed_at, reportCreatedAt)
      }

      await trackReportGenerationCompleted({
        report_id: reportRow.id,
        assessment_id: assessmentId,
        assessment_completed_at: assessment.completed_at || undefined,
        report_created_at: reportCreatedAt,
        time_to_report_seconds: timeToReportSeconds,
        algorithm_version: CURRENT_ALGORITHM_VERSION,
        prompt_version: CURRENT_PROMPT_VERSION,
      })
    } catch (kpiError) {
      // Don't fail the request if KPI tracking fails
      console.error('[stress-report] KPI tracking failed (non-blocking):', kpiError)
    }

    const totalDuration = Date.now() - requestStartTime
    console.log('[stress-report] Request completed successfully', {
      duration: `${totalDuration}ms`,
      assessmentId,
      reportId: reportRow.id,
      stressScore,
      sleepScore,
      riskLevel,
    })

    const response = NextResponse.json({
      report: reportRow,
      scores: {
        stressScore,
        sleepScore,
        riskLevel,
      },
    })

    // Track usage (fire and forget)
    trackUsage('POST /api/amy/stress-report', response)

    return response
  } catch (err: unknown) {
    const totalDuration = Date.now() - requestStartTime
    const error = err as { message?: string }
    console.error('[stress-report] Unerwarteter Fehler', {
      duration: `${totalDuration}ms`,
      error: error?.message ?? String(err),
    })

    // Log structured error for monitoring
    logPatientFlowError({ endpoint: '/api/amy/stress-report', duration: totalDuration }, err)

    // V05-I10.3: Track KPI - Report generation failed
    try {
      const body = await req.json().catch(() => null)
      const assessmentId = body?.assessmentId as string | undefined

      if (assessmentId) {
        await trackReportGenerationFailed({
          assessment_id: assessmentId,
          error_type: error?.message ? 'processing_error' : 'unknown_error',
        })
      }
    } catch (kpiError) {
      // Don't fail the request if KPI tracking fails
      console.error('[stress-report] KPI error tracking failed (non-blocking):', kpiError)
    }

    const response = NextResponse.json(
      {
        error: 'Interner Fehler bei der Erstellung des Reports.',
        message: error?.message ?? String(err),
      },
      { status: 500 },
    )

    // Track usage (fire and forget)
    trackUsage('POST /api/amy/stress-report', response)

    return response
  }
}

type UpsertPatientMeasureResult =
  | { persisted: true }
  | { persisted: false; reason: 'recoverable_error'; step: 'select' | 'insert' | 'update' }

const RECOVERABLE_PATIENT_MEASURE_CODES = new Set(['42P01', '42703'])

function isRecoverablePatientMeasureError(error: PostgrestError | null): boolean {
  if (!error) return false
  if (error.code && RECOVERABLE_PATIENT_MEASURE_CODES.has(error.code)) {
    return true
  }

  const message = error.message?.toLowerCase() ?? ''
  return (
    message.includes('does not exist') ||
    message.includes('undefined table') ||
    message.includes('undefined column') ||
    isLegacyAssessmentIdConstraint(error)
  )
}

function isLegacyAssessmentIdConstraint(error: PostgrestError): boolean {
  if (error.code !== '23502') {
    return false
  }

  const details = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase()
  return details.includes('assessment_id')
}

function handleRecoverablePatientMeasureError(
  step: 'select' | 'insert' | 'update',
  error: PostgrestError,
) {
  console.warn('[stress-report] patient_measures persistence skipped due to recoverable error', {
    step,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  })

  return { persisted: false as const, reason: 'recoverable_error' as const, step }
}

async function upsertPatientMeasure(params: {
  patientId: string
  reportId: string
  stressScore: number | null
  sleepScore: number | null
  riskLevel: RiskLevel | null
}): Promise<UpsertPatientMeasureResult> {
  // Use admin client for patient measures (system operation)
  const supabase = createAdminSupabaseClient()

  const normalizedRisk = params.riskLevel ?? 'pending'

  const payload = {
    patient_id: params.patientId,
    report_id: params.reportId,
    stress_score: params.stressScore,
    sleep_score: params.sleepScore,
    risk_level: normalizedRisk,
  }

  const { data: existing, error: selectError } = await supabase
    .from('patient_measures')
    .select('id')
    .eq('report_id', params.reportId)
    .maybeSingle()

  if (selectError) {
    if (isRecoverablePatientMeasureError(selectError)) {
      return handleRecoverablePatientMeasureError('select', selectError)
    }
    throw selectError
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('patient_measures')
      .update(payload)
      .eq('id', existing.id)

    if (updateError) {
      if (isRecoverablePatientMeasureError(updateError)) {
        return handleRecoverablePatientMeasureError('update', updateError)
      }
      throw updateError
    }
  } else {
    const { error: insertError } = await supabase.from('patient_measures').insert(payload)

    if (insertError) {
      if (isRecoverablePatientMeasureError(insertError)) {
        return handleRecoverablePatientMeasureError('insert', insertError)
      }
      throw insertError
    }
  }

  return { persisted: true }
}
