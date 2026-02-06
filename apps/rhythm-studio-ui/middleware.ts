import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

const getGitSha = () => env.VERCEL_GIT_COMMIT_SHA || env.GIT_COMMIT_SHA || env.COMMIT_SHA || 'unknown'

export function middleware(_request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('x-studio-build-sha', getGitSha())
  response.headers.set('x-studio-app', 'rhythm-studio-ui')
  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
