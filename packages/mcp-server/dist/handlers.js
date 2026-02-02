/**
 * E76.1: MCP Tool Handlers (Stubbed)
 *
 * Implements stubbed handlers for MCP tools.
 * Handlers validate input/output against schemas and return deterministic responses.
 */
import { MCP_TOOLS } from './tools.js';
import { getVersionMetadata } from './version.js';
import { logger } from './logger.js';
export async function handleGetPatientContext(input, runId) {
    const log = logger.withRunId(runId);
    // Validate input
    MCP_TOOLS.get_patient_context.inputSchema.parse(input);
    log.info('Executing get_patient_context', { patient_id: input.patient_id });
    // Stubbed response
    const output = {
        patient_id: input.patient_id,
        demographics: {
            age: 42,
            gender: 'not_specified',
        },
        recent_assessments: [
            {
                assessment_id: 'stub-assessment-001',
                funnel_slug: 'stress-assessment',
                completed_at: new Date().toISOString(),
                status: 'completed',
            },
        ],
        active_diagnoses: ['stress-level-moderate'],
        metadata: {
            retrieved_at: new Date().toISOString(),
            context_version: 'v1-stub',
        },
    };
    // Validate output
    MCP_TOOLS.get_patient_context.outputSchema.parse(output);
    log.info('get_patient_context completed', { patient_id: input.patient_id });
    return output;
}
export async function handleRunDiagnosis(input, runId) {
    const log = logger.withRunId(runId);
    // Validate input
    MCP_TOOLS.run_diagnosis.inputSchema.parse(input);
    log.info('Executing run_diagnosis', {
        patient_id: input.patient_id,
        options: input.options,
    });
    const startTime = Date.now();
    // Stubbed response
    const versionMetadata = getVersionMetadata(runId);
    const output = {
        run_id: runId,
        patient_id: input.patient_id,
        diagnosis_result: {
            primary_findings: [
                'Moderate stress levels detected',
                'Sleep quality concerns identified',
                'Cardiovascular risk markers present',
            ],
            risk_level: 'medium',
            recommendations: [
                'Consider stress management techniques',
                'Schedule follow-up assessment in 2 weeks',
                'Review sleep hygiene practices',
            ],
            confidence_score: 0.78,
        },
        metadata: {
            run_version: versionMetadata.run_version,
            prompt_version: versionMetadata.prompt_version,
            executed_at: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime,
        },
    };
    // Validate output
    MCP_TOOLS.run_diagnosis.outputSchema.parse(output);
    log.info('run_diagnosis completed', {
        patient_id: input.patient_id,
        risk_level: output.diagnosis_result.risk_level,
    });
    return output;
}
//# sourceMappingURL=handlers.js.map