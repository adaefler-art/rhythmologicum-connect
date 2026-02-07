import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

type McpSmokeResponse = {
  success: boolean
  mcpServerUrl: string | null
  reachable: boolean
  latency_ms: number | null
  data: Record<string, unknown> | null
  error?: {
    code: string
    message: string
  }
}

const DEFAULT_TIMEOUT_MS = 3000

function redactUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return null
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: 'no-store',
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function POST() {
  const mcpServerUrl = env.MCP_SERVER_URL
  const redactedUrl = mcpServerUrl ? redactUrl(mcpServerUrl) : null

  if (!mcpServerUrl) {
    const response: McpSmokeResponse = {
      success: false,
      mcpServerUrl: redactedUrl,
      reachable: false,
      latency_ms: null,
      data: null,
      error: {
        code: 'MCP_NOT_CONFIGURED',
        message: 'MCP_SERVER_URL is not configured',
      },
    }
    return NextResponse.json(response)
  }

  const start = Date.now()

  try {
    const mcpResponse = await fetchWithTimeout(
      `${mcpServerUrl}/tools`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'run_diagnosis',
          input: {
            patient_id: '00000000-0000-0000-0000-000000000000',
            options: { include_history: false },
          },
        }),
      },
      DEFAULT_TIMEOUT_MS,
    )

    const latencyMs = Date.now() - start
    let payload: Record<string, unknown> | null = null

    try {
      payload = (await mcpResponse.json()) as Record<string, unknown>
    } catch {
      payload = null
    }

    if (!mcpResponse.ok || !payload) {
      const response: McpSmokeResponse = {
        success: false,
        mcpServerUrl: redactedUrl,
        reachable: false,
        latency_ms: latencyMs,
        data: payload,
        error: {
          code: 'MCP_BAD_RESPONSE',
          message: `MCP tool call failed with status ${mcpResponse.status}`,
        },
      }
      return NextResponse.json(response)
    }

    const errorMessage = (payload.error as { message?: string } | undefined)?.message || ''
    if (payload.success === false && errorMessage.toLowerCase().includes('api key')) {
      const response: McpSmokeResponse = {
        success: false,
        mcpServerUrl: redactedUrl,
        reachable: true,
        latency_ms: latencyMs,
        data: payload,
        error: {
          code: 'LLM_NOT_CONFIGURED',
          message: errorMessage,
        },
      }
      return NextResponse.json(response)
    }

    const response: McpSmokeResponse = {
      success: Boolean(payload.success),
      mcpServerUrl: redactedUrl,
      reachable: true,
      latency_ms: latencyMs,
      data: payload,
      error:
        payload.success === false
          ? {
              code: 'MCP_TOOL_ERROR',
              message: errorMessage || 'MCP tool call failed',
            }
          : undefined,
    }
    return NextResponse.json(response)
  } catch (error) {
    const latencyMs = Date.now() - start
    const message = error instanceof Error ? error.message : 'Unknown error'

    const response: McpSmokeResponse = {
      success: false,
      mcpServerUrl: redactedUrl,
      reachable: false,
      latency_ms: latencyMs,
      data: null,
      error: {
        code: 'MCP_UNREACHABLE',
        message,
      },
    }
    return NextResponse.json(response)
  }
}