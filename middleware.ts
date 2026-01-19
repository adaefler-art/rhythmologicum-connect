import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getEngineEnv } from '@/lib/env'

export function middleware(_request: NextRequest) {
  try {
    getEngineEnv()
    return NextResponse.next()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Missing env'
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'missing_env',
          message,
        },
      },
      { status: 500 },
    )
  }
}

export const config = {
  matcher: ['/api/:path*'],
}
