import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { ContentPageWithFunnel } from '@/lib/types/content'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'

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

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params

  if (!slug) {
    notFound()
  }

  const contentPage = await loadContentPage(slug)

  if (!contentPage) {
    notFound()
  }

  const layoutClass =
    contentPage.layout === 'wide'
      ? 'max-w-5xl'
      : contentPage.layout === 'hero'
        ? 'max-w-7xl'
        : 'max-w-3xl'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-50">
      <main className={`${layoutClass} mx-auto px-4 py-8 sm:py-12`}>
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 sm:px-8 py-8 sm:py-12">
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
