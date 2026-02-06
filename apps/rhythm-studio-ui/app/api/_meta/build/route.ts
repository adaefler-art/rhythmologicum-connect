import { NextResponse } from 'next/server'

const BUILD_TIME = new Date().toISOString()

const getGitSha = () =>
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_GITHUB_COMMIT_SHA ||
  process.env.GIT_SHA ||
  process.env.COMMIT_SHA ||
  'unknown'

const getEnvValue = (name: string) => process.env[name] || 'unknown'

export async function GET() {
  return NextResponse.json({
    app: 'rhythm-studio-ui',
    gitSha: getGitSha(),
    buildTime: BUILD_TIME,
    vercelEnv: getEnvValue('VERCEL_ENV'),
    vercelUrl: getEnvValue('VERCEL_URL'),
  })
}
