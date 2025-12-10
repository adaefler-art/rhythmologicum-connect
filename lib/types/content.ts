// Content page type definitions based on database schema

export type ContentPageSection = {
  id: string
  title: string
  body_markdown: string
  order_index: number
}

export type ContentPage = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body_markdown: string
  status: 'draft' | 'published'
  layout: string | null
  category: string | null
  priority: number
  funnel_id: string | null
  created_at: string
  updated_at: string
}

export type ContentPageWithFunnel = ContentPage & {
  funnel?: {
    id: string
    slug: string
    title: string
  }
  sections?: ContentPageSection[]
}
