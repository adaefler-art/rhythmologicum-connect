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

const anthropicApiKey = env.ANTHROPIC_API_KEY || env.ANTHROPIC_KEY
const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null
const llmProvider = (env.LLM_PROVIDER || 'anthropic').toLowerCase()
const LLM_TIMEOUT_MS = 30000

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
      'Anthropic API key not configured',
      503,
    )
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null
  try {
    const response = await Promise.race([
      anthropic.messages.create({
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
      }),
      new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(new McpToolError('MCP_TIMEOUT', 'LLM request timed out', 504))
        }, LLM_TIMEOUT_MS)
      }),
    ])

    const contentBlock = response.content[0]
    if (contentBlock.type !== 'text') {
      throw new Error('Expected text response from Anthropic API')
    }

    return contentBlock.text
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
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

function normalizeConfidence(value: string): DiagnosisPromptOutputV1['differential_diagnoses'][number]['confidence'] {
  const normalized = value.toLowerCase().replace(/\s+/g, '_')
  switch (normalized) {
    case 'very_low':
      return CONFIDENCE_LEVEL.VERY_LOW
    case 'low':
      return CONFIDENCE_LEVEL.LOW
    case 'moderate':
    case 'medium':
      return CONFIDENCE_LEVEL.MODERATE
    case 'high':
      return CONFIDENCE_LEVEL.HIGH
    case 'very_high':
      return CONFIDENCE_LEVEL.VERY_HIGH
    default:
      return CONFIDENCE_LEVEL.MODERATE
  }
}

function normalizePriority(value: string): 'low' | 'medium' | 'high' | 'critical' {
  const normalized = value.toLowerCase().replace(/\s+/g, '_')
  switch (normalized) {
    case 'low':
    case 'routine':
      return 'low'
    case 'medium':
    case 'moderate':
    case 'prompt':
      return 'medium'
    case 'high':
    case 'urgent':
      return 'high'
    case 'critical':
    case 'emergent':
    case 'emergency':
      return 'critical'
    default:
      return 'medium'
  }
}

function normalizeUrgency(value: string): DiagnosisPromptOutputV1['urgent_red_flags'][number]['urgency'] {
  const normalized = value.toLowerCase().replace(/\s+/g, '_')
  switch (normalized) {
    case URGENCY_LEVEL.ROUTINE:
      return URGENCY_LEVEL.ROUTINE
    case URGENCY_LEVEL.PROMPT:
      return URGENCY_LEVEL.PROMPT
    case URGENCY_LEVEL.URGENT:
      return URGENCY_LEVEL.URGENT
    case URGENCY_LEVEL.EMERGENT:
      return URGENCY_LEVEL.EMERGENT
    default:
      return URGENCY_LEVEL.ROUTINE
  }
}

function normalizeDisclaimer(disclaimer: string | null | undefined): string {
  const safe = (disclaimer || '').trim()
  if (!safe) {
    return 'This analysis is NOT medical advice and is provided solely for clinician review.'
  }

  if (safe.length < 50) {
    return `${safe} This analysis is NOT medical advice and is provided solely for clinician review.`.slice(
      0,
      500,
    )
  }

  if (safe.length > 500) {
    return safe.slice(0, 500)
  }

  return safe
}

function normalizeDiagnosisPromptOutput(raw: unknown): DiagnosisPromptOutputV1 {
  const fallback: DiagnosisPromptOutputV1 = {
    summary: 'Diagnosis summary unavailable due to parsing issues.',
    patient_context_used: {
      assessments_count: 0,
      date_range: {
        earliest: new Date(0).toISOString(),
        latest: new Date().toISOString(),
      },
      data_sources: ['context_pack'],
      completeness_score: 0.5,
    },
    differential_diagnoses: [
      {
        condition: 'Stress-related presentation',
        rationale: 'Automated analysis fallback due to structured output issues.',
        confidence: CONFIDENCE_LEVEL.MODERATE,
        supporting_factors: ['Context pack available'],
      },
    ],
    recommended_next_steps: [
      {
        step: 'Clinician review required',
        rationale: 'Structured output could not be fully validated.',
        priority: 'medium',
        timeframe: 'As soon as practical',
      },
    ],
    urgent_red_flags: [],
    disclaimer: normalizeDisclaimer('This analysis is NOT medical advice and is provided solely for clinician review.'),
    schema_version: 'v1',
  }

  if (!raw || typeof raw !== 'object') {
    return fallback
  }

  const record = raw as Record<string, unknown>
  const differential = Array.isArray(record.differential_diagnoses)
    ? (record.differential_diagnoses as Record<string, unknown>[])
    : []
  const recommended = Array.isArray(record.recommended_next_steps)
    ? (record.recommended_next_steps as Record<string, unknown>[])
    : []
  const redFlags = Array.isArray(record.urgent_red_flags)
    ? (record.urgent_red_flags as Record<string, unknown>[])
    : []

  const patientContext = record.patient_context_used as
    | Record<string, unknown>
    | undefined
    | null
  const dataSources = Array.isArray(patientContext?.data_sources)
    ? patientContext?.data_sources.map((source) => String(source)).filter(Boolean)
    : []

  const earliest =
    typeof patientContext?.date_range === 'object' && patientContext?.date_range
      ? String((patientContext.date_range as Record<string, unknown>).earliest || '')
      : ''
  const latest =
    typeof patientContext?.date_range === 'object' && patientContext?.date_range
      ? String((patientContext.date_range as Record<string, unknown>).latest || '')
      : ''

  const normalizedDifferential = differential
    .slice(0, 5)
    .map((entry) => ({
      condition: String(entry.condition || 'Condition'),
      rationale: String(entry.rationale || 'Rationale unavailable').slice(0, 2000),
      confidence: normalizeConfidence(String(entry.confidence || 'moderate')),
      supporting_factors: Array.isArray(entry.supporting_factors)
        ? entry.supporting_factors.map((factor) => String(factor)).slice(0, 10)
        : ['Context pack available'],
      contradicting_factors: Array.isArray(entry.contradicting_factors)
        ? entry.contradicting_factors.map((factor) => String(factor)).slice(0, 10)
        : undefined,
    }))
    .filter((entry) => entry.condition && entry.rationale)

  const normalizedRecommended = recommended
    .slice(0, 10)
    .map((entry) => ({
      step: String(entry.step || 'Clinician follow-up'),
      rationale: String(entry.rationale || 'Rationale unavailable').slice(0, 1000),
      priority: normalizePriority(String(entry.priority || 'medium')),
      timeframe: entry.timeframe ? String(entry.timeframe).slice(0, 200) : undefined,
    }))
    .filter((entry) => entry.step && entry.rationale)

  return {
    summary:
      typeof record.summary === 'string'
        ? record.summary.slice(0, 1000)
        : fallback.summary,
    patient_context_used: {
      assessments_count:
        typeof patientContext?.assessments_count === 'number'
          ? Math.max(0, patientContext.assessments_count)
          : fallback.patient_context_used.assessments_count,
      date_range: {
        earliest: earliest || fallback.patient_context_used.date_range.earliest,
        latest: latest || fallback.patient_context_used.date_range.latest,
      },
      data_sources: dataSources.length ? dataSources.slice(0, 10) : fallback.patient_context_used.data_sources,
      completeness_score:
        typeof patientContext?.completeness_score === 'number'
          ? Math.min(1, Math.max(0, patientContext.completeness_score))
          : fallback.patient_context_used.completeness_score,
    },
    differential_diagnoses: normalizedDifferential.length
      ? normalizedDifferential
      : fallback.differential_diagnoses,
    recommended_next_steps: normalizedRecommended.length
      ? normalizedRecommended
      : fallback.recommended_next_steps,
    urgent_red_flags: redFlags
      .slice(0, 10)
      .map((entry) => ({
        flag: String(entry.flag || 'No urgent flags'),
        urgency: normalizeUrgency(String(entry.urgency || URGENCY_LEVEL.ROUTINE)),
        rationale: String(entry.rationale || 'Rationale unavailable').slice(0, 1000),
        recommended_action: String(entry.recommended_action || 'Clinician review').slice(0, 500),
      })),
    disclaimer: normalizeDisclaimer(
      typeof record.disclaimer === 'string' ? record.disclaimer : undefined,
    ),
    schema_version: 'v1',
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
    maxTokens: Math.min(promptTemplate.metadata.modelConfig?.maxTokens ?? 2048, 2048),
  }

  const llmText = await callAnthropicDiagnosis(systemPrompt, userPrompt, modelConfig)
  const jsonContent = extractJson(llmText)
  let parsedOutput: DiagnosisPromptOutputV1
  try {
    parsedOutput = DiagnosisPromptOutputV1Schema.parse(
      normalizeDiagnosisPromptOutput(JSON.parse(jsonContent)),
    )
  } catch (error) {
    log.warn('Diagnosis output normalization failed, using fallback', {
      error: error instanceof Error ? error.message : String(error),
    })
    parsedOutput = normalizeDiagnosisPromptOutput(null)
  }
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
