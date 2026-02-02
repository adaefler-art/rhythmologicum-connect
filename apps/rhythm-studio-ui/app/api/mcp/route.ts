/**
 * E76.1: MCP Server API Proxy
 * 
 * Provides access to MCP server tools through a feature-flagged API endpoint.
 * This endpoint forwards requests to the standalone MCP server.
 * 
 * Strategy A Compliance:
 * - Literal callsite: apps/rhythm-studio-ui/app/admin/diagnostics/mcp-test/page.tsx
 * - Feature flag: NEXT_PUBLIC_FEATURE_MCP_ENABLED (default: false)
 */

import { NextRequest, NextResponse } from 'next/server'
import { featureFlags } from '@/lib/featureFlags'

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  // Feature flag check
  if (!featureFlags.MCP_ENABLED) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'MCP server integration is not enabled',
        },
      },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const { tool, input, run_id } = body

    if (!tool || !input) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Tool and input are required',
          },
        },
        { status: 400 },
      )
    }

    // Forward request to MCP server
    const mcpResponse = await fetch(`${MCP_SERVER_URL}/tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tool, input, run_id }),
    })

    const mcpData = await mcpResponse.json()

    return NextResponse.json(mcpData, {
      status: mcpResponse.ok ? 200 : mcpResponse.status,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MCP_SERVER_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  // Feature flag check
  if (!featureFlags.MCP_ENABLED) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'MCP server integration is not enabled',
        },
      },
      { status: 403 },
    )
  }

  try {
    // Forward health check to MCP server
    const mcpResponse = await fetch(`${MCP_SERVER_URL}/health`)
    const mcpData = await mcpResponse.json()

    return NextResponse.json(mcpData, {
      status: mcpResponse.ok ? 200 : mcpResponse.status,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MCP_SERVER_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 },
    )
  }
}
