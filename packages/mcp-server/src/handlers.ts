/**
 * E76.1: MCP Tool Handlers (Stubbed)
 * 
 * Implements stubbed handlers for MCP tools.
 * Handlers validate input/output against schemas and return deterministic responses.
 */

import type {
  GetPatientContextInput,
  GetPatientContextOutput,
  RunDiagnosisInput,
  RunDiagnosisOutput,
} from './tools.js'
import { MCP_TOOLS } from './tools.js'
import { generateRunVersion, getVersionMetadata } from './version.js'
import { logger } from './logger.js'

export async function handleGetPatientContext(
  input: GetPatientContextInput,
  runId: string,
): Promise<GetPatientContextOutput> {
  const log = logger.withRunId(runId)

  // Validate input
  MCP_TOOLS.get_patient_context.inputSchema.parse(input)

  log.info('Executing get_patient_context', { patient_id: input.patient_id })

  // Stubbed response
  const output: GetPatientContextOutput = {
    patient_id: input.patient_id,
    demographics: {
      age: 42,
      gender: 'not_specified',
    },
    anamnesis: {
      entries: [
        {
          id: 'stub-anamnesis-001',
          title: 'Initial intake notes',
          content: { note: 'Patient reports elevated stress levels.' },
          entry_type: 'intake',
          tags: ['stress', 'intake'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      total_count: 1,
      limited_to: 30,
    },
    funnel_runs: {
      runs: [
        {
          assessment_id: 'stub-assessment-001',
          funnel_slug: 'stress-assessment',
          funnel_name: 'Stress Assessment',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          status: 'completed',
          answers: [
            {
              question_id: 'stub-question-001',
              question_label: 'How stressed do you feel today?',
              answer_value: 6,
            },
          ],
          result: {
            scores: { stress_score: 6 },
            risk_models: { stress_risk: 'moderate' },
            algorithm_version: 'v1-stub',
          },
        },
      ],
      total_count: 1,
      limit_per_funnel: 2,
    },
    current_measures: {
      stress_score: 6,
      sleep_score: 7,
      risk_level: 'moderate',
    },
    metadata: {
      retrieved_at: new Date().toISOString(),
      context_version: 'v1-stub',
      inputs_hash: 'stub-inputs-hash',
    },
  }

  // Validate output
  MCP_TOOLS.get_patient_context.outputSchema.parse(output)

  log.info('get_patient_context completed', { patient_id: input.patient_id })

  return output
}

export async function handleRunDiagnosis(
  input: RunDiagnosisInput,
  runId: string,
): Promise<RunDiagnosisOutput> {
  const log = logger.withRunId(runId)

  // Validate input
  MCP_TOOLS.run_diagnosis.inputSchema.parse(input)

  log.info('Executing run_diagnosis', {
    patient_id: input.patient_id,
    options: input.options,
  })

  const startTime = Date.now()

  // Stubbed response
  const versionMetadata = getVersionMetadata(runId)
  const output: RunDiagnosisOutput = {
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
  }

  // Validate output
  MCP_TOOLS.run_diagnosis.outputSchema.parse(output)

  log.info('run_diagnosis completed', {
    patient_id: input.patient_id,
    risk_level: output.diagnosis_result.risk_level,
  })

  return output
}
