// Content page type definitions based on database schema

import { type ContentStatus } from '@/lib/contracts/registry'

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
  status: ContentStatus
  layout: string | null
  category: string | null
  priority: number
  funnel_id: string | null
  flow_step: string | null
  order_index: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  seo_title: string | null
  seo_description: string | null
}

export type ContentPageWithFunnel = ContentPage & {
  funnel?: {
    id: string
    slug: string
    title: string
  }
  sections?: ContentPageSection[]
}
