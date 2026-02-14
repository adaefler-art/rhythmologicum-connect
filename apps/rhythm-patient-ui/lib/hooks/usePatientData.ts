'use client'

import { useEffect, useMemo, useState } from 'react'

export type ReviewStatus = 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'

type IntakeLatestResponse = {
  success: boolean
  intake: {
    version_number: number
    updated_at: string
    structured_data?: {
      safety?: {
        effective_policy_result?: {
          escalation_level?: string | null
          level?: string | null
        }
      }
      followup?: {
        next_questions?: unknown[]
      }
    }
    review_state?: {
      status: ReviewStatus
      requested_items: string[] | null
    } | null
  } | null
}

type ReviewStatusResponse = {
  success: boolean
  review: {
    status: ReviewStatus
    requested_items: string[]
    updated_at: string
  } | null
}

export function usePatientData() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intake, setIntake] = useState<IntakeLatestResponse['intake']>(null)
  const [review, setReview] = useState<ReviewStatusResponse['review']>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const [intakeResponse, reviewResponse] = await Promise.all([
          fetch('/api/patient/intake/latest', { cache: 'no-store' }),
          fetch('/api/patient/review/status', { cache: 'no-store' }),
        ])

        const intakeJson = (await intakeResponse.json()) as IntakeLatestResponse
        const reviewJson = (await reviewResponse.json()) as ReviewStatusResponse

        if (!active) return

        if (!intakeResponse.ok || !intakeJson.success) {
          throw new Error('Intake konnte nicht geladen werden.')
        }

        const safeReview =
          reviewResponse.ok && reviewJson.success
            ? reviewJson.review
            : intakeJson.intake?.review_state
              ? {
                  status: intakeJson.intake.review_state.status,
                  requested_items: Array.isArray(intakeJson.intake.review_state.requested_items)
                    ? intakeJson.intake.review_state.requested_items
                    : [],
                  updated_at: intakeJson.intake.updated_at,
                }
              : null

        setIntake(intakeJson.intake)
        setReview(safeReview)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Dashboard konnte nicht geladen werden.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const openFollowupCount = useMemo(() => {
    const raw = intake?.structured_data?.followup?.next_questions
    return Array.isArray(raw) ? raw.length : 0
  }, [intake])

  return {
    loading,
    error,
    intake,
    review,
    openFollowupCount,
  }
}
