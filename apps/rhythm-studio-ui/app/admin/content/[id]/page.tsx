import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import ContentPageEditor, { ContentPageEditorData } from '@/app/components/ContentPageEditor'

export const dynamic = 'force-dynamic'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type PageProps = {
  params: Promise<{ id: string }>
}

async function loadContentPage(key: string) {
  const adminClient = createAdminSupabaseClient()

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
    order_index,
    updated_at,
    created_at,
    deleted_at
  `

  const isUuid = UUID_REGEX.test(key)
  const baseQuery = adminClient
    .from('content_pages')
    .select(baseSelect)
    .eq(isUuid ? 'id' : 'slug', key)

  let contentPage: ContentPageEditorData | null = null
  let pageError: { code?: string; message?: string } | null = null

  ;({ data: contentPage, error: pageError } = await baseQuery.is('deleted_at', null).maybeSingle())

  if (pageError?.code === '42703') {
    const fallbackSelect = `
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
      order_index,
      updated_at,
      created_at
    `
    const fallbackQuery = adminClient
      .from('content_pages')
      .select(fallbackSelect)
      .eq(isUuid ? 'id' : 'slug', key)
    ;({ data: contentPage, error: pageError } = await fallbackQuery.maybeSingle())
  }

  if (pageError) {
    throw new Error(pageError.message || 'Fehler beim Laden der Content-Page')
  }

  if (!contentPage) {
    return null
  }

  return contentPage
}

export default async function EditContentPage({ params }: PageProps) {
  const { id } = await params

  if (!id) {
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
    contentPage = await loadContentPage(id)
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Fehler beim Laden'
  }

  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-red-500 mb-4">{loadError}</p>
          <Link
            href="/admin/content"
            className="inline-flex px-6 py-3 min-h-11 rounded-lg bg-sky-600 text-white text-sm md:text-base font-medium hover:bg-sky-700 transition touch-manipulation"
          >
            Zurück zur Übersicht
          </Link>
        </div>
      </main>
    )
  }

  if (!contentPage) {
    notFound()
  }

  if (UUID_REGEX.test(id) && contentPage.slug && contentPage.slug !== id) {
    redirect(`/admin/content/${contentPage.slug}`)
  }

  return (
    <ContentPageEditor mode="edit" pageId={contentPage.id} initialData={contentPage} />
  )
}
