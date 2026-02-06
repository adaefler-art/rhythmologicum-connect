import { NextRequest, NextResponse } from 'next/server'

const getGitSha = () =>
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_GITHUB_COMMIT_SHA ||
  process.env.GIT_SHA ||
  process.env.COMMIT_SHA ||
  'unknown'

export function middleware(_request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('x-studio-build-sha', getGitSha())
  response.headers.set('x-studio-app', 'rhythm-studio-ui')
  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
