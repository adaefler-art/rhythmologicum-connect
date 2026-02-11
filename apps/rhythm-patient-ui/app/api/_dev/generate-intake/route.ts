import { NextRequest, NextResponse } from 'next/server'
import { POST as generateIntake } from '@/app/api/clinical-intake/generate/route'
import { env } from '@/lib/env'

type GenerateErrorResponse = {
  success: false
  error: {
    code: string
    message: string
  }
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const devtoolsEnabled = url.searchParams.has('devtools')
  const isDev = env.NODE_ENV !== 'production'

  if (!devtoolsEnabled && !isDev) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Not found',
        },
      } satisfies GenerateErrorResponse,
      { status: 404 },
    )
  }

  const body = await request.text()
  const forwardUrl = new URL('/api/clinical-intake/generate', request.url)
  const forwardRequest = new NextRequest(forwardUrl, {
    method: 'POST',
    headers: request.headers,
    body,
  })

  return generateIntake(forwardRequest)
}
