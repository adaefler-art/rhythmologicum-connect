import { Metadata } from 'next'
import ContentPageClient from './client'
import { env } from '@/lib/env'

type PageProps = {
  params: Promise<{ slug: string }>
}

/**
 * F7: Generate metadata for content pages with optional SEO fields
 * Falls back to title/excerpt if SEO fields are not set
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const apiUrl = env.NEXT_PUBLIC_SUPABASE_URL
      ? `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')}/rest/v1/content_pages`
      : null

    if (!apiUrl) {
      return {
        title: 'Rhythmologicum Connect',
        description: 'Stress- & Resilienz-Assessment Plattform',
      }
    }

    // Fetch content page to get SEO metadata
    // Build query URL using URLSearchParams for safety
    const queryUrl = new URL(apiUrl)
    queryUrl.searchParams.set('slug', `eq.${slug}`)
    queryUrl.searchParams.set('status', 'eq.published')
    queryUrl.searchParams.set('select', 'title,excerpt,seo_title,seo_description')

    const response = await fetch(queryUrl.toString(), {
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
      },
      // Revalidate every hour
      next: { revalidate: 3600 },
    })

    if (!response.ok || response.status === 404) {
      return {
        title: 'Seite nicht gefunden | Rhythmologicum Connect',
        description: 'Die angeforderte Seite konnte nicht gefunden werden.',
      }
    }

    const data = await response.json()
    const page = data[0]

    if (!page) {
      return {
        title: 'Seite nicht gefunden | Rhythmologicum Connect',
        description: 'Die angeforderte Seite konnte nicht gefunden werden.',
      }
    }

    // Use SEO fields if available, otherwise fallback to title/excerpt
    // If seo_title is set, use it as-is (may already include branding)
    // Otherwise, append branding to title
    const title = page.seo_title
      ? page.seo_title
      : page.title
        ? `${page.title} | Rhythmologicum Connect`
        : 'Rhythmologicum Connect'
    const description =
      page.seo_description || page.excerpt || 'Stress- & Resilienz-Assessment Plattform'

    return {
      title,
      description,
    }
  } catch (error) {
    console.error('Error generating metadata for content page:', error)
    return {
      title: 'Rhythmologicum Connect',
      description: 'Stress- & Resilienz-Assessment Plattform',
    }
  }
}

/**
 * F7: Content page renderer
 * Displays published content pages at /content/[slug]
 * Returns 404 for non-existent or unpublished pages
 */
export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params

  // Let the client component handle the API call and 404 logic
  // Server-side pre-fetching would require absolute URLs which are environment-dependent
  return <ContentPageClient slug={slug} />
}
