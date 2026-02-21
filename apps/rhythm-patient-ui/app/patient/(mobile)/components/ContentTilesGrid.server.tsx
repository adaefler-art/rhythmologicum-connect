import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { ContentTile } from '@/lib/api/contracts/patient/dashboard'
import { ContentTilesGrid } from './ContentTilesGrid'

type ContentTileRow = {
  id: string
  slug: string | null
  title: string | null
  excerpt: string | null
  updated_at: string | null
}

function buildContentActionTarget(slug: string, id: string): string {
  const encodedSlug = encodeURIComponent(slug)
  const params = new URLSearchParams({ id })
  return `/patient/content/${encodedSlug}?${params.toString()}`
}

const MAX_TILES = 12

async function fetchContentTiles(): Promise<ContentTile[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('content_pages')
    .select('id, slug, title, excerpt, updated_at')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(MAX_TILES)

  if (error) {
    console.error('[ContentTilesGridServer] Failed to load content tiles', {
      errorCode: error.code,
      errorMessage: error.message,
    })
    return []
  }

  return (data as ContentTileRow[])
    .filter((row) => !!row.slug)
    .map((row) => ({
      id: row.id,
      type: 'info',
      title: row.title ?? 'Inhalt',
      description: row.excerpt ?? '',
      actionLabel: null,
      actionTarget: buildContentActionTarget(String(row.slug), row.id),
      priority: 0,
    }))
}

export default async function ContentTilesGridServer() {
  const tiles = await fetchContentTiles()
  return <ContentTilesGrid tiles={tiles} />
}
