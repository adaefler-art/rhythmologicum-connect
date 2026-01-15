/**
 * E6.4.9: Pilot KPIs Endpoint
 * 
 * GET /api/admin/pilot/kpis
 * 
 * Returns aggregated metrics for pilot-relevant routes and operations:
 * - Funnel starts/completes (from pilot_flow_events)
 * - Review decisions (from review_records)
 * - Support case volume (from support_cases)
 * 
 * Auth: admin/clinician only
 */

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { getCorrelationId } from '@/lib/telemetry/correlationId'

interface PilotKPIs {
  funnelMetrics: {
    totalStarts: number
    totalCompletes: number
    completionRate: number
    byFunnelSlug: Record<string, { starts: number; completes: number; completionRate: number }>
  }
  reviewMetrics: {
    totalReviews: number
    approved: number
    rejected: number
    changesRequested: number
    pending: number
  }
  supportCaseMetrics: {
    totalCases: number
    open: number
    inProgress: number
    resolved: number
    closed: number
    escalated: number
  }
  workupMetrics: {
    totalWorkups: number
    needsMoreData: number
    readyForReview: number
  }
}

/**
 * GET /api/admin/pilot/kpis
 * 
 * Query parameters:
 * - since: ISO timestamp - filter events after this date (optional)
 * - until: ISO timestamp - filter events before this date (optional)
 */
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request)

  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse('Authentifizierung fehlgeschlagen.', correlationId)
    }

    // Check role: admin or clinician only
    const userRole = user.app_metadata?.role
    if (userRole !== 'admin' && userRole !== 'clinician') {
      console.warn('[PILOT-KPI] Unauthorized access attempt', {
        userId: user.id,
        role: userRole,
        correlationId,
      })
      return forbiddenResponse('Zugriff verweigert.', correlationId)
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since') || undefined
    const until = searchParams.get('until') || undefined

    // Build funnel metrics from pilot_flow_events
    const funnelMetrics = await buildFunnelMetrics(supabase, since, until)

    // Build review metrics from review_records
    const reviewMetrics = await buildReviewMetrics(supabase, since, until)

    // Build support case metrics
    const supportCaseMetrics = await buildSupportCaseMetrics(supabase, since, until)

    // Build workup metrics from pilot_flow_events
    const workupMetrics = await buildWorkupMetrics(supabase, since, until)

    const kpis: PilotKPIs = {
      funnelMetrics,
      reviewMetrics,
      supportCaseMetrics,
      workupMetrics,
    }

    return successResponse(
      {
        kpis,
        generatedAt: new Date().toISOString(),
        filters: { since, until },
      },
      200,
      correlationId,
    )
  } catch (error) {
    console.error('[PILOT-KPI] Exception in pilot KPIs endpoint', {
      error: error instanceof Error ? error.message : String(error),
      correlationId,
    })
    return internalErrorResponse('Interner Fehler.', correlationId)
  }
}

/**
 * Build funnel metrics from pilot_flow_events table
 */
async function buildFunnelMetrics(
  supabase: any,
  since?: string,
  until?: string,
): Promise<PilotKPIs['funnelMetrics']> {
  let query = supabase
    .from('pilot_flow_events')
    .select('event_type, payload_json')
    .in('event_type', ['FUNNEL_STARTED', 'FUNNEL_COMPLETED'])

  if (since) {
    query = query.gte('created_at', since)
  }
  if (until) {
    query = query.lte('created_at', until)
  }

  const { data, error } = await query

  if (error) {
    console.error('[PILOT-KPI] Failed to fetch funnel events', error)
    throw new Error('Failed to fetch funnel metrics')
  }

  const events = data || []
  
  // Count starts and completes globally
  const totalStarts = events.filter((e: any) => e.event_type === 'FUNNEL_STARTED').length
  const totalCompletes = events.filter((e: any) => e.event_type === 'FUNNEL_COMPLETED').length
  const completionRate = totalStarts > 0 ? Math.round((totalCompletes / totalStarts) * 100) : 0

  // Group by funnel slug
  const bySlug: Record<string, { starts: number; completes: number }> = {}

  events.forEach((e: any) => {
    const slug = e.payload_json?.funnelSlug || 'unknown'
    if (!bySlug[slug]) {
      bySlug[slug] = { starts: 0, completes: 0 }
    }
    if (e.event_type === 'FUNNEL_STARTED') {
      bySlug[slug].starts += 1
    } else if (e.event_type === 'FUNNEL_COMPLETED') {
      bySlug[slug].completes += 1
    }
  })

  // Calculate completion rates per slug
  const byFunnelSlug: Record<string, { starts: number; completes: number; completionRate: number }> = {}
  Object.entries(bySlug).forEach(([slug, counts]) => {
    byFunnelSlug[slug] = {
      starts: counts.starts,
      completes: counts.completes,
      completionRate: counts.starts > 0 ? Math.round((counts.completes / counts.starts) * 100) : 0,
    }
  })

  return {
    totalStarts,
    totalCompletes,
    completionRate,
    byFunnelSlug,
  }
}

/**
 * Build review metrics from review_records table
 */
async function buildReviewMetrics(
  supabase: any,
  since?: string,
  until?: string,
): Promise<PilotKPIs['reviewMetrics']> {
  let query = supabase.from('review_records').select('status, decided_at')

  if (since) {
    query = query.gte('created_at', since)
  }
  if (until) {
    query = query.lte('created_at', until)
  }

  const { data, error } = await query

  if (error) {
    console.error('[PILOT-KPI] Failed to fetch review records', error)
    throw new Error('Failed to fetch review metrics')
  }

  const reviews = data || []

  const totalReviews = reviews.length
  const approved = reviews.filter((r: any) => r.status === 'APPROVED').length
  const rejected = reviews.filter((r: any) => r.status === 'REJECTED').length
  const changesRequested = reviews.filter((r: any) => r.status === 'CHANGES_REQUESTED').length
  const pending = reviews.filter((r: any) => r.status === 'PENDING').length

  return {
    totalReviews,
    approved,
    rejected,
    changesRequested,
    pending,
  }
}

/**
 * Build support case metrics from support_cases table
 */
async function buildSupportCaseMetrics(
  supabase: any,
  since?: string,
  until?: string,
): Promise<PilotKPIs['supportCaseMetrics']> {
  let query = supabase.from('support_cases').select('status, escalated_task_id')

  if (since) {
    query = query.gte('created_at', since)
  }
  if (until) {
    query = query.lte('created_at', until)
  }

  const { data, error } = await query

  if (error) {
    console.error('[PILOT-KPI] Failed to fetch support cases', error)
    throw new Error('Failed to fetch support case metrics')
  }

  const cases = data || []

  const totalCases = cases.length
  const open = cases.filter((c: any) => c.status === 'OPEN').length
  const inProgress = cases.filter((c: any) => c.status === 'IN_PROGRESS').length
  const resolved = cases.filter((c: any) => c.status === 'RESOLVED').length
  const closed = cases.filter((c: any) => c.status === 'CLOSED').length
  const escalated = cases.filter((c: any) => c.escalated_task_id !== null).length

  return {
    totalCases,
    open,
    inProgress,
    resolved,
    closed,
    escalated,
  }
}

/**
 * Build workup metrics from pilot_flow_events table
 */
async function buildWorkupMetrics(
  supabase: any,
  since?: string,
  until?: string,
): Promise<PilotKPIs['workupMetrics']> {
  let query = supabase
    .from('pilot_flow_events')
    .select('event_type')
    .in('event_type', ['WORKUP_STARTED', 'WORKUP_NEEDS_MORE_DATA', 'WORKUP_READY_FOR_REVIEW'])

  if (since) {
    query = query.gte('created_at', since)
  }
  if (until) {
    query = query.lte('created_at', until)
  }

  const { data, error } = await query

  if (error) {
    console.error('[PILOT-KPI] Failed to fetch workup events', error)
    throw new Error('Failed to fetch workup metrics')
  }

  const events = data || []

  const totalWorkups = events.filter((e: any) => e.event_type === 'WORKUP_STARTED').length
  const needsMoreData = events.filter((e: any) => e.event_type === 'WORKUP_NEEDS_MORE_DATA').length
  const readyForReview = events.filter((e: any) => e.event_type === 'WORKUP_READY_FOR_REVIEW').length

  return {
    totalWorkups,
    needsMoreData,
    readyForReview,
  }
}
