import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import ContentPageEditor, { ContentPageEditorData } from '@/app/components/ContentPageEditor'

export const dynamic = 'force-dynamic'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type PageProps = {
  params: Promise<{ slug: string }>
}

function normalizeContentPage(raw: {
  id: string
  title: string | null
  slug: string | null
  excerpt: string | null
  body_markdown: string | null
  status: string | null
  category: string | null
  priority: number | null
  funnel_id: string | null
  flow_step: string | null
  order_index: number | null
  layout: string | null
}): ContentPageEditorData {
  return {
    id: raw.id,
    title: raw.title ?? '',
    slug: raw.slug ?? '',
    excerpt: raw.excerpt ?? '',
    body_markdown: raw.body_markdown ?? '',
    status: raw.status === 'published' ? 'published' : 'draft',
    category: raw.category ?? '',
    priority: raw.priority ?? 0,
    funnel_id: raw.funnel_id,
    flow_step: raw.flow_step,
    order_index: raw.order_index,
    layout: raw.layout,
  }
}

function toLookupCandidates(rawKey: string): string[] {
  const decodedKey = decodeURIComponent(rawKey)
  const cleanedCandidates = [rawKey, decodedKey]
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  const uniqueCandidates = Array.from(new Set(cleanedCandidates))
  return uniqueCandidates
}

async function fetchContentPageByKey(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  key: string,
) {
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

  const { data: exactMatch, error: exactMatchError } = await supabase
    .from('content_pages')
    .select(baseSelect)
    .eq(isUuid ? 'id' : 'slug', key)
    .maybeSingle()

  if (exactMatchError) {
    throw new Error('Fehler beim Laden der Content-Page')
  }

  if (exactMatch) {
    return normalizeContentPage(exactMatch)
  }

  if (isUuid) {
    return null
  }

  const { data: slugMatch, error: slugMatchError } = await supabase
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

  return normalizeContentPage(row)
}

async function fetchContentPageByKeyViaApi(key: string): Promise<ContentPageEditorData | null> {
  const headerList = await headers()
  const host = headerList.get('host')
  if (!host) return null

  const protocol = host.includes('localhost') ? 'http' : 'https'
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')

  const response = await fetch(new URL(`/api/admin/content-pages/${key}`, `${protocol}://${host}`), {
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    cache: 'no-store',
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as {
    contentPage?: {
      id: string
      title: string | null
      slug: string | null
      excerpt: string | null
      body_markdown: string | null
      status: string | null
      category: string | null
      priority: number | null
      funnel_id: string | null
      flow_step: string | null
      order_index: number | null
      layout: string | null
    } | null
  }

  if (!payload.contentPage) return null
  return normalizeContentPage(payload.contentPage)
}

async function loadContentPage(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  rawKey: string,
) {
  const lookupCandidates = toLookupCandidates(rawKey)

  for (const candidate of lookupCandidates) {
    const contentPage = await fetchContentPageByKey(supabase, candidate)
    if (contentPage) {
      return contentPage
    }

    const apiFallback = await fetchContentPageByKeyViaApi(candidate)
    if (apiFallback) {
      return apiFallback
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
    contentPage = await loadContentPage(supabase, slug)
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

  return (
    <div className="p-6">
      <ContentPageEditor mode="edit" pageId={contentPage.id} initialData={contentPage} />
    </div>
  )
}
