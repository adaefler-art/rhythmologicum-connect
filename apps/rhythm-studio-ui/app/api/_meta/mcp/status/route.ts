import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

type McpStatusResponse = {
  success: boolean
  mcpServerUrl: string | null
  reachable: boolean
  latency_ms: number | null
  health: Record<string, unknown> | null
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

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { signal: controller.signal, cache: 'no-store' })
  } finally {
    clearTimeout(timer)
  }
}

export async function GET() {
  const mcpServerUrl = env.MCP_SERVER_URL
  const redactedUrl = mcpServerUrl ? redactUrl(mcpServerUrl) : null

  if (!mcpServerUrl) {
    const response: McpStatusResponse = {
      success: false,
      mcpServerUrl: redactedUrl,
      reachable: false,
      latency_ms: null,
      health: null,
      error: {
        code: 'MCP_NOT_CONFIGURED',
        message: 'MCP_SERVER_URL is not configured',
      },
    }
    return NextResponse.json(response)
  }

  const start = Date.now()

  try {
    const healthResponse = await fetchWithTimeout(
      `${mcpServerUrl}/health`,
      DEFAULT_TIMEOUT_MS,
    )
    const latencyMs = Date.now() - start

    let healthPayload: Record<string, unknown> | null = null
    try {
      healthPayload = (await healthResponse.json()) as Record<string, unknown>
    } catch {
      healthPayload = null
    }

    if (!healthResponse.ok || !healthPayload) {
      const response: McpStatusResponse = {
        success: false,
        mcpServerUrl: redactedUrl,
        reachable: false,
        latency_ms: latencyMs,
        health: healthPayload,
        error: {
          code: 'MCP_BAD_RESPONSE',
          message: `MCP health check failed with status ${healthResponse.status}`,
        },
      }
      return NextResponse.json(response)
    }

    const response: McpStatusResponse = {
      success: true,
      mcpServerUrl: redactedUrl,
      reachable: true,
      latency_ms: latencyMs,
      health: healthPayload,
    }
    return NextResponse.json(response)
  } catch (error) {
    const latencyMs = Date.now() - start
    const message = error instanceof Error ? error.message : 'Unknown error'

    const response: McpStatusResponse = {
      success: false,
      mcpServerUrl: redactedUrl,
      reachable: false,
      latency_ms: latencyMs,
      health: null,
      error: {
        code: 'MCP_UNREACHABLE',
        message,
      },
    }
    return NextResponse.json(response)
  }
}