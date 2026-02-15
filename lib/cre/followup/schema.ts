import { z } from 'zod'

export const clinicalFollowupQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  why: z.string().min(1),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  source: z.union([
    z.literal('reasoning'),
    z.literal('gap_rule'),
    z.literal('clinician_request'),
  ]),
})

export const clinicalFollowupSchema = z.object({
  next_questions: z.array(clinicalFollowupQuestionSchema),
  queue: z.array(clinicalFollowupQuestionSchema).optional(),
  asked_question_ids: z.array(z.string().min(1)),
  last_generated_at: z.string().min(1),
  lifecycle: z
    .object({
      state: z.union([z.literal('active'), z.literal('needs_review'), z.literal('completed')]),
      completed_question_ids: z.array(z.string().min(1)),
      skipped_question_ids: z.array(z.string().min(1)),
      resumed_at: z.string().nullable().optional(),
      completed_at: z.string().nullable().optional(),
    })
    .optional(),
})

export const validateClinicalFollowup = (value: unknown) => {
  const parsed = clinicalFollowupSchema.safeParse(value)

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.issues.map((issue) => issue.message),
    }
  }

  return {
    ok: true as const,
    errors: [] as string[],
    value: parsed.data,
  }
}
