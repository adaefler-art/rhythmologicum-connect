import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const START_SLIDER_TAG = 'start-slider'
const MAX_SLIDER_ITEMS = 10

type SliderRow = {
  id: string
  slug: string | null
  title: string | null
  excerpt: string | null
  priority: number | null
  created_at: string
}

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Nicht angemeldet.' } },
      { status: 401 },
    )
  }

  const { data, error } = await supabase
    .from('content_pages')
    .select('id, slug, title, excerpt, priority, created_at')
    .eq('status', 'published')
    .is('deleted_at', null)
    .ilike('category', START_SLIDER_TAG)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(MAX_SLIDER_ITEMS)

  if (error) {
    console.error('[patient/content-slider] failed to load slider content', {
      errorCode: error.code,
      errorMessage: error.message,
    })

    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Inhalte konnten nicht geladen werden.' } },
      { status: 500 },
    )
  }

  const items = (data as SliderRow[])
    .filter((row) => !!row.slug)
    .map((row) => ({
      id: row.id,
      title: row.title ?? 'Inhalt',
      excerpt: row.excerpt ?? '',
      actionTarget: `/patient/content/${row.slug}`,
      priority: row.priority ?? 0,
    }))

  return NextResponse.json({
    success: true,
    data: {
      tag: START_SLIDER_TAG,
      items,
    },
  })
}
