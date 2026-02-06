/**
 * GET /api/clinician/assessments/[assessmentId]/details
 *
 * E74.8 — Clinician Assessment Run Timeline Details
 *
 * Returns comprehensive assessment details including:
 * - Assessment metadata (funnel, status, timestamps)
 * - All answers with their associated questions
 * - Calculated results (if available)
 * - Reports (if available)
 *
 * RBAC: Requires clinician role
 * RLS: Patients are automatically filtered by organization via RLS
 *
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     assessment: {
 *       id: string
 *       patientId: string
 *       funnelSlug: string
 *       funnelName: string
 *       status: string
 *       startedAt: string
 *       completedAt: string | null
 *     }
 *     answers: [{
 *       id: string
 *       questionId: string
 *       questionText: string
 *       answerValue: number
 *       answerData: any
 *       createdAt: string
 *     }]
 *     result: {
 *       scores: {...}
 *       riskModels: {...}
 *       algorithmVersion: string
 *       computedAt: string
 *     } | null
 *     report: {
 *       scoreNumeric: number
 *       sleepScore: number
 *       riskLevel: string
 *       reportTextShort: string
 *     } | null
 *   }
 * }
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

// Type definitions for Supabase joined query responses
type FunnelData = {
  slug?: string
  title?: string
} | null

type QuestionData = {
  id?: string
  question_text?: string
  question_type?: string
} | null
export async function GET(
  request: Request,
  context: { params: Promise<{ assessmentId: string }> },
) {
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Nicht angemeldet.' },
      },
      { status: 401 },
    )
  }

  // Check clinician role
  const userRole = user.app_metadata?.role
  const allowedRoles = ['clinician', 'admin', 'nurse']
  
  if (!allowedRoles.includes(userRole)) {
    console.warn('[clinician/assessments/details] Access denied - not a clinician', {
      userId: user.id,
      role: userRole,
    })
    return NextResponse.json(
      {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Zugriff verweigert. Nur für Kliniker:innen.' },
      },
      { status: 403 },
    )
  }

  const { assessmentId } = await context.params

  if (!assessmentId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'MISSING_PARAM', message: 'assessmentId is required' },
      },
      { status: 400 },
    )
  }

  try {
    // Fetch assessment metadata with funnel info
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(
        `
        id,
        patient_id,
        funnel,
        funnel_id,
        status,
        started_at,
        completed_at,
        funnels (
          slug,
          title
        )
      `,
      )
      .eq('id', assessmentId)
      .single()

    if (assessmentError) {
      console.error('[clinician/assessments/details] Assessment query error:', assessmentError)
      return NextResponse.json(
        {
          success: true,
          data: null,
        },
        { status: 200 },
      )
    }

    // Fetch answers with question details
    const { data: answersData, error: answersError } = await supabase
      .from('assessment_answers')
      .select(
        `
        id,
        question_id,
        answer_value,
        answer_data,
        created_at,
        questions (
          id,
          question_text,
          question_type
        )
      `,
      )
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true })

    if (answersError) {
      console.error('[clinician/assessments/details] Answers query error:', answersError)
      // Continue without answers rather than failing completely
    }

    // Fetch calculated results (if available)
    const { data: resultData, error: resultError } = await supabase
      .from('calculated_results')
      .select('id, scores, risk_models, algorithm_version, computed_at')
      .eq('assessment_id', assessmentId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (resultError && resultError.code !== 'PGRST116') {
      console.error('[clinician/assessments/details] Results query error:', resultError)
    }

    // Fetch report (if available)
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select('score_numeric, sleep_score, risk_level, report_text_short')
      .eq('assessment_id', assessmentId)
      .maybeSingle()

    if (reportError && reportError.code !== 'PGRST116') {
      console.error('[clinician/assessments/details] Report query error:', reportError)
    }

    // Transform answers data
    const answers = (answersData || []).map((answer) => {
      const questionData = answer.questions as QuestionData
      return {
        id: answer.id,
        questionId: answer.question_id,
        questionText: questionData?.question_text || 'Frage nicht verfügbar',
        questionType: questionData?.question_type || null,
        answerValue: answer.answer_value,
        answerData: answer.answer_data,
        createdAt: answer.created_at,
      }
    })

    // Transform assessment data
    const funnelData = assessment.funnels as FunnelData
    const transformedAssessment = {
      id: assessment.id,
      patientId: assessment.patient_id,
      funnelSlug: assessment.funnel || funnelData?.slug || null,
      funnelName: funnelData?.title || assessment.funnel || 'Unbekannt',
      status: assessment.status,
      startedAt: assessment.started_at,
      completedAt: assessment.completed_at,
    }

    // Transform result data
    const result = resultData
      ? {
          scores: resultData.scores || {},
          riskModels: resultData.risk_models || null,
          algorithmVersion: resultData.algorithm_version,
          computedAt: resultData.computed_at,
        }
      : null

    // Transform report data
    const report = reportData
      ? {
          scoreNumeric: reportData.score_numeric,
          sleepScore: reportData.sleep_score,
          riskLevel: reportData.risk_level,
          reportTextShort: reportData.report_text_short,
        }
      : null

    return NextResponse.json({
      success: true,
      data: {
        assessment: transformedAssessment,
        answers,
        result,
        report,
      },
    })
  } catch (err) {
    console.error('[clinician/assessments/details] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Unerwarteter Fehler.' },
      },
      { status: 500 },
    )
  }
}
