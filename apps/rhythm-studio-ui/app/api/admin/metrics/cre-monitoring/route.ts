import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import {
  databaseErrorResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

type EventType =
  | 'followup_question_shown'
  | 'followup_answered'
  | 'upload_requested'
  | 'upload_received'
  | 'hard_stop_triggered'

type EventRow = { created_at: string; event_type: EventType }
type ReviewRow = { created_at: string; status: string }
type QueryError = { message: string } | null

type ThresholdRow = {
  id: string
  kpi_key: string
  warning_threshold: number | null
  critical_threshold: number | null
  notify_on_breach: boolean | null
  is_active: boolean | null
}

const DEFAULT_DAYS = 7
const ALLOWED_DAYS = new Set([7, 30])

const toRate = (num: number, den: number) => {
  if (!den || den <= 0) return 0
  return Number((num / den).toFixed(4))
}

const evaluateThreshold = (params: {
  kpiKey: string
  value: number
  threshold: ThresholdRow | null
}) => {
  const threshold = params.threshold
  if (!threshold || threshold.notify_on_breach === false) {
    return {
      severity: 'ok' as const,
      message: 'No active threshold configured',
    }
  }

  const warning = threshold.warning_threshold
  const critical = threshold.critical_threshold
  const value = params.value

  if (critical !== null && value >= critical) {
    return {
      severity: 'critical' as const,
      message: `${params.kpiKey} exceeds critical threshold (${value} >= ${critical})`,
    }
  }

  if (warning !== null && value >= warning) {
    return {
      severity: 'warning' as const,
      message: `${params.kpiKey} exceeds warning threshold (${value} >= ${warning})`,
    }
  }

  return {
    severity: 'ok' as const,
    message: `${params.kpiKey} within configured thresholds`,
  }
}

export async function GET(request: Request) {
  const { user: _user, error } = await requireAdminOrClinicianRole()
  if (error || !_user) {
    return error ?? unauthorizedResponse()
  }

  const url = new URL(request.url)
  const daysRaw = Number(url.searchParams.get('days') ?? DEFAULT_DAYS)
  const days = Number.isFinite(daysRaw) ? Math.trunc(daysRaw) : DEFAULT_DAYS

  if (!ALLOWED_DAYS.has(days)) {
    return validationErrorResponse('days must be 7 or 30')
  }

  try {
    const admin = createAdminSupabaseClient()
    const startIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [eventsResult, reviewsResult, thresholdsResult] = await Promise.all([
      admin
        .from('patient_events' as never)
        .select('created_at, event_type')
        .gte('created_at', startIso),
      admin
        .from('clinical_intake_reviews')
        .select('created_at, status')
        .gte('created_at', startIso),
      admin
        .from('kpi_thresholds' as never)
        .select('id, kpi_key, warning_threshold, critical_threshold, notify_on_breach, is_active')
        .eq('is_active', true),
    ])

    const typedEvents = eventsResult as unknown as { data: EventRow[] | null; error: QueryError }
    const typedReviews = reviewsResult as unknown as { data: ReviewRow[] | null; error: QueryError }
    const typedThresholds = thresholdsResult as unknown as {
      data: ThresholdRow[] | null
      error: QueryError
    }

    if (typedEvents.error || typedReviews.error || typedThresholds.error) {
      console.error('[admin/metrics/cre-monitoring] query failed', {
        eventsError: typedEvents.error?.message,
        reviewsError: typedReviews.error?.message,
        thresholdsError: typedThresholds.error?.message,
      })
      return databaseErrorResponse('Failed to load CRE monitoring metrics.')
    }

    const events = typedEvents.data ?? []
    const reviews = typedReviews.data ?? []
    const thresholds = typedThresholds.data ?? []

    const followupShown = events.filter((row) => row.event_type === 'followup_question_shown').length
    const followupAnswered = events.filter((row) => row.event_type === 'followup_answered').length
    const uploadRequested = events.filter((row) => row.event_type === 'upload_requested').length
    const uploadReceived = events.filter((row) => row.event_type === 'upload_received').length
    const hardStops = events.filter((row) => row.event_type === 'hard_stop_triggered').length
    const approved = reviews.filter((row) => row.status === 'approved').length

    const metrics = {
      cre_followup_yield: toRate(followupAnswered, followupShown),
      cre_upload_completion_rate: toRate(uploadReceived, uploadRequested),
      cre_hard_stop_rate: toRate(hardStops, Math.max(1, reviews.length)),
      cre_review_approval_rate: toRate(approved, reviews.length),
    }

    const findThreshold = (kpiKey: string) => thresholds.find((entry) => entry.kpi_key === kpiKey) ?? null

    const alerts = Object.entries(metrics).map(([kpiKey, value]) => {
      const evaluation = evaluateThreshold({
        kpiKey,
        value,
        threshold: findThreshold(kpiKey),
      })

      return {
        kpi_key: kpiKey,
        value,
        severity: evaluation.severity,
        message: evaluation.message,
      }
    })

    return successResponse({
      window_days: days,
      metrics,
      alerts,
      generated_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[admin/metrics/cre-monitoring] unexpected error', err)
    return databaseErrorResponse('Failed to load CRE monitoring metrics.')
  }
}
