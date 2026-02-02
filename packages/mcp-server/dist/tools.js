/**
 * E76.1: MCP Tool Schemas
 *
 * Defines Zod schemas for MCP tools ensuring deterministic, type-safe responses.
 * Tools:
 * - get_patient_context(patient_id): Retrieves patient context
 * - run_diagnosis(patient_id, options): Runs diagnostic analysis
 */
import { z } from 'zod';
// ==================== get_patient_context ====================
export const GetPatientContextInputSchema = z.object({
    patient_id: z.string().uuid('patient_id must be a valid UUID'),
});
export const GetPatientContextOutputSchema = z.object({
    patient_id: z.string(),
    demographics: z.object({
        age: z.number().optional(),
        gender: z.string().optional(),
    }),
    recent_assessments: z.array(z.object({
        assessment_id: z.string(),
        funnel_slug: z.string(),
        completed_at: z.string(),
        status: z.string(),
    })),
    active_diagnoses: z.array(z.string()),
    metadata: z.object({
        retrieved_at: z.string(),
        context_version: z.string(),
    }),
});
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
});
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
});
export const MCP_TOOLS = {
    get_patient_context: {
        name: 'get_patient_context',
        description: 'Retrieves comprehensive patient context including demographics, assessments, and diagnoses',
        inputSchema: GetPatientContextInputSchema,
        outputSchema: GetPatientContextOutputSchema,
    },
    run_diagnosis: {
        name: 'run_diagnosis',
        description: 'Executes diagnostic analysis for a patient based on assessment data',
        inputSchema: RunDiagnosisInputSchema,
        outputSchema: RunDiagnosisOutputSchema,
    },
};
//# sourceMappingURL=tools.js.map