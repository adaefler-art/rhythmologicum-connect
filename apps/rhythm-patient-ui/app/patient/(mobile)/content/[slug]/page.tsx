import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { ContentPage } from '@/lib/types/content'
import { DEFAULT_PATIENT_FUNNEL } from '@/lib/config/funnelAllowlist'
import { getCanonicalFunnelSlug } from '@/lib/contracts/registry'
import { getContentPage } from '@/lib/utils/contentResolver'
import ContentPageClient from './client'

type PageProps = {
  params: { slug: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

export const dynamic = 'force-dynamic'

function ContentNotFoundState({ slug, funnel }: { slug: string; funnel: string }) {
  return (
    <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-[#1f2937]">Content nicht gefunden</h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            Der angeforderte Inhalt konnte nicht geladen werden. Bitte prüfen Sie den Link
            oder versuchen Sie es später erneut.
          </p>
          <p className="mt-4 text-xs text-[#9ca3af]">
            Slug: {slug} · Funnel: {funnel}
          </p>
          <div className="mt-6">
            <Link
              href="/patient/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              Zurück zum Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * E6.5.7: Content Page Rendering (Read-only MVP, Patient-safe)
 * 
 * Route: /patient/content/[slug]
 * 
 * Acceptance Criteria:
 * - AC1: Unknown slug → 404 (not 500)
 * - AC2: No PHI, no user-specific data required
 * - AC3: Back navigation to dashboard
 */
export default async function ContentPage({ params, searchParams }: PageProps) {
  const { slug } = params
  const funnelParam = typeof searchParams?.funnel === 'string' ? searchParams.funnel : undefined
  const funnel = funnelParam ? getCanonicalFunnelSlug(funnelParam) : DEFAULT_PATIENT_FUNNEL

  // Create Supabase server client
  let supabase
  try {
    supabase = await createServerSupabaseClient()
  } catch (err) {
    console.error('[CONTENT_PAGE] Failed to create Supabase client', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    redirect('/?error=configuration_error')
  }

  // Check authentication
  let user
  try {
    const { data, error } = await supabase.auth.getUser()
    user = data?.user
    if (error) {
      console.error('[CONTENT_PAGE] Auth error', {
        errorMessage: error.message,
      })
    }
  } catch (err) {
    console.error('[CONTENT_PAGE] Failed to get user', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    redirect('/?error=auth_error')
  }

  if (!user) {
    console.log('[CONTENT_PAGE] User not authenticated, redirecting to login')
    redirect('/')
  }

  // Fetch content page via canonical resolver (funnel-aware)
  // AC1: Unknown slug → Content not found UI (not 500)
  // AC2: No PHI, no user-specific data required
  try {
    const result = await getContentPage({ funnel, slug })

    if (!result.page) {
      console.warn('[CONTENT_PAGE] Content page not found via resolver', {
        slug,
        funnel,
        strategy: result.strategy,
        error: result.error,
      })
      return <ContentNotFoundState slug={slug} funnel={funnel} />
    }

    const contentPage = result.page as ContentPage
    console.log('[CONTENT_PAGE] Content page loaded successfully', {
      slug,
      funnel,
      title: contentPage.title,
    })

    return <ContentPageClient contentPage={contentPage} />
  } catch (err) {
    console.error('[CONTENT_PAGE] Unexpected error loading content', {
      slug,
      funnel,
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return <ContentNotFoundState slug={slug} funnel={funnel} />
  }
}
