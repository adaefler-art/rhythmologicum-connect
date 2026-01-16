import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { ContentPage } from '@/lib/types/content'
import ContentPageClient from './client'

type PageProps = {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

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
export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params

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

  // Fetch content page by slug
  // AC1: Unknown slug → 404 (not 500)
  // AC2: No PHI, no user-specific data required
  let contentPage: ContentPage | null = null

  try {
    const { data, error } = await supabase
      .from('content_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .is('deleted_at', null)
      .maybeSingle()

    if (error) {
      console.error('[CONTENT_PAGE] Database query error', {
        slug,
        errorMessage: error.message,
      })
      // Database errors should not expose internal details
      // Return 404 for safety
      notFound()
    }

    if (!data) {
      // AC1: Unknown slug → 404
      console.log('[CONTENT_PAGE] Content page not found', { slug })
      notFound()
    }

    contentPage = data as ContentPage
    console.log('[CONTENT_PAGE] Content page loaded successfully', {
      slug,
      title: contentPage.title,
    })
  } catch (err) {
    console.error('[CONTENT_PAGE] Unexpected error loading content', {
      slug,
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    // AC1: Don't expose 500 errors for unknown slugs
    notFound()
  }

  return <ContentPageClient contentPage={contentPage} />
}
