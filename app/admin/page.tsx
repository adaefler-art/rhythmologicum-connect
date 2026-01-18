import { redirect } from 'next/navigation'
import { env } from '@/lib/env'
import { buildRedirectUrl, type RedirectSearchParams } from '@/lib/utils/redirects'

export const dynamic = 'force-dynamic'

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

  if (!target) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6 text-center">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Routing error</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Admin routing is temporarily unavailable. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  redirect(target)
}
