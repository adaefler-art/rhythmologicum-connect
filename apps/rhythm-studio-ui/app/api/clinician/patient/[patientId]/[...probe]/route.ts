import { NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ patientId: string; probe: string[] }>
}

const getGitSha = () =>
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_GITHUB_COMMIT_SHA ||
  process.env.GIT_SHA ||
  process.env.COMMIT_SHA ||
  'unknown'

const getEnvValue = (name: string) => process.env[name] || 'unknown'

const buildProbeResponse = async (request: Request, context: RouteContext) => {
  const { patientId } = await context.params
  const pathname = new URL(request.url).pathname

  return NextResponse.json(
    {
      error: 'UNKNOWN_PATIENT_API_PATH',
      patientId,
      requested: pathname,
      hint: 'This path is not implemented in this deploy.',
      build: {
        gitSha: getGitSha(),
        vercelEnv: getEnvValue('VERCEL_ENV'),
      },
      knownCanonicals: [
        '/api/clinician/patient/[patientId]/anamnesis',
        '/api/clinician/patient/[patientId]/diagnosis/runs',
        '/api/clinician/patient/[patientId]/results',
        '/api/clinician/patient/[patientId]/amy-insights',
      ],
    },
    { status: 501 },
  )
}

export const GET = buildProbeResponse
export const POST = buildProbeResponse
export const PUT = buildProbeResponse
export const PATCH = buildProbeResponse
export const DELETE = buildProbeResponse
