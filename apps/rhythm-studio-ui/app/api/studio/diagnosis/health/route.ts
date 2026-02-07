import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { isFeatureEnabled } from '@/lib/featureFlags'
import { env } from '@/lib/env'

const newRequestId = () => `${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`

const DEFAULT_TIMEOUT_MS = 3000

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
  const requestId = newRequestId()
  const headers = { 'x-request-id': requestId }

  const diagnosisEnabled = isFeatureEnabled('DIAGNOSIS_V1_ENABLED')
  if (!diagnosisEnabled) {
    return NextResponse.json(
      {
        success: false,
        status: 'disabled',
        requestId,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'Diagnosis feature is not enabled',
        },
      },
      { status: 503, headers },
    )
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      {
        success: false,
        status: 'unauthorized',
        requestId,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      { status: 401, headers },
    )
  }

  const userRole = user.app_metadata?.role
  const isAuthorized = userRole === 'clinician' || userRole === 'admin'

  if (!isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        status: 'forbidden',
        requestId,
        error: {
          code: 'FORBIDDEN',
          message: 'Only clinicians and admins can access diagnosis',
        },
      },
      { status: 403, headers },
    )
  }

  const mcpServerUrl = env.MCP_SERVER_URL
  if (!mcpServerUrl) {
    return NextResponse.json(
      {
        success: false,
        status: 'unavailable',
        requestId,
        error: {
          code: 'MCP_NOT_CONFIGURED',
          message: 'MCP_SERVER_URL is not configured',
        },
      },
      { status: 503, headers },
    )
  }

  try {
    const mcpResponse = await fetchWithTimeout(
      `${mcpServerUrl}/health`,
      DEFAULT_TIMEOUT_MS,
    )

    if (!mcpResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          status: 'unavailable',
          requestId,
          error: {
            code: 'MCP_BAD_RESPONSE',
            message: `MCP health check failed with status ${mcpResponse.status}`,
          },
        },
        { status: 503, headers },
      )
    }

    return NextResponse.json(
      {
        success: true,
        status: 'available',
        requestId,
      },
      { status: 200, headers },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        success: false,
        status: 'unavailable',
        requestId,
        error: {
          code: 'MCP_UNREACHABLE',
          message,
        },
      },
      { status: 503, headers },
    )
  }
}
