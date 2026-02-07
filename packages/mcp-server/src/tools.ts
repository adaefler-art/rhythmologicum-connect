/**
 * E76.1: MCP Tool Schemas
 * E76.2: Updated get_patient_context with full context pack structure
 * 
 * Defines Zod schemas for MCP tools ensuring deterministic, type-safe responses.
 * Tools:
 * - get_patient_context(patient_id): Retrieves comprehensive patient context pack
 * - run_diagnosis(patient_id, options): Runs diagnostic analysis
 */

import { z } from 'zod'

// ==================== get_patient_context ====================

export const GetPatientContextInputSchema = z.object({
  patient_id: z.string().uuid('patient_id must be a valid UUID'),
})

export type GetPatientContextInput = z.infer<typeof GetPatientContextInputSchema>

export const GetPatientContextOutputSchema = z.object({
  patient_id: z.string(),
  demographics: z.object({
    age: z.number().optional(),
    gender: z.string().optional(),
  }),
  anamnesis: z.object({
    entries: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.record(z.string(), z.unknown()),
        entry_type: z.string().nullable(),
        tags: z.array(z.string()),
        created_at: z.string(),
        updated_at: z.string(),
      }),
    ),
    total_count: z.number(),
    limited_to: z.number(),
  }),
  funnel_runs: z.object({
    runs: z.array(
      z.object({
        assessment_id: z.string(),
        funnel_slug: z.string(),
        funnel_name: z.string(),
        started_at: z.string(),
        completed_at: z.string().nullable(),
        status: z.string(),
        answers: z.array(
          z.object({
            question_id: z.string(),
            question_label: z.string(),
            answer_value: z.unknown(),
          }),
        ),
        result: z
          .object({
            scores: z.record(z.string(), z.unknown()),
            risk_models: z.record(z.string(), z.unknown()),
            algorithm_version: z.string(),
          })
          .nullable(),
      }),
    ),
    total_count: z.number(),
    limit_per_funnel: z.number(),
  }),
  current_measures: z
    .object({
      stress_score: z.number().optional(),
      sleep_score: z.number().optional(),
      risk_level: z.string().optional(),
    })
    .nullable(),
  metadata: z.object({
    retrieved_at: z.string(),
    context_version: z.string(),
    inputs_hash: z.string(),
  }),
})

export type GetPatientContextOutput = z.infer<typeof GetPatientContextOutputSchema>

// ==================== run_diagnosis ====================

export const RunDiagnosisInputSchema = z.object({
  patient_id: z.string().uuid('patient_id must be a valid UUID'),
  options: z
    .object({
      assessment_id: z.string().optional(),
      include_history: z.boolean().optional(),
      max_history_depth: z.number().int().positive().optional(),
    })
    .optional(),
})

export type RunDiagnosisInput = z.infer<typeof RunDiagnosisInputSchema>

export const RunDiagnosisOutputSchema = z.object({
  run_id: z.string(),
  patient_id: z.string(),
  diagnosis_result: z.object({
    primary_findings: z.array(z.string()),
    risk_level: z.enum(['low', 'medium', 'high', 'critical']),
    recommendations: z.array(z.string()),
    confidence_score: z.number().min(0).max(1),
  }),
  metadata: z.object({
    run_version: z.string(),
    prompt_version: z.string(),
    executed_at: z.string(),
    processing_time_ms: z.number(),
  }),
})

export type RunDiagnosisOutput = z.infer<typeof RunDiagnosisOutputSchema>

// ==================== Tool Registry ====================

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string
  description: string
  inputSchema: z.ZodType<TInput>
  outputSchema: z.ZodType<TOutput>
}

export const MCP_TOOLS = {
  get_patient_context: {
    name: 'get_patient_context',
    description:
      'Retrieves comprehensive patient context pack including demographics, anamnesis entries (max 30), funnel runs (max 2 per funnel), assessment results, and current measures with stable inputs_hash',
    inputSchema: GetPatientContextInputSchema,
    outputSchema: GetPatientContextOutputSchema,
  } as ToolDefinition<GetPatientContextInput, GetPatientContextOutput>,

  run_diagnosis: {
    name: 'run_diagnosis',
    description: 'Executes diagnostic analysis for a patient based on assessment data',
    inputSchema: RunDiagnosisInputSchema,
    outputSchema: RunDiagnosisOutputSchema,
  } as ToolDefinition<RunDiagnosisInput, RunDiagnosisOutput>,
}

export type MCPToolName = keyof typeof MCP_TOOLS
