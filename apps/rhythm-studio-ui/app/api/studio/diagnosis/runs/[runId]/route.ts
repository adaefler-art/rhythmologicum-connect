/**
 * Studio Diagnosis Run Detail API (proxy forwarder)
 *
 * GET /api/studio/diagnosis/runs/[runId]
 *
 * Forwards to /api/studio/diagnosis/run?runId=... to keep JSON behavior stable.
 */

import { NextResponse } from 'next/server'
import { ErrorCode } from '@/lib/api/responseTypes'
import { isValidUUID } from '@/lib/validators/uuid'

type RouteContext = {
  params: Promise<{ runId: string }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { runId } = await context.params

    if (!isValidUUID(runId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.INVALID_INPUT,
            message: 'runId must be a valid UUID',
          },
        },
        { status: 400 },
      )
    }

    const upstreamUrl = new URL('/api/studio/diagnosis/run', request.url)
    upstreamUrl.searchParams.set('runId', runId)

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    })

    const contentType = upstreamResponse.headers.get('content-type') ?? ''
    const raw = await upstreamResponse.text()

    if (upstreamResponse.ok) {
      if (contentType.includes('application/json')) {
        try {
          return NextResponse.json(JSON.parse(raw), { status: 200 })
        } catch (parseError) {
          console.error(
            '[studio/diagnosis/runs/[runId] GET] Upstream JSON parse error:',
            parseError,
          )
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.INTERNAL_ERROR,
            message: 'Upstream returned invalid JSON response',
          },
          status: upstreamResponse.status,
          snippet: raw.slice(0, 300),
        },
        { status: 502 },
      )
    }

    if (upstreamResponse.status === 404) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.RUN_NOT_FOUND,
            message: 'Diagnosis run not found',
          },
          runId,
        },
        { status: 404 },
      )
    }

    if (upstreamResponse.status === 504 || upstreamResponse.status === 408) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.INTERNAL_ERROR,
            message: 'Upstream timeout',
          },
          status: upstreamResponse.status,
          snippet: raw.slice(0, 300),
        },
        { status: 504 },
      )
    }

    if (upstreamResponse.status >= 500) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.INTERNAL_ERROR,
            message: 'Upstream error',
          },
          status: upstreamResponse.status,
          snippet: raw.slice(0, 300),
        },
        { status: 502 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Unexpected upstream response',
        },
        status: upstreamResponse.status,
        snippet: raw.slice(0, 300),
      },
      { status: 502 },
    )
  } catch (err) {
    console.error('[studio/diagnosis/runs/[runId] GET] Upstream error:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Failed to reach upstream',
        },
      },
      { status: 502 },
    )
  }
}
