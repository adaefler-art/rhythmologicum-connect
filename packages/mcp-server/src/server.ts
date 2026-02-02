/**
 * E76.1: MCP Server Entry Point
 * 
 * Provides health endpoint and MCP tool execution API.
 * Can be started as standalone server or imported as module.
 */

import http from 'node:http'
import { getVersionMetadata, generateRunVersion } from './version.js'
import { logger } from './logger.js'
import { handleGetPatientContext, handleRunDiagnosis } from './handlers.js'
import type { GetPatientContextInput, RunDiagnosisInput } from './tools.js'
import { env } from '../../../lib/env.js'

const PORT = env.MCP_SERVER_PORT || 3001
const HOST = env.MCP_SERVER_HOST || '0.0.0.0'

interface HealthResponse {
  status: 'ok'
  version: ReturnType<typeof getVersionMetadata>
  uptime_seconds: number
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
  }
  version: ReturnType<typeof getVersionMetadata>
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  // Health endpoint
  if (url.pathname === '/health' && req.method === 'GET') {
    const response: HealthResponse = {
      status: 'ok',
      version: getVersionMetadata(),
      uptime_seconds: process.uptime(),
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
        const log = logger.withRunId(runId)

        log.info('Tool request received', { tool: request.tool })

        let result: unknown

        switch (request.tool) {
          case 'get_patient_context':
            result = await handleGetPatientContext(request.input as GetPatientContextInput, runId)
            break

          case 'run_diagnosis':
            result = await handleRunDiagnosis(request.input as RunDiagnosisInput, runId)
            break

          default:
            throw new Error(`Unknown tool: ${request.tool}`)
        }

        const response: ToolResponse = {
          success: true,
          data: result,
          version: getVersionMetadata(runId),
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(response))

        log.info('Tool request completed', { tool: request.tool })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('Tool request failed', { error: errorMessage })

        const response: ToolResponse = {
          success: false,
          error: {
            code: 'TOOL_EXECUTION_ERROR',
            message: errorMessage,
          },
          version: getVersionMetadata(),
        }

        res.writeHead(400, { 'Content-Type': 'application/json' })
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

  server.listen(Number(PORT), HOST, () => {
    logger.info('MCP Server started', {
      host: HOST,
      port: PORT,
      version: getVersionMetadata(),
    })
  })

  return server
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer()
}
