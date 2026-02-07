/**
 * E76.1: MCP Tool Handlers (Stubbed)
 * 
 * Implements stubbed handlers for MCP tools.
 * Handlers validate input/output against schemas and return deterministic responses.
 */

import Anthropic from '@anthropic-ai/sdk'
import type {
  GetPatientContextInput,
  GetPatientContextOutput,
  RunDiagnosisInput,
  RunDiagnosisOutput,
} from './tools.js'
import { MCP_TOOLS } from './tools.js'
import { generateRunVersion, getVersionMetadata } from './version.js'
import { logger } from './logger.js'
import { env } from './env.js'
import { getPrompt } from './prompts/registry.js'
import {
  DiagnosisPromptOutputV1Schema,
  CONFIDENCE_LEVEL,
  URGENCY_LEVEL,
  type DiagnosisPromptOutputV1,
} from './contracts/diagnosis-prompt.js'

const anthropicApiKey = env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_TOKEN
const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null
const llmProvider = (env.LLM_PROVIDER || 'anthropic').toLowerCase()

export class McpToolError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}

function isStubEnabled(): boolean {
  return (env.FEATURE_MCP_STUB || '').toLowerCase() === 'true'
}

function extractJson(content: string): string {
  let jsonContent = content.trim()
  const jsonMatch = jsonContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (jsonMatch) {
    jsonContent = jsonMatch[1]
  }
  return jsonContent
}

async function callAnthropicDiagnosis(
  systemPrompt: string,
  userPrompt: string,
  modelConfig: { model: string; temperature: number; maxTokens: number },
): Promise<string> {
  if (llmProvider !== 'anthropic') {
    throw new McpToolError(
      'LLM_PROVIDER_UNSUPPORTED',
      `Unsupported LLM provider: ${llmProvider}`,
      400,
    )
  }

  if (!anthropic) {
    throw new McpToolError(
      'LLM_NOT_CONFIGURED',
      'Anthropic API client not initialized (missing API key)',
      503,
    )
  }

  const response = await anthropic.messages.create({
    model: modelConfig.model,
    max_tokens: modelConfig.maxTokens,
    temperature: modelConfig.temperature,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const contentBlock = response.content[0]
  if (contentBlock.type !== 'text') {
    throw new Error('Expected text response from Anthropic API')
  }

  return contentBlock.text
}

function mapConfidenceScore(
  differentials: DiagnosisPromptOutputV1['differential_diagnoses'],
): number {
  if (!differentials.length) return 0.5
  const scores = differentials.map(
    (item: DiagnosisPromptOutputV1['differential_diagnoses'][number]) => {
    switch (item.confidence) {
      case CONFIDENCE_LEVEL.VERY_HIGH:
        return 0.9
      case CONFIDENCE_LEVEL.HIGH:
        return 0.8
      case CONFIDENCE_LEVEL.MODERATE:
        return 0.6
      case CONFIDENCE_LEVEL.LOW:
        return 0.4
      case CONFIDENCE_LEVEL.VERY_LOW:
      default:
        return 0.2
    }
  })

  const average = scores.reduce((sum: number, value: number) => sum + value, 0) / scores.length
  return Math.min(1, Math.max(0, Number(average.toFixed(2))))
}

function mapRiskLevel(output: DiagnosisPromptOutputV1): 'low' | 'medium' | 'high' | 'critical' {
  const urgencies = output.urgent_red_flags.map(
    (flag: DiagnosisPromptOutputV1['urgent_red_flags'][number]) => flag.urgency,
  )

  if (urgencies.includes(URGENCY_LEVEL.EMERGENT)) return 'critical'
  if (urgencies.includes(URGENCY_LEVEL.URGENT)) return 'high'
  if (urgencies.includes(URGENCY_LEVEL.PROMPT)) return 'medium'
  if (urgencies.includes(URGENCY_LEVEL.ROUTINE)) return 'low'

  const confidenceLevels = output.differential_diagnoses.map(
    (item: DiagnosisPromptOutputV1['differential_diagnoses'][number]) => item.confidence,
  )
  if (confidenceLevels.includes(CONFIDENCE_LEVEL.VERY_HIGH)) return 'high'
  if (confidenceLevels.includes(CONFIDENCE_LEVEL.HIGH)) return 'high'
  if (confidenceLevels.includes(CONFIDENCE_LEVEL.MODERATE)) return 'medium'
  if (confidenceLevels.includes(CONFIDENCE_LEVEL.LOW)) return 'low'
  if (confidenceLevels.includes(CONFIDENCE_LEVEL.VERY_LOW)) return 'low'

  return 'medium'
}

function buildDiagnosisResult(output: DiagnosisPromptOutputV1) {
  const primaryFindings = output.differential_diagnoses
    .map((item: DiagnosisPromptOutputV1['differential_diagnoses'][number]) => item.condition)
    .filter(Boolean)
  const recommendations = output.recommended_next_steps
    .map((item: DiagnosisPromptOutputV1['recommended_next_steps'][number]) => item.step)
    .filter(Boolean)

  const fallbackFinding = output.summary ? [output.summary.slice(0, 120)] : ['Diagnosis summary']
  const fallbackRecommendation = ['Clinician review required']

  const supportingEvidence = output.differential_diagnoses
    .flatMap(
      (item: DiagnosisPromptOutputV1['differential_diagnoses'][number]) =>
        item.supporting_factors || [],
    )
    .filter(Boolean)

  const differentialConsiderations = output.differential_diagnoses
    .map((item: DiagnosisPromptOutputV1['differential_diagnoses'][number]) => item.condition)
    .filter(Boolean)

  return {
    primary_findings: primaryFindings.length ? primaryFindings.slice(0, 5) : fallbackFinding,
    risk_level: mapRiskLevel(output),
    recommendations: recommendations.length ? recommendations.slice(0, 10) : fallbackRecommendation,
    confidence_score: mapConfidenceScore(output.differential_diagnoses),
    supporting_evidence: supportingEvidence.length ? supportingEvidence.slice(0, 10) : undefined,
    differential_considerations: differentialConsiderations.length
      ? differentialConsiderations.slice(0, 5)
      : undefined,
  }
}

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
  const versionMetadata = getVersionMetadata(runId)

  if (isStubEnabled()) {
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

    MCP_TOOLS.run_diagnosis.outputSchema.parse(output)
    log.info('run_diagnosis completed (stub)', {
      patient_id: input.patient_id,
      risk_level: output.diagnosis_result.risk_level,
    })
    return output
  }

  const promptVersion = 'v1.0.0'
  const promptTemplate = getPrompt('diagnosis', promptVersion)

  if (!promptTemplate) {
    throw new Error(`Diagnosis prompt not found: diagnosis-${promptVersion}`)
  }

  const contextPack = await handleGetPatientContext({ patient_id: input.patient_id }, runId)
  const contextPayload = {
    ...contextPack,
    options: input.options ?? null,
  }

  const systemPrompt = promptTemplate.systemPrompt || ''
  const userPrompt = promptTemplate.userPromptTemplate.replace(
    '{{contextPack}}',
    JSON.stringify(contextPayload, null, 2),
  )

  const modelConfig = {
    model:
      promptTemplate.metadata.modelConfig?.model ||
      env.ANTHROPIC_MODEL ||
      'claude-sonnet-4-5-20250929',
    temperature: 0,
    maxTokens: promptTemplate.metadata.modelConfig?.maxTokens ?? 8192,
  }

  const llmText = await callAnthropicDiagnosis(systemPrompt, userPrompt, modelConfig)
  const jsonContent = extractJson(llmText)
  const parsedOutput = DiagnosisPromptOutputV1Schema.parse(JSON.parse(jsonContent))
  const diagnosisResult = buildDiagnosisResult(parsedOutput)

  const output: RunDiagnosisOutput = {
    run_id: runId,
    patient_id: input.patient_id,
    diagnosis_result: diagnosisResult,
    metadata: {
      run_version: versionMetadata.run_version,
      prompt_version: promptVersion,
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
