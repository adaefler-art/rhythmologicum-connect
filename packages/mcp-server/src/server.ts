/**
 * E76.1: MCP Server Entry Point
 * 
 * Provides health endpoint and MCP tool execution API.
 * Can be started as standalone server or imported as module.
 */

import http from 'node:http'
import crypto from 'node:crypto'
import { getVersionMetadata, generateRunVersion } from './version.js'
import { logger } from './logger.js'
import {
  handleGetPatientContext,
  handleRunDiagnosis,
  McpToolError,
  type TraceTimelineEntry,
  type TraceTimelineSummary,
  type ToolResult,
} from './handlers.js'
import type { GetPatientContextInput, RunDiagnosisInput } from './tools.js'
import { env } from './env.js'

const PORT = Number(env.PORT || env.MCP_SERVER_PORT || 3001)
const HOST = '0.0.0.0'

interface HealthResponse {
  ok: true
  status: 'ok'
  version: ReturnType<typeof getVersionMetadata>
  uptime_seconds: number
  llm_configured: boolean
  llm_provider: 'anthropic' | 'none'
}

interface ToolRequest {
  tool: string
  input: unknown
  run_id?: string
}

interface ToolResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    where?: string
  }
  trace_id?: string
  timeline?: TraceTimelineEntry[]
  timeline_summary?: TraceTimelineSummary
  version: ReturnType<typeof getVersionMetadata>
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  const llmProvider = (env.LLM_PROVIDER || 'anthropic').toLowerCase()
  const hasAnthropicKey = Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_KEY)
  const llmProviderLabel: HealthResponse['llm_provider'] =
    llmProvider === 'anthropic' ? 'anthropic' : 'none'
  const isAnthropicConfigured = llmProviderLabel === 'anthropic' && hasAnthropicKey

  // Health endpoint
  if (url.pathname === '/health' && req.method === 'GET') {
    const response: HealthResponse = {
      ok: true,
      status: 'ok',
      version: getVersionMetadata(),
      uptime_seconds: process.uptime(),
      llm_configured: isAnthropicConfigured,
      llm_provider: llmProviderLabel,
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(response))
    return
  }

  // Tool execution endpoint
  if (url.pathname === '/tools' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        const request: ToolRequest = JSON.parse(body)
        const runId = request.run_id || generateRunVersion()
        const traceId = crypto.randomUUID()
        const log = logger.withRunId(runId)

        const inputRecord =
          request.input && typeof request.input === 'object'
            ? (request.input as Record<string, unknown>)
            : {}
        const patientId =
          typeof inputRecord.patient_id === 'string' ? inputRecord.patient_id : undefined
        const options =
          inputRecord.options && typeof inputRecord.options === 'object'
            ? inputRecord.options
            : undefined

        log.info('Tool request received', {
          tool: request.tool,
          trace_id: traceId,
          patient_id: patientId,
          options,
        })

        let result: ToolResult<unknown>

        switch (request.tool) {
          case 'get_patient_context':
            result = await handleGetPatientContext(
              request.input as GetPatientContextInput,
              runId,
              traceId,
            )
            break

          case 'run_diagnosis':
            result = await handleRunDiagnosis(
              request.input as RunDiagnosisInput,
              runId,
              traceId,
            )
            break

          default:
            throw new Error(`Unknown tool: ${request.tool}`)
        }

        const response: ToolResponse = {
          success: true,
          data: result.data,
          trace_id: result.telemetry?.trace_id,
          timeline_summary: result.telemetry?.timeline_summary,
          version: getVersionMetadata(runId),
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(response))

        log.info('Tool request completed', {
          tool: request.tool,
          trace_id: traceId,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorCode = error instanceof McpToolError ? error.code : 'TOOL_EXECUTION_ERROR'
        const status = error instanceof McpToolError ? error.status : 400
        const details = error instanceof McpToolError ? error.details : undefined

        logger.error('Tool request failed', {
          error: errorMessage,
          code: errorCode,
          trace_id: details?.trace_id,
          where: details?.where,
        })

        const response: ToolResponse = {
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
            where: details?.where,
          },
          trace_id: details?.trace_id,
          timeline: details?.timeline,
          timeline_summary: details?.timeline_summary,
          version: getVersionMetadata(),
        }

        res.writeHead(status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(response))
      }
    })
    return
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
}

export function createServer() {
  return http.createServer(handleRequest)
}

export function startServer() {
  const server = createServer()

  const llmProvider = (env.LLM_PROVIDER || 'anthropic').toLowerCase()
  const hasAnthropicKey = Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_KEY)
  const llmProviderLabel: HealthResponse['llm_provider'] =
    llmProvider === 'anthropic' ? 'anthropic' : 'none'
  const llmConfigured = llmProviderLabel === 'anthropic' && hasAnthropicKey

  server.listen(PORT, HOST, () => {
    logger.info('MCP Server started', {
      host: HOST,
      port: PORT,
      version: getVersionMetadata(),
      llm_configured: llmConfigured,
      llm_provider: llmProviderLabel,
    })
  })

  return server
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer()
}
