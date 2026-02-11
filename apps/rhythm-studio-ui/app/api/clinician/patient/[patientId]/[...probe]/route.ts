import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

type RouteContext = {
  params: Promise<{ patientId: string; probe: string[] }>
}

const getGitSha = () => env.VERCEL_GIT_COMMIT_SHA || env.GIT_COMMIT_SHA || env.COMMIT_SHA || 'unknown'

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
        vercelEnv: env.VERCEL_ENV || 'unknown',
      },
      knownCanonicals: [
        '/api/clinician/patient/[patientId]/anamnesis',
        '/api/clinician/patient/[patientId]/clinical-intake/latest',
        '/api/clinician/patient/[patientId]/clinical-intake/history',
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
