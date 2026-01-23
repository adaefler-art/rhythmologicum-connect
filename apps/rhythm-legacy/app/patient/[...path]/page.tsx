import { redirect } from 'next/navigation'
import { getEngineEnv } from '@/lib/env'
import { buildRedirectUrl, type RedirectSearchParams } from '@/lib/utils/redirects'

export const dynamic = 'force-dynamic'

export default function PatientRedirectPathPage({
  params,
  searchParams,
}: {
  params: { path?: string[] }
  searchParams?: RedirectSearchParams
}) {
  const engineEnv = getEngineEnv()
  const target = buildRedirectUrl({
    baseUrl: engineEnv.PATIENT_BASE_URL,
    pathPrefix: 'patient',
    pathSegments: params.path,
    searchParams,
  })

  if (!target) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6 text-center">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Routing error</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Patient routing is temporarily unavailable. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  redirect(target)
}
