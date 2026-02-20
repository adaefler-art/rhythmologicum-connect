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
  objective_id: z.string().min(1).optional(),
})

export const clinicalFollowupObjectiveSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  field_path: z.string().min(1),
  status: z.union([
    z.literal('missing'),
    z.literal('unclear'),
    z.literal('resolved'),
    z.literal('answered'),
    z.literal('verified'),
    z.literal('blocked_by_safety'),
  ]),
  rationale: z.string().min(1),
})

export const clinicalFollowupSchema = z.object({
  next_questions: z.array(clinicalFollowupQuestionSchema),
  queue: z.array(clinicalFollowupQuestionSchema).optional(),
  asked_question_ids: z.array(z.string().min(1)),
  last_generated_at: z.string().min(1),
  objectives: z.array(clinicalFollowupObjectiveSchema).optional(),
  active_objective_ids: z.array(z.string().min(1)).optional(),
  objective_state_overrides: z
    .record(
      z.string(),
      z.union([z.literal('missing'), z.literal('unclear'), z.literal('resolved')]),
    )
    .optional(),
  correction_journal: z
    .array(
      z.object({
        id: z.string().min(1),
        created_at: z.string().min(1),
        type: z.union([
          z.literal('medication_missing'),
          z.literal('medication_incorrect'),
          z.literal('history_missing'),
          z.literal('symptom_timeline'),
          z.literal('free_text'),
        ]),
        source_context: z.union([
          z.literal('status_page'),
          z.literal('chat'),
          z.literal('followup'),
        ]),
        message_excerpt: z.string().optional(),
        answer_classification: z.string().optional(),
        asked_question_id: z.string().optional(),
      }),
    )
    .optional(),
  readiness: z
    .object({
      state: z.union([
        z.literal('SafetyReady'),
        z.literal('VisitReady'),
        z.literal('ProblemReady'),
        z.literal('ProgramReady'),
      ]),
      uc2_triggered: z.boolean(),
      uc2_trigger_reasons: z.array(
        z.union([
          z.literal('symptom_duration_gte_12_weeks'),
          z.literal('multiple_symptom_clusters'),
          z.literal('chronic_condition_signal'),
          z.literal('explicit_clinician_requirement'),
        ]),
      ),
    })
    .optional(),
  program_readiness: z
    .object({
      is_program_ready: z.boolean(),
      readiness_state: z.union([
        z.literal('SafetyReady'),
        z.literal('VisitReady'),
        z.literal('ProblemReady'),
        z.literal('ProgramReady'),
      ]),
      lifecycle_state: z.union([
        z.literal('active'),
        z.literal('needs_review'),
        z.literal('completed'),
      ]),
      active_block_id: z.string().nullable(),
      open_block_ids: z.array(z.string().min(1)),
      completed_block_ids: z.array(z.string().min(1)),
      generated_at: z.string().min(1),
    })
    .optional(),
  lifecycle: z
    .object({
      state: z.union([z.literal('active'), z.literal('needs_review'), z.literal('completed')]),
      completed_question_ids: z.array(z.string().min(1)),
      skipped_question_ids: z.array(z.string().min(1)),
      resumed_at: z.string().nullable().optional(),
      completed_at: z.string().nullable().optional(),
      savepoints: z
        .array(
          z.object({
            block_id: z.string().min(1),
            status: z.union([z.literal('in_progress'), z.literal('completed')]),
            total_objective_ids: z.array(z.string().min(1)),
            completed_objective_ids: z.array(z.string().min(1)),
            updated_at: z.string().min(1),
          }),
        )
        .optional(),
      active_block_id: z.string().nullable().optional(),
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
