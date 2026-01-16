/**
 * E6.5.6: Content Tiles Service
 * 
 * Service layer for fetching and transforming content tiles.
 * Converts from internal ContentTileData to dashboard ContentTile contract.
 */

import { getContentTiles, type ContentTileData } from '@/lib/data/contentTiles'
import { type ContentTile } from '@/lib/api/contracts/patient/dashboard'

/**
 * Maps content category to dashboard tile type
 */
function mapCategoryToType(category: string): ContentTile['type'] {
  switch (category) {
    case 'action':
      return 'action'
    case 'promotion':
      return 'promotion'
    case 'info':
    default:
      return 'info'
  }
}

/**
 * Converts ContentTileData to dashboard ContentTile contract
 */
function transformToContentTile(data: ContentTileData): ContentTile {
  return {
    id: data.id,
    type: mapCategoryToType(data.category),
    title: data.title,
    description: data.summary,
    actionLabel: null,
    actionTarget: data.href,
    priority: 100 - data.rank, // Invert rank so lower rank = higher priority
  }
}

/**
 * Fetches content tiles for dashboard
 * 
 * E6.5.6 AC1: Max tiles N
 * E6.5.6 AC2: Deterministic ordering (rank asc, slug asc)
 * E6.5.6 AC3: Returns tiles ready for navigation
 * 
 * @param maxTiles - Maximum number of tiles to return
 * @returns Array of content tiles ready for dashboard consumption
 */
export function fetchContentTilesForDashboard(maxTiles: number = 10): ContentTile[] {
  const tiles = getContentTiles(maxTiles)
  return tiles.map(transformToContentTile)
}
