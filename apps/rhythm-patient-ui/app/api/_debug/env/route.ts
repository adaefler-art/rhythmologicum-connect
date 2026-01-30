import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

export async function GET() {
  const commitSha =
    env.VERCEL_GIT_COMMIT_SHA || env.GIT_COMMIT_SHA || env.COMMIT_SHA || null

  return NextResponse.json({
    hasServiceRoleKey: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    hasServiceKey: Boolean(env.SUPABASE_SERVICE_KEY),
    hasUrl: Boolean(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL),
    vercelEnv: env.VERCEL_ENV ?? null,
    commitSha,
  })
}
