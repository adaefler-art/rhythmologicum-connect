import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { ContentPage } from '@/lib/types/content'
import { DEFAULT_PATIENT_FUNNEL } from '@/lib/config/funnelAllowlist'
import { getCanonicalFunnelSlug } from '@/lib/contracts/registry'
import { withValidatedContentBlocks } from '@/lib/utils/contentBlocks'
import { getContentPage } from '@/lib/utils/contentResolver'
import ContentPageClient from './client'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export const dynamic = 'force-dynamic'

function getSlugCandidates(rawSlug: string): string[] {
  const decoded = (() => {
    try {
      return decodeURIComponent(rawSlug)
    } catch {
      return rawSlug
    }
  })()

  const candidates = new Set<string>()
  const baseValues = [rawSlug, decoded]

  for (const value of baseValues) {
    const trimmed = value.trim()
    if (!trimmed) {
      continue
    }

    const lower = trimmed.toLowerCase()
    candidates.add(lower)
    candidates.add(lower.replace(/\s+/g, '-'))
    candidates.add(lower.replace(/-/g, ' '))
  }

  return Array.from(candidates)
}

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
              href="/patient/start"
              className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              Zurück zum Start
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
  const { slug: rawSlug } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const slugCandidates = getSlugCandidates(rawSlug)
  const contentId = typeof resolvedSearchParams?.id === 'string' ? resolvedSearchParams.id : undefined
  const funnelParam =
    typeof resolvedSearchParams?.funnel === 'string' ? resolvedSearchParams.funnel : undefined
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
    if (contentId) {
      const { data: byIdContent, error: byIdError } = await supabase
        .from('content_pages')
        .select('*')
        .eq('id', contentId)
        .eq('status', 'published')
        .is('deleted_at', null)
        .maybeSingle()

      if (byIdError) {
        console.warn('[CONTENT_PAGE] ID lookup failed, falling back to slug', {
          slug: rawSlug,
          contentId,
          errorCode: byIdError.code,
          errorMessage: byIdError.message,
        })
      }

      if (byIdContent) {
        return <ContentPageClient contentPage={withValidatedContentBlocks(byIdContent as ContentPage)} />
      }
    }

    const { data: exactContent, error: exactError } = await supabase
      .from('content_pages')
      .select('*')
      .eq('status', 'published')
      .is('deleted_at', null)
      .in('slug', slugCandidates)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (exactError) {
      console.warn('[CONTENT_PAGE] Exact slug lookup failed, falling back to resolver', {
        slug: rawSlug,
        slugCandidates,
        errorCode: exactError.code,
        errorMessage: exactError.message,
      })
    }

    if (exactContent) {
      return <ContentPageClient contentPage={withValidatedContentBlocks(exactContent as ContentPage)} />
    }

    const resolverSlug = slugCandidates[0] ?? rawSlug
    const result = await getContentPage({ funnel, slug: resolverSlug })

    if (!result.page) {
      console.warn('[CONTENT_PAGE] Content page not found via resolver', {
        slug: rawSlug,
        slugCandidates,
        funnel,
        strategy: result.strategy,
        error: result.error,
      })
      return <ContentNotFoundState slug={rawSlug} funnel={funnel} />
    }

    const contentPage = withValidatedContentBlocks(result.page as ContentPage)
    console.log('[CONTENT_PAGE] Content page loaded successfully', {
      slug: rawSlug,
      funnel,
      title: contentPage.title,
    })

    return <ContentPageClient contentPage={contentPage} />
  } catch (err) {
    console.error('[CONTENT_PAGE] Unexpected error loading content', {
      slug: rawSlug,
      slugCandidates,
      funnel,
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return <ContentNotFoundState slug={rawSlug} funnel={funnel} />
  }
}
