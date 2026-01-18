import { redirect } from 'next/navigation'
import { env } from '@/lib/env'
import { buildRedirectUrl, type RedirectSearchParams } from '@/lib/utils/redirects'

export const dynamic = 'force-dynamic'

export default function PatientRedirectPage({
  searchParams,
}: {
  searchParams?: RedirectSearchParams
}) {
  const target = buildRedirectUrl({
    baseUrl: env.PATIENT_BASE_URL,
    pathPrefix: 'patient',
    searchParams,
  })

  redirect(target)
}
