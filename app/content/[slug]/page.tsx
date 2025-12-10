import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ContentPageClient from './client'

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
    const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')}/rest/v1/content_pages`
      : null

    if (!apiUrl) {
      return {
        title: 'Rhythmologicum Connect',
        description: 'Stress- & Resilienz-Assessment Plattform',
      }
    }

    // Fetch content page to get SEO metadata
    const response = await fetch(
      `${apiUrl}?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=title,excerpt,seo_title,seo_description`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
        },
        // Revalidate every hour
        next: { revalidate: 3600 },
      },
    )

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
    const title = page.seo_title || page.title || 'Rhythmologicum Connect'
    const description =
      page.seo_description || page.excerpt || 'Stress- & Resilienz-Assessment Plattform'

    return {
      title: `${title} | Rhythmologicum Connect`,
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

  // Pre-fetch to check if page exists (for 404 handling)
  try {
    const response = await fetch(`/api/content-pages/${slug}`, {
      // Use absolute URL in server component
      next: { revalidate: 3600 },
    })

    if (!response.ok && response.status === 404) {
      notFound()
    }
  } catch (error) {
    // If we can't check, let the client component handle it
    console.error('Error pre-fetching content page:', error)
  }

  return <ContentPageClient slug={slug} />
}
