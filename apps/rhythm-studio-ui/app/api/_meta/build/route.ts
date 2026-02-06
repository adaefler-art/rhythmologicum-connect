import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

const BUILD_TIME = new Date().toISOString()

const getGitSha = () => env.VERCEL_GIT_COMMIT_SHA || env.GIT_COMMIT_SHA || env.COMMIT_SHA || 'unknown'

export async function GET() {
  return NextResponse.json({
    app: 'rhythm-studio-ui',
    gitSha: getGitSha(),
    buildTime: BUILD_TIME,
    vercelEnv: env.VERCEL_ENV || 'unknown',
    vercelUrl: env.VERCEL_URL || env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID || 'unknown',
  })
}
