import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import ContentPageEditor, { ContentPageEditorData } from '@/app/components/ContentPageEditor'

export const dynamic = 'force-dynamic'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type PageProps = {
  params: Promise<{ slug: string }>
}

function toLookupCandidates(rawKey: string): string[] {
  const decodedKey = decodeURIComponent(rawKey)
  const cleanedCandidates = [rawKey, decodedKey]
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  const uniqueCandidates = Array.from(new Set(cleanedCandidates))
  return uniqueCandidates
}

async function fetchContentPageByKey(key: string) {
  const adminClient = createAdminSupabaseClient()
  const isUuid = UUID_REGEX.test(key)

  const baseSelect = `
    id,
    slug,
    title,
    excerpt,
    body_markdown,
    status,
    layout,
    category,
    priority,
    funnel_id,
    flow_step,
    order_index
  `

  const { data: exactMatch, error: exactMatchError } = await adminClient
    .from('content_pages')
    .select(baseSelect)
    .eq(isUuid ? 'id' : 'slug', key)
    .maybeSingle()

  if (exactMatchError) {
    throw new Error('Fehler beim Laden der Content-Page')
  }

  if (exactMatch) {
    return {
      id: exactMatch.id,
      title: exactMatch.title ?? '',
      slug: exactMatch.slug ?? '',
      excerpt: exactMatch.excerpt ?? '',
      body_markdown: exactMatch.body_markdown ?? '',
      status: exactMatch.status === 'published' ? 'published' : 'draft',
      category: exactMatch.category ?? '',
      priority: exactMatch.priority ?? 0,
      funnel_id: exactMatch.funnel_id,
      flow_step: exactMatch.flow_step,
      order_index: exactMatch.order_index,
      layout: exactMatch.layout,
    } satisfies ContentPageEditorData
  }

  if (isUuid) {
    return null
  }

  const { data: slugMatch, error: slugMatchError } = await adminClient
    .from('content_pages')
    .select(baseSelect)
    .ilike('slug', key)
    .limit(1)

  if (slugMatchError) {
    throw new Error('Fehler beim Laden der Content-Page')
  }

  const row = Array.isArray(slugMatch) && slugMatch.length > 0 ? slugMatch[0] : null
  if (!row) {
    return null
  }

  return {
    id: row.id,
    title: row.title ?? '',
    slug: row.slug ?? '',
    excerpt: row.excerpt ?? '',
    body_markdown: row.body_markdown ?? '',
    status: row.status === 'published' ? 'published' : 'draft',
    category: row.category ?? '',
    priority: row.priority ?? 0,
    funnel_id: row.funnel_id,
    flow_step: row.flow_step,
    order_index: row.order_index,
    layout: row.layout,
  } satisfies ContentPageEditorData
}

async function loadContentPage(rawKey: string) {
  const lookupCandidates = toLookupCandidates(rawKey)

  for (const candidate of lookupCandidates) {
    const contentPage = await fetchContentPageByKey(candidate)
    if (contentPage) {
      return contentPage
    }
  }

  return null
}

export default async function EditContentPage({ params }: PageProps) {
  const { slug } = await params

  if (!slug) {
    notFound()
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const role = user.app_metadata?.role || user.user_metadata?.role
  if (role !== 'clinician' && role !== 'admin') {
    redirect('/')
  }

  let contentPage: ContentPageEditorData | null = null
  let loadError: string | null = null

  try {
    contentPage = await loadContentPage(slug)
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Fehler beim Laden'
  }

  if (loadError) {
    return (
      <div className="p-6">
        <div className="max-w-md">
          <p className="text-red-500 mb-4">{loadError}</p>
          <Link
            href="/admin/content"
            className="inline-flex px-6 py-3 min-h-11 rounded-lg bg-sky-600 text-white text-sm md:text-base font-medium hover:bg-sky-700 transition touch-manipulation"
          >
            Zurueck zur Uebersicht
          </Link>
        </div>
      </div>
    )
  }

  if (!contentPage) {
    notFound()
  }

  if (UUID_REGEX.test(slug) && contentPage.slug && contentPage.slug !== slug) {
    redirect(`/admin/content/${contentPage.slug}`)
  }

  return (
    <div className="p-6">
      <ContentPageEditor mode="edit" pageId={contentPage.id} initialData={contentPage} />
    </div>
  )
}
