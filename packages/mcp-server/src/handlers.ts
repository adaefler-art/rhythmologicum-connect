/**
 * E76.1: MCP Tool Handlers (Stubbed)
 * 
 * Implements stubbed handlers for MCP tools.
 * Handlers validate input/output against schemas and return deterministic responses.
 */

import Anthropic from '@anthropic-ai/sdk'
import crypto from 'node:crypto'
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
const LLM_TIMEOUT_MS = Number(env.LLM_TIMEOUT_MS || 60000)
const LLM_TIMEOUT_SAFE_MS = Number.isFinite(LLM_TIMEOUT_MS) && LLM_TIMEOUT_MS > 0
  ? LLM_TIMEOUT_MS
  : 60000
const MCP_HTTP_TIMEOUT_MS = Number(env.MCP_HTTP_TIMEOUT_MS || 0)

type TraceStage =
  | 'request_received'
  | 'context_fetch_start'
  | 'context_fetch_end'
  | 'prompt_build_start'
  | 'prompt_build_end'
  | 'llm_request_start'
  | 'llm_response_headers'
  | 'llm_complete'
  | 'response_sent'

export type TraceTimelineEntry = {
  stage: TraceStage
  t_ms_since_start: number
}

export type TraceTimelineSummary = {
  total_ms: number
  stages_ms: Record<TraceStage, number>
}

export type TraceTelemetry = {
  trace_id: string
  timeline: TraceTimelineEntry[]
  timeline_summary: TraceTimelineSummary
  metrics: {
    prompt_chars: number
    prompt_tokens_est: number
    prompt_sha256: string
    context_chars: number
    context_items_count: number
    model: string
    temperature: number
    max_tokens: number
    mcp_http_timeout_ms: number
    llm_client_timeout_ms: number
    llm_response_id?: string
    llm_usage_input_tokens?: number
    llm_usage_output_tokens?: number
  }
}

export type ToolResult<T> = {
  data: T
  telemetry?: TraceTelemetry
}

type ToolErrorDetails = {
  trace_id?: string
  timeline?: TraceTimelineEntry[]
  timeline_summary?: TraceTimelineSummary
  where?:
    | 'LLM_CLIENT_TIMEOUT'
    | 'LLM_PROVIDER_TIMEOUT'
    | 'MCP_ROUTE_TIMEOUT'
    | 'MCP_UPSTREAM_RESET'
    | 'MCP_ROUTE_ERROR'
}

export class McpToolError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: ToolErrorDetails

  constructor(code: string, message: string, status = 400, details?: ToolErrorDetails) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
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

type LlmResponseMeta = {
  id?: string
  model?: string
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
}

async function callAnthropicDiagnosis(
  systemPrompt: string,
  userPrompt: string,
  modelConfig: { model: string; temperature: number; maxTokens: number },
  traceId?: string,
  markStage?: (stage: TraceStage) => void,
): Promise<{ text: string; meta: LlmResponseMeta }> {
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
    markStage?.('llm_request_start')
    const response = await Promise.race([
      anthropic.messages.create(
        {
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
        },
        traceId ? { headers: { 'x-trace-id': traceId } } : undefined,
      ),
      new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new McpToolError('MCP_TIMEOUT_CLIENT', 'LLM request timed out', 504, {
              where: 'LLM_CLIENT_TIMEOUT',
            }),
          )
        }, LLM_TIMEOUT_SAFE_MS)
      }),
    ])

    markStage?.('llm_response_headers')
    const contentBlock = response.content[0]
    if (contentBlock.type !== 'text') {
      throw new Error('Expected text response from Anthropic API')
    }

    markStage?.('llm_complete')
    const meta: LlmResponseMeta = {
      id: typeof response.id === 'string' ? response.id : undefined,
      model: typeof response.model === 'string' ? response.model : undefined,
      usage: response.usage
        ? {
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens,
          }
        : undefined,
    }
    return { text: contentBlock.text, meta }
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

function estimateTokens(chars: number): number {
  return Math.max(1, Math.ceil(chars / 4))
}

function hashPrompt(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

function classifyLlmError(error: unknown): {
  code: 'MCP_TIMEOUT_CLIENT' | 'MCP_TIMEOUT_PROVIDER' | 'MCP_TIMEOUT_UPSTREAM'
  where: ToolErrorDetails['where']
  status: number
} | null {
  if (error instanceof McpToolError) {
    if (error.code === 'MCP_TIMEOUT_CLIENT') {
      return {
        code: 'MCP_TIMEOUT_CLIENT',
        where: 'LLM_CLIENT_TIMEOUT',
        status: error.status,
      }
    }
  }

  const anyError = error as { status?: number; code?: string; message?: string }
  const status = typeof anyError?.status === 'number' ? anyError.status : undefined
  if (status && (status === 408 || status === 504 || status === 529 || status >= 500)) {
    return {
      code: 'MCP_TIMEOUT_PROVIDER',
      where: 'LLM_PROVIDER_TIMEOUT',
      status,
    }
  }

  const errorCode = anyError?.code || ''
  const message = (anyError?.message || '').toLowerCase()
  if (
    errorCode === 'ECONNRESET' ||
    errorCode === 'ETIMEDOUT' ||
    errorCode === 'EPIPE' ||
    errorCode === 'UND_ERR_CONNECT_TIMEOUT' ||
    message.includes('socket hang up') ||
    message.includes('connection reset')
  ) {
    return {
      code: 'MCP_TIMEOUT_UPSTREAM',
      where: 'MCP_UPSTREAM_RESET',
      status: 504,
    }
  }

  return null
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

function compactAnswerValue(value: unknown): unknown {
  if (typeof value === 'string') return value.slice(0, 200)
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value
  try {
    return JSON.stringify(value).slice(0, 200)
  } catch {
    return String(value).slice(0, 200)
  }
}

function compactContextPack(pack: GetPatientContextOutput): GetPatientContextOutput {
  const trimmedAnamnesis = pack.anamnesis.entries.slice(0, 5).map((entry) => ({
    id: entry.id,
    title: entry.title,
    content: {},
    entry_type: entry.entry_type,
    tags: entry.tags.slice(0, 5),
    created_at: entry.created_at,
    updated_at: entry.updated_at,
  }))

  const trimmedRuns = pack.funnel_runs.runs.slice(0, 3).map((run) => ({
    assessment_id: run.assessment_id,
    funnel_slug: run.funnel_slug,
    funnel_name: run.funnel_name,
    started_at: run.started_at,
    completed_at: run.completed_at,
    status: run.status,
    answers: run.answers.slice(0, 5).map((answer) => ({
      question_id: answer.question_id,
      question_label: answer.question_label,
      answer_value: compactAnswerValue(answer.answer_value),
    })),
    result: run.result
      ? {
          scores: run.result.scores,
          risk_models: run.result.risk_models,
          algorithm_version: run.result.algorithm_version,
        }
      : null,
  }))

  return {
    ...pack,
    anamnesis: {
      ...pack.anamnesis,
      entries: trimmedAnamnesis,
    },
    funnel_runs: {
      ...pack.funnel_runs,
      runs: trimmedRuns,
    },
  }
}

export async function handleGetPatientContext(
  input: GetPatientContextInput,
  runId: string,
  traceId?: string,
): Promise<ToolResult<GetPatientContextOutput>> {
  const log = logger.withRunId(runId)
  const resolvedTraceId = traceId || crypto.randomUUID()
  const startTime = Date.now()
  const timeline: TraceTimelineEntry[] = [
    { stage: 'request_received', t_ms_since_start: 0 },
  ]

  // Validate input
  MCP_TOOLS.get_patient_context.inputSchema.parse(input)

  log.info('Executing get_patient_context', {
    patient_id: input.patient_id,
    trace_id: traceId,
  })

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

  log.info('get_patient_context completed', {
    patient_id: input.patient_id,
    trace_id: resolvedTraceId,
  })

  timeline.push({ stage: 'response_sent', t_ms_since_start: Date.now() - startTime })
  const telemetry: TraceTelemetry = {
    trace_id: resolvedTraceId,
    timeline,
    timeline_summary: {
      total_ms: Date.now() - startTime,
      stages_ms: {
        request_received: 0,
        response_sent: Date.now() - startTime,
      } as Record<TraceStage, number>,
    },
    metrics: {
      prompt_chars: 0,
      prompt_tokens_est: 0,
      prompt_sha256: '',
      context_chars: 0,
      context_items_count: 0,
      model: '',
      temperature: 0,
      max_tokens: 0,
      mcp_http_timeout_ms: MCP_HTTP_TIMEOUT_MS,
      llm_client_timeout_ms: LLM_TIMEOUT_SAFE_MS,
    },
  }

  return { data: output, telemetry }
}

export async function handleRunDiagnosis(
  input: RunDiagnosisInput,
  runId: string,
  traceId?: string,
): Promise<ToolResult<RunDiagnosisOutput>> {
  const log = logger.withRunId(runId)
  const resolvedTraceId = traceId || crypto.randomUUID()
  const startTime = Date.now()
  const stageTimes = new Map<TraceStage, number>()
  const timeline: TraceTimelineEntry[] = []
  const markStage = (stage: TraceStage) => {
    const tMs = Date.now() - startTime
    timeline.push({ stage, t_ms_since_start: tMs })
    stageTimes.set(stage, tMs)
  }
  const buildSummary = (): TraceTimelineSummary => {
    const stagesMs = {} as Record<TraceStage, number>
    for (const [stage, tMs] of stageTimes.entries()) {
      stagesMs[stage] = tMs
    }
    return {
      total_ms: Date.now() - startTime,
      stages_ms: stagesMs,
    }
  }
  const metrics = {
    prompt_chars: 0,
    prompt_tokens_est: 0,
    prompt_sha256: '',
    context_chars: 0,
    context_items_count: 0,
    model: '',
    temperature: 0,
    max_tokens: 0,
    mcp_http_timeout_ms: MCP_HTTP_TIMEOUT_MS,
    llm_client_timeout_ms: LLM_TIMEOUT_SAFE_MS,
  }

  // Validate input
  MCP_TOOLS.run_diagnosis.inputSchema.parse(input)

  markStage('request_received')

  log.info('Executing run_diagnosis', {
    patient_id: input.patient_id,
    options: input.options,
    trace_id: resolvedTraceId,
  })
  const versionMetadata = getVersionMetadata(runId)

  try {
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
        trace_id: resolvedTraceId,
        timeline,
        metrics,
      })
      markStage('response_sent')
      const telemetry: TraceTelemetry = {
        trace_id: resolvedTraceId,
        timeline,
        timeline_summary: buildSummary(),
        metrics,
      }
      return { data: output, telemetry }
    }

    const promptVersion = 'v1.0.0'
    const promptTemplate = getPrompt('diagnosis', promptVersion)

    if (!promptTemplate) {
      throw new Error(`Diagnosis prompt not found: diagnosis-${promptVersion}`)
    }

    markStage('context_fetch_start')
    const contextResult = await handleGetPatientContext(
      { patient_id: input.patient_id },
      runId,
      resolvedTraceId,
    )
    markStage('context_fetch_end')
    const compactContext = compactContextPack(contextResult.data)
    const contextPayload = {
      ...compactContext,
      options: input.options ?? null,
    }

    markStage('prompt_build_start')
    const systemPrompt = promptTemplate.systemPrompt || ''
    const userPrompt = promptTemplate.userPromptTemplate.replace(
      '{{contextPack}}',
      JSON.stringify(contextPayload, null, 2),
    )
    markStage('prompt_build_end')

    const promptCombined = `${systemPrompt}\n\n${userPrompt}`
    metrics.context_chars = JSON.stringify(contextPayload).length
    metrics.context_items_count =
      (compactContext.anamnesis?.entries?.length || 0) +
      (compactContext.funnel_runs?.runs?.length || 0)
    metrics.prompt_chars = promptCombined.length
    metrics.prompt_tokens_est = estimateTokens(promptCombined.length)
    metrics.prompt_sha256 = hashPrompt(promptCombined)

    const modelConfig = {
      model:
        promptTemplate.metadata.modelConfig?.model ||
        env.ANTHROPIC_MODEL ||
        'claude-sonnet-4-5-20250929',
      temperature: 0,
      maxTokens: Math.min(promptTemplate.metadata.modelConfig?.maxTokens ?? 2048, 2048),
    }

    metrics.model = modelConfig.model
    metrics.temperature = modelConfig.temperature
    metrics.max_tokens = modelConfig.maxTokens

    let llmText = ''
    try {
      const llmResponse = await callAnthropicDiagnosis(
        systemPrompt,
        userPrompt,
        modelConfig,
        resolvedTraceId,
        markStage,
      )
      llmText = llmResponse.text
      metrics.llm_response_id = llmResponse.meta.id
      metrics.llm_usage_input_tokens = llmResponse.meta.usage?.input_tokens
      metrics.llm_usage_output_tokens = llmResponse.meta.usage?.output_tokens
    } catch (error) {
      const classification = classifyLlmError(error)
      const summary = buildSummary()
      const details: ToolErrorDetails = {
        trace_id: resolvedTraceId,
        timeline,
        timeline_summary: summary,
        where: classification?.where,
      }
      if (classification) {
        log.error('run_diagnosis failed (llm)', {
          trace_id: resolvedTraceId,
          error: error instanceof Error ? error.message : String(error),
          code: classification.code,
          where: classification.where,
          timeline,
          metrics,
        })
        throw new McpToolError(classification.code, 'LLM request timed out', classification.status, details)
      }

      log.error('run_diagnosis failed (llm)', {
        trace_id: resolvedTraceId,
        error: error instanceof Error ? error.message : String(error),
        code: error instanceof McpToolError ? error.code : 'TOOL_EXECUTION_ERROR',
        timeline,
        metrics,
      })
      throw new McpToolError(
        'TOOL_EXECUTION_ERROR',
        error instanceof Error ? error.message : 'Unknown error',
        500,
        details,
      )
    }
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
      trace_id: resolvedTraceId,
      timeline,
      metrics,
    })
    markStage('response_sent')
    const telemetry: TraceTelemetry = {
      trace_id: resolvedTraceId,
      timeline,
      timeline_summary: buildSummary(),
      metrics,
    }
    return { data: output, telemetry }
  } catch (error) {
    if (error instanceof McpToolError) {
      throw error
    }
    const summary = buildSummary()
    const details: ToolErrorDetails = {
      trace_id: resolvedTraceId,
      timeline,
      timeline_summary: summary,
      where: 'MCP_ROUTE_ERROR',
    }
    log.error('run_diagnosis failed', {
      trace_id: resolvedTraceId,
      error: error instanceof Error ? error.message : String(error),
      code: 'TOOL_EXECUTION_ERROR',
      timeline,
      metrics,
    })
    throw new McpToolError(
      'TOOL_EXECUTION_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      details,
    )
  }
}
