/**
 * V05-I02.1: Funnel Catalog Types
 * 
 * Type definitions for the funnel catalog API responses
 */

/**
 * Pillar represents a taxonomic category for organizing funnels
 */
export type Pillar = {
  id: string
  key: string
  title: string
  description: string | null
  sort_order: number
}

/**
 * FunnelVersion represents a specific version of a funnel
 */
export type FunnelVersion = {
  id: string
  funnel_id: string
  version: string
  is_default: boolean
}

/**
 * CatalogFunnel represents a funnel in the catalog
 */
export type CatalogFunnel = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  pillar_id: string | null
  pillar_key?: string | null
  pillar_title?: string | null
  est_duration_min: number | null
  outcomes: string[]
  is_active: boolean
  default_version_id: string | null
  default_version?: string | null
}

/**
 * PillarWithFunnels represents a pillar with its associated funnels
 */
export type PillarWithFunnels = {
  pillar: Pillar
  funnels: CatalogFunnel[]
}

/**
 * FunnelCatalogResponse is the response from GET /api/funnels/catalog
 */
export type FunnelCatalogResponse = {
  pillars: PillarWithFunnels[]
  uncategorized_funnels: CatalogFunnel[]
}

/**
 * FunnelDetailResponse is the response from GET /api/funnels/catalog/[slug]
 */
export type FunnelDetailResponse = {
  funnel: CatalogFunnel
  versions: FunnelVersion[]
  active_version: FunnelVersion | null
  default_version: FunnelVersion | null
}
