/**
 * E6.5.6: Content Tiles MVP - Static Data Source
 * 
 * Minimal content tile model with deterministic ordering.
 * Source: Static JSON (no CMS yet)
 * 
 * Model:
 * - id: unique identifier
 * - slug: URL-safe identifier
 * - title: display title
 * - summary: short description
 * - category: content category
 * - href: internal navigation target
 * - rank: explicit numeric ordering (lower = higher priority)
 * 
 * Ordering: rank ASC, slug ASC (deterministic, no localeCompare drift)
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
export const CONTENT_TILES_DATA: ContentTileData[] = [
  {
    id: '1',
    slug: 'stress-verstehen',
    title: 'Stress verstehen',
    summary: 'Erfahren Sie mehr über die verschiedenen Arten von Stress und deren Auswirkungen.',
    category: 'info',
    href: '/content/stress-verstehen',
    rank: 10,
  },
  {
    id: '2',
    slug: 'resilienztechniken',
    title: 'Resilienztechniken',
    summary: 'Praktische Methoden zur Stärkung Ihrer psychischen Widerstandskraft.',
    category: 'action',
    href: '/content/resilienztechniken',
    rank: 20,
  },
  {
    id: '3',
    slug: 'achtsamkeitsuebungen',
    title: 'Achtsamkeitsübungen',
    summary: 'Einfache Übungen für mehr Bewusstsein im Alltag.',
    category: 'action',
    href: '/content/achtsamkeitsuebungen',
    rank: 30,
  },
  {
    id: '4',
    slug: 'schlafhygiene',
    title: 'Schlafhygiene',
    summary: 'Tipps für besseren Schlaf und erholsame Nächte.',
    category: 'info',
    href: '/content/schlafhygiene',
    rank: 40,
  },
  {
    id: '5',
    slug: 'bewegung-entspannung',
    title: 'Bewegung und Entspannung',
    summary: 'Wie körperliche Aktivität Ihre mentale Gesundheit unterstützt.',
    category: 'action',
    href: '/content/bewegung-entspannung',
    rank: 50,
  },
  {
    id: '6',
    slug: 'ernaehrung-psyche',
    title: 'Ernährung und Psyche',
    summary: 'Der Zusammenhang zwischen Ernährung und psychischem Wohlbefinden.',
    category: 'info',
    href: '/content/ernaehrung-psyche',
    rank: 60,
  },
  {
    id: '7',
    slug: 'zeitmanagement',
    title: 'Zeitmanagement',
    summary: 'Strategien für einen ausgeglichenen Alltag ohne Überforderung.',
    category: 'action',
    href: '/content/zeitmanagement',
    rank: 70,
  },
  {
    id: '8',
    slug: 'soziale-unterstuetzung',
    title: 'Soziale Unterstützung',
    summary: 'Die Bedeutung von Beziehungen für Ihre Resilienz.',
    category: 'info',
    href: '/content/soziale-unterstuetzung',
    rank: 80,
  },
]

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
