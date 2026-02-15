import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import {
  databaseErrorResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

type EventType =
  | 'session_start'
  | 'session_end'
  | 'followup_question_shown'
  | 'followup_answered'
  | 'followup_skipped'
  | 'intake_regen_triggered'
  | 'hard_stop_triggered'
  | 'override_set'
  | 'review_created'
  | 'upload_requested'
  | 'upload_received'

type IntakeRow = { created_at: string }
type ReviewRow = { created_at: string; status: string }
type EventRow = { created_at: string; event_type: EventType }
type QueryError = { message: string } | null

const DEFAULT_DAYS = 7
const ALLOWED_DAYS = new Set([7, 30])

const toDayKey = (isoDate: string) => isoDate.slice(0, 10)

const createDayRange = (days: number, now: Date) => {
  const entries: string[] = []
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  start.setUTCDate(start.getUTCDate() - (days - 1))

  for (let index = 0; index < days; index += 1) {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    entries.push(date.toISOString().slice(0, 10))
  }

  return {
    startIso: start.toISOString(),
    dayKeys: entries,
  }
}

const toRate = (num: number, den: number) => {
  if (!den || den <= 0) return 0
  return Number((num / den).toFixed(4))
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
    const now = new Date()
    const { startIso, dayKeys } = createDayRange(days, now)

    const [intakesResult, reviewsResult, eventsResult] = await Promise.all([
      admin
        .from('clinical_intakes')
        .select('created_at')
        .gte('created_at', startIso)
        .order('created_at', { ascending: true }),
      admin
        .from('clinical_intake_reviews')
        .select('created_at, status')
        .gte('created_at', startIso)
        .order('created_at', { ascending: true }),
      admin
        .from('patient_events' as never)
        .select('created_at, event_type')
        .gte('created_at', startIso)
        .order('created_at', { ascending: true }),
    ])

    const typedIntakesResult = intakesResult as unknown as {
      data: IntakeRow[] | null
      error: QueryError
    }
    const typedReviewsResult = reviewsResult as unknown as {
      data: ReviewRow[] | null
      error: QueryError
    }
    const typedEventsResult = eventsResult as unknown as {
      data: EventRow[] | null
      error: QueryError
    }

    if (typedIntakesResult.error || typedReviewsResult.error || typedEventsResult.error) {
      console.error('[admin/metrics] query failed', {
        intakesError: typedIntakesResult.error?.message,
        reviewsError: typedReviewsResult.error?.message,
        eventsError: typedEventsResult.error?.message,
      })
      return databaseErrorResponse('Failed to load metrics.')
    }

    const intakes = typedIntakesResult.data ?? []
    const reviews = typedReviewsResult.data ?? []
    const events = typedEventsResult.data ?? []

    const approvedCount = reviews.filter((row) => row.status === 'approved').length
    const hardStops = events.filter((row) => row.event_type === 'hard_stop_triggered').length
    const overrides = events.filter((row) => row.event_type === 'override_set').length
    const followupShown = events.filter((row) => row.event_type === 'followup_question_shown').length
    const followupAnswered = events.filter((row) => row.event_type === 'followup_answered').length
    const uploadRequested = events.filter((row) => row.event_type === 'upload_requested').length
    const uploadReceived = events.filter((row) => row.event_type === 'upload_received').length

    const byDayMap = new Map<
      string,
      {
        date: string
        intakes: number
        reviews: number
        hard_stops: number
        overrides: number
        followup_shown: number
        followup_answered: number
      }
    >(
      dayKeys.map((date) => [
        date,
        {
          date,
          intakes: 0,
          reviews: 0,
          hard_stops: 0,
          overrides: 0,
          followup_shown: 0,
          followup_answered: 0,
        },
      ]),
    )

    for (const row of intakes) {
      const day = toDayKey(row.created_at)
      const entry = byDayMap.get(day)
      if (entry) entry.intakes += 1
    }

    for (const row of reviews) {
      const day = toDayKey(row.created_at)
      const entry = byDayMap.get(day)
      if (entry) entry.reviews += 1
    }

    for (const row of events) {
      const day = toDayKey(row.created_at)
      const entry = byDayMap.get(day)
      if (!entry) continue

      if (row.event_type === 'hard_stop_triggered') entry.hard_stops += 1
      if (row.event_type === 'override_set') entry.overrides += 1
      if (row.event_type === 'followup_question_shown') entry.followup_shown += 1
      if (row.event_type === 'followup_answered') entry.followup_answered += 1
    }

    return successResponse({
      totals: {
        intakes_total: intakes.length,
        reviews_total: reviews.length,
        approved_rate: toRate(approvedCount, reviews.length),
        hard_stop_rate: toRate(hardStops, intakes.length),
        override_rate: toRate(overrides, intakes.length),
        followup_yield: toRate(followupAnswered, followupShown),
        upload_completion_rate: toRate(uploadReceived, uploadRequested),
      },
      timeseries: {
        by_day: dayKeys.map((date) => byDayMap.get(date)!),
      },
    })
  } catch (err) {
    console.error('[admin/metrics] unexpected error', err)
    return databaseErrorResponse('Failed to load metrics.')
  }
}
