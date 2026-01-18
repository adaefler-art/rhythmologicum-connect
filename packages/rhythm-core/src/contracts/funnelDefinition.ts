/**
 * Rhythm Core - Funnel Definition Contract (v1)
 */

import { z } from 'zod'

export const FunnelQuestionOptionSchema = z.object({
  value: z.union([z.string(), z.number()]),
  label: z.string(),
})

export const FunnelQuestionSchema = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string(),
  helpText: z.string().nullable(),
  questionType: z.string(),
  minValue: z.number().nullable(),
  maxValue: z.number().nullable(),
  isRequired: z.boolean(),
  orderIndex: z.number().int().nonnegative(),
  options: z.array(FunnelQuestionOptionSchema).optional().nullable(),
})

export const FunnelBaseStepSchema = z.object({
  id: z.string(),
  orderIndex: z.number().int().nonnegative(),
  title: z.string(),
  description: z.string().nullable(),
  type: z.string(),
})

export const FunnelQuestionStepSchema = FunnelBaseStepSchema.extend({
  type: z.string(),
  questions: z.array(FunnelQuestionSchema),
})

export const FunnelStepSchema = z.union([FunnelQuestionStepSchema, FunnelBaseStepSchema])

export const FunnelDefinitionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  theme: z.string().nullable(),
  steps: z.array(FunnelStepSchema),
  totalSteps: z.number().int().nonnegative(),
  totalQuestions: z.number().int().nonnegative(),
  isActive: z.boolean(),
})

export type FunnelDefinition = z.infer<typeof FunnelDefinitionSchema>
