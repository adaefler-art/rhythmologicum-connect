import { redirect } from 'next/navigation'
import { env } from '@/lib/env'
import { buildRedirectUrl, type RedirectSearchParams } from '@/lib/utils/redirects'

export const dynamic = 'force-dynamic'

export default function ClinicianRedirectPage({
  searchParams,
}: {
  searchParams?: RedirectSearchParams
}) {
  const target = buildRedirectUrl({
    baseUrl: env.STUDIO_BASE_URL,
    pathPrefix: 'clinician',
    searchParams,
  })

  redirect(target)
}
