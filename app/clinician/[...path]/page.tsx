import { redirect } from 'next/navigation'
import { env } from '@/lib/env'
import { buildRedirectUrl, type RedirectSearchParams } from '@/lib/utils/redirects'

export const dynamic = 'force-dynamic'

export default function ClinicianRedirectPathPage({
  params,
  searchParams,
}: {
  params: { path?: string[] }
  searchParams?: RedirectSearchParams
}) {
  const target = buildRedirectUrl({
    baseUrl: env.STUDIO_BASE_URL,
    pathPrefix: 'clinician',
    pathSegments: params.path,
    searchParams,
  })

  redirect(target)
}
