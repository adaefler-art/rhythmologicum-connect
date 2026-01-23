import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { ContentPageWithFunnel } from '@/lib/types/content'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'
import { env } from '@/lib/env'

type PageProps = {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

async function loadContentPage(slug: string): Promise<ContentPageWithFunnel | null> {
  const supabase = await createServerSupabaseClient()

  const selectQuery = `
    *,
    funnel:funnels (
      id,
      slug,
      title
    )
  `

  const baseQuery = supabase
    .from('content_pages')
    .select(selectQuery)
    .eq('slug', slug)
    .eq('status', 'published')

  const { data: contentPage, error } = await baseQuery.is('deleted_at', null).single()

  if (error || !contentPage) {
    if (error?.code !== '42703') {
      return null
    }

    const { data: fallbackPage, error: fallbackError } = await baseQuery.single()
    if (fallbackError || !fallbackPage) {
      return null
    }

    const { data: fallbackSections } = await supabase
      .from('content_page_sections')
      .select('id, title, body_markdown, order_index')
      .eq('content_page_id', fallbackPage.id)
      .order('order_index', { ascending: true })

    return {
      ...(fallbackPage as ContentPageWithFunnel),
      sections: fallbackSections || [],
    }
  }

  const { data: sections } = await supabase
    .from('content_page_sections')
    .select('id, title, body_markdown, order_index')
    .eq('content_page_id', contentPage.id)
    .order('order_index', { ascending: true })

  return {
    ...(contentPage as ContentPageWithFunnel),
    sections: sections || [],
  }
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

  if (!slug) {
    notFound()
  }

  const contentPage = await loadContentPage(slug)

  if (!contentPage) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-neutral-50">
      <main className="w-full px-4 py-6 sm:py-10">
        <article className="w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-linear-to-r from-primary-600 to-primary-700 px-6 sm:px-8 py-8 sm:py-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              {contentPage.title}
            </h1>
            {contentPage.excerpt && (
              <p className="text-primary-100 text-lg leading-relaxed">
                {contentPage.excerpt}
              </p>
            )}
          </div>

          <div className="px-6 sm:px-8 py-8 sm:py-12">
            <MarkdownRenderer content={contentPage.body_markdown} />
          </div>

          {contentPage.sections && contentPage.sections.length > 0 && (
            <div className="border-t border-slate-200">
              {contentPage.sections.map((section) => (
                <div
                  key={section.id}
                  className="px-6 sm:px-8 py-8 sm:py-12 border-b border-slate-100 last:border-b-0"
                >
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    {section.title}
                  </h2>
                  <MarkdownRenderer content={section.body_markdown} />
                </div>
              ))}
            </div>
          )}
        </article>
      </main>
    </div>
  )
}
