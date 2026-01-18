import { redirect } from 'next/navigation'
import { env } from '@/lib/env'
import { buildRedirectUrl, type RedirectSearchParams } from '@/lib/utils/redirects'

export default function AdminRedirectPage({
  searchParams,
}: {
  searchParams?: RedirectSearchParams
}) {
  const target = buildRedirectUrl({
    baseUrl: env.STUDIO_BASE_URL,
    pathPrefix: 'admin',
    searchParams,
  })

  redirect(target)
}
