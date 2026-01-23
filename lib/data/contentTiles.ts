/**
 * E6.5.6: Content Tiles Data Source
 * 
 * NOTE: Static tiles have been removed. Dashboard tiles are now fetched
 * from published rows in content_pages to avoid hardcoded slugs.
 */

/**
 * Minimal content tile model for E6.5.6
 */
export interface ContentTileData {
  id: string
  slug: string
  title: string
  summary: string
  category: string
  href: string
  rank: number
}

/**
 * Static content tiles data source
 * E6.5.6 AC1: Max tiles N (using 8 tiles for MVP)
 */
export const CONTENT_TILES_DATA: ContentTileData[] = []

/**
 * E6.5.6 AC2: Deterministic ordering function
 * 
 * Sorts tiles by:
 * 1. rank (ascending - lower rank = higher priority)
 * 2. slug (ascending - lexicographic)
 * 
 * Pure function, no localeCompare to avoid platform drift.
 */
export function sortContentTilesDeterministic(tiles: ContentTileData[]): ContentTileData[] {
  return [...tiles].sort((a, b) => {
    // Primary sort: rank ascending
    if (a.rank !== b.rank) {
      return a.rank - b.rank
    }
    
    // Secondary sort: slug ascending (lexicographic)
    // Using simple string comparison for deterministic behavior
    if (a.slug < b.slug) return -1
    if (a.slug > b.slug) return 1
    return 0
  })
}

/**
 * Get content tiles with deterministic ordering and max limit
 * 
 * E6.5.6 AC1: Max tiles N
 * E6.5.6 AC2: Deterministic ordering (rank asc, slug asc)
 * 
 * @param maxTiles - Maximum number of tiles to return (default: 10)
 * @returns Sorted and limited content tiles
 */
export function getContentTiles(maxTiles: number = 10): ContentTileData[] {
  const sorted = sortContentTilesDeterministic(CONTENT_TILES_DATA)
  return sorted.slice(0, maxTiles)
}
