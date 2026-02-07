import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import ContentPageEditor, { ContentPageEditorData } from '@/app/components/ContentPageEditor'

export const dynamic = 'force-dynamic'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type PageProps = {
  params: { slug: string }
}

async function loadContentPage(key: string) {
  const headerList = await headers()
  const host = headerList.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'

  if (!host) {
    throw new Error('Fehler beim Laden der Content-Page')
  }

  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')

  const url = new URL(`/api/admin/content-pages/${key}`, `${protocol}://${host}`)

  const response = await fetch(url.toString(), {
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    cache: 'no-store',
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error('Fehler beim Laden der Content-Page')
  }

  const data = (await response.json()) as { contentPage?: ContentPageEditorData | null }
  return data.contentPage ?? null
}

export default async function EditContentPage({ params }: PageProps) {
  const { slug } = params

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
