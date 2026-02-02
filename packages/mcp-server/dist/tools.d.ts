/**
 * E76.1: MCP Tool Schemas
 *
 * Defines Zod schemas for MCP tools ensuring deterministic, type-safe responses.
 * Tools:
 * - get_patient_context(patient_id): Retrieves patient context
 * - run_diagnosis(patient_id, options): Runs diagnostic analysis
 */
import { z } from 'zod';
export declare const GetPatientContextInputSchema: z.ZodObject<{
    patient_id: z.ZodString;
}, z.core.$strip>;
export type GetPatientContextInput = z.infer<typeof GetPatientContextInputSchema>;
export declare const GetPatientContextOutputSchema: z.ZodObject<{
    patient_id: z.ZodString;
    demographics: z.ZodObject<{
        age: z.ZodOptional<z.ZodNumber>;
        gender: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    recent_assessments: z.ZodArray<z.ZodObject<{
        assessment_id: z.ZodString;
        funnel_slug: z.ZodString;
        completed_at: z.ZodString;
        status: z.ZodString;
    }, z.core.$strip>>;
    active_diagnoses: z.ZodArray<z.ZodString>;
    metadata: z.ZodObject<{
        retrieved_at: z.ZodString;
        context_version: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type GetPatientContextOutput = z.infer<typeof GetPatientContextOutputSchema>;
export declare const RunDiagnosisInputSchema: z.ZodObject<{
    patient_id: z.ZodString;
    options: z.ZodOptional<z.ZodObject<{
        assessment_id: z.ZodOptional<z.ZodString>;
        include_history: z.ZodOptional<z.ZodBoolean>;
        max_history_depth: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type RunDiagnosisInput = z.infer<typeof RunDiagnosisInputSchema>;
export declare const RunDiagnosisOutputSchema: z.ZodObject<{
    run_id: z.ZodString;
    patient_id: z.ZodString;
    diagnosis_result: z.ZodObject<{
        primary_findings: z.ZodArray<z.ZodString>;
        risk_level: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            critical: "critical";
        }>;
        recommendations: z.ZodArray<z.ZodString>;
        confidence_score: z.ZodNumber;
    }, z.core.$strip>;
    metadata: z.ZodObject<{
        run_version: z.ZodString;
        prompt_version: z.ZodString;
        executed_at: z.ZodString;
        processing_time_ms: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export type RunDiagnosisOutput = z.infer<typeof RunDiagnosisOutputSchema>;
export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
    name: string;
    description: string;
    inputSchema: z.ZodType<TInput>;
    outputSchema: z.ZodType<TOutput>;
}
export declare const MCP_TOOLS: {
    get_patient_context: ToolDefinition<GetPatientContextInput, GetPatientContextOutput>;
    run_diagnosis: ToolDefinition<RunDiagnosisInput, RunDiagnosisOutput>;
};
export type MCPToolName = keyof typeof MCP_TOOLS;
//# sourceMappingURL=tools.d.ts.map