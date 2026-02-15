import { z } from 'zod'

export const CLINICAL_INTAKE_REVIEW_STATUSES = [
  'draft',
  'in_review',
  'approved',
  'needs_more_info',
  'rejected',
] as const

export const ClinicalIntakeReviewStatusSchema = z.enum(CLINICAL_INTAKE_REVIEW_STATUSES)

export type ClinicalIntakeReviewStatus = z.infer<typeof ClinicalIntakeReviewStatusSchema>

const ALLOWED_REVIEW_TRANSITIONS: Record<
  ClinicalIntakeReviewStatus | 'none',
  ClinicalIntakeReviewStatus[]
> = {
  none: ['draft', 'in_review'],
  draft: ['draft', 'in_review'],
  in_review: ['in_review', 'needs_more_info', 'approved', 'rejected'],
  needs_more_info: ['needs_more_info', 'in_review'],
  approved: ['approved'],
  rejected: ['rejected'],
}

export const getAllowedClinicalIntakeReviewTransitions = (
  fromStatus: ClinicalIntakeReviewStatus | null,
) => ALLOWED_REVIEW_TRANSITIONS[fromStatus ?? 'none']

export const isAllowedClinicalIntakeReviewTransition = (params: {
  fromStatus: ClinicalIntakeReviewStatus | null
  toStatus: ClinicalIntakeReviewStatus
}) => getAllowedClinicalIntakeReviewTransitions(params.fromStatus).includes(params.toStatus)

const RequestedItemsSchema = z
  .array(z.string().trim().min(1))
  .transform((items) => items.map((item) => item.trim()).filter(Boolean))

export const ClinicalIntakeReviewInputSchema = z.object({
  status: ClinicalIntakeReviewStatusSchema,
  review_notes: z.string().trim().optional(),
  requested_items: RequestedItemsSchema.optional(),
})

export type ClinicalIntakeReviewInput = z.infer<typeof ClinicalIntakeReviewInputSchema>

export const validateClinicalIntakeReviewInput = (input: unknown) => {
  const parsed = ClinicalIntakeReviewInputSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false as const,
      message: 'Invalid review payload.',
      issues: parsed.error.issues,
    }
  }

  const reviewNotes = parsed.data.review_notes?.trim() || ''
  const requestedItems = parsed.data.requested_items ?? []

  if (parsed.data.status === 'needs_more_info' && requestedItems.length === 0) {
    return {
      ok: false as const,
      message: 'requested_items must contain at least one item for needs_more_info.',
      issues: [
        {
          code: 'custom',
          path: ['requested_items'],
          message: 'At least one requested item is required.',
        },
      ],
    }
  }

  if (
    (parsed.data.status === 'approved' || parsed.data.status === 'rejected') &&
    reviewNotes.length === 0
  ) {
    return {
      ok: false as const,
      message: 'review_notes are required for approved/rejected decisions.',
      issues: [
        {
          code: 'custom',
          path: ['review_notes'],
          message: 'Review notes are required.',
        },
      ],
    }
  }

  return {
    ok: true as const,
    data: {
      status: parsed.data.status,
      review_notes: reviewNotes.length > 0 ? reviewNotes : null,
      requested_items: requestedItems.length > 0 ? requestedItems : null,
    },
  }
}
