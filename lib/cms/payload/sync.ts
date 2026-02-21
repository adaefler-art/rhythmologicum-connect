import 'server-only'

import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import type { ContentBlock } from '@/lib/contracts/contentBlocks'
import { parseContentBlocks } from '@/lib/contracts/contentBlocks'
import type { Database } from '@/lib/types/supabase'

const PayloadContentDocSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((value) => String(value)),
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().nullable().optional(),
  body_markdown: z.string().optional(),
  status: z.string().optional(),
  layout: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  priority: z.number().int().optional(),
  flow_step: z.string().nullable().optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  teaser_image_url: z.string().nullable().optional(),
  funnel_slug: z.string().nullable().optional(),
  updatedAt: z.string().optional(),
  updated_at: z.string().optional(),
  blocks: z.unknown().optional(),
})

const PayloadResponseSchema = z.object({
  docs: z.array(PayloadContentDocSchema),
  totalDocs: z.number().optional(),
})

type PayloadContentDoc = z.infer<typeof PayloadContentDocSchema>

type ContentPageInsert = Database['public']['Tables']['content_pages']['Insert']

export type SyncPayloadOptions = {
  dryRun?: boolean
  slug?: string
  publishedOnly?: boolean
}

export type SyncPayloadResult = {
  success: boolean
  dryRun: boolean
  sourceCount: number
  processedCount: number
  upsertedCount: number
  skippedCount: number
  errors: string[]
}

function normalizePayloadBlocks(raw: unknown): unknown {
  if (!Array.isArray(raw)) {
    return raw
  }

  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') {
      return item
    }

    const candidate = item as Record<string, unknown>
    return {
      ...candidate,
      id:
        typeof candidate.id === 'string' && candidate.id.length > 0
          ? candidate.id
          : `block-${index + 1}`,
      order:
        typeof candidate.order === 'number' && Number.isInteger(candidate.order)
          ? candidate.order
          : index,
    }
  })
}

function blockToMarkdown(block: ContentBlock): string {
  switch (block.type) {
    case 'hero': {
      const lines = [`## ${block.title}`]
      if (block.subtitle) lines.push('', block.subtitle)
      if (block.imageUrl) lines.push('', `![${block.imageAlt ?? ''}](${block.imageUrl})`)
      return lines.join('\n')
    }
    case 'rich_text':
      return block.markdown
    case 'image': {
      const lines = [`![${block.alt ?? ''}](${block.imageUrl})`]
      if (block.caption) lines.push('', `_${block.caption}_`)
      return lines.join('\n')
    }
    case 'badge': {
      const lines = [`**${block.label}**`]
      if (block.text) lines.push('', block.text)
      return lines.join('\n')
    }
    case 'cta':
      return `[${block.label}](${block.href})`
    default:
      return ''
  }
}

export function buildFallbackMarkdown(blocks: ContentBlock[]): string {
  return blocks.map((block) => blockToMarkdown(block)).filter(Boolean).join('\n\n').trim()
}

export function mapPayloadDocToContentPageInsert(
  doc: PayloadContentDoc,
  funnelId: string | null,
): ContentPageInsert {
  const parsedBlocks = parseContentBlocks(normalizePayloadBlocks(doc.blocks))
  const bodyMarkdownFromBlocks = parsedBlocks ? buildFallbackMarkdown(parsedBlocks) : ''
  const fallbackBodyMarkdown = (doc.body_markdown ?? '').trim()

  return {
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt ?? null,
    body_markdown: fallbackBodyMarkdown || bodyMarkdownFromBlocks || '',
    status:
      doc.status === 'published' || doc.status === 'archived' || doc.status === 'draft'
        ? doc.status
        : 'draft',
    layout: doc.layout ?? null,
    category: doc.category ?? null,
    priority: doc.priority ?? 0,
    funnel_id: funnelId,
    flow_step: doc.flow_step ?? null,
    seo_title: doc.seo_title ?? null,
    seo_description: doc.seo_description ?? null,
    teaser_image_url: doc.teaser_image_url ?? null,
    updated_at: new Date().toISOString(),
  }
}

async function fetchPayloadContentDocs(options: SyncPayloadOptions): Promise<PayloadContentDoc[]> {
  const baseUrl = process.env.CMS_PAYLOAD_BASE_URL
  const collection = process.env.CMS_PAYLOAD_COLLECTION ?? 'content-pages'
  const apiToken = process.env.CMS_PAYLOAD_API_TOKEN

  if (!baseUrl) {
    throw new Error('CMS_PAYLOAD_BASE_URL is not configured')
  }

  const url = new URL(`/api/${collection}`, baseUrl)
  url.searchParams.set('limit', '200')
  url.searchParams.set('depth', '0')

  if (options.slug) {
    url.searchParams.set('where[slug][equals]', options.slug)
  }

  if (options.publishedOnly !== false) {
    url.searchParams.set('where[status][equals]', 'published')
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Payload API request failed with status ${response.status}`)
  }

  const payload = await response.json()
  const parsed = PayloadResponseSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error('Payload API response schema invalid')
  }

  return parsed.data.docs
}

async function resolveFunnelIdBySlug(slug: string): Promise<string | null> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('funnels')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data?.id) {
    return null
  }

  return data.id
}

export async function syncPayloadContentPages(
  options: SyncPayloadOptions = {},
): Promise<SyncPayloadResult> {
  const dryRun = options.dryRun !== false
  const errors: string[] = []

  const docs = await fetchPayloadContentDocs(options)

  if (docs.length === 0) {
    return {
      success: true,
      dryRun,
      sourceCount: 0,
      processedCount: 0,
      upsertedCount: 0,
      skippedCount: 0,
      errors,
    }
  }

  const rows: ContentPageInsert[] = []
  let skippedCount = 0

  for (const doc of docs) {
    let funnelId: string | null = null
    if (doc.funnel_slug) {
      funnelId = await resolveFunnelIdBySlug(doc.funnel_slug)
      if (!funnelId) {
        errors.push(`Funnel slug not resolved for content '${doc.slug}': ${doc.funnel_slug}`)
      }
    }

    const row = mapPayloadDocToContentPageInsert(doc, funnelId)
    if (!row.slug || !row.title) {
      skippedCount += 1
      errors.push(`Skipped invalid content doc '${doc.id}'`) 
      continue
    }

    rows.push(row)
  }

  if (dryRun) {
    return {
      success: true,
      dryRun,
      sourceCount: docs.length,
      processedCount: rows.length,
      upsertedCount: 0,
      skippedCount,
      errors,
    }
  }

  const admin = createAdminSupabaseClient()
  const { error: upsertError } = await admin
    .from('content_pages')
    .upsert(rows, { onConflict: 'slug' })

  if (upsertError) {
    return {
      success: false,
      dryRun,
      sourceCount: docs.length,
      processedCount: rows.length,
      upsertedCount: 0,
      skippedCount,
      errors: [...errors, `Upsert failed: ${upsertError.message}`],
    }
  }

  return {
    success: errors.length === 0,
    dryRun,
    sourceCount: docs.length,
    processedCount: rows.length,
    upsertedCount: rows.length,
    skippedCount,
    errors,
  }
}
