/**
 * E6.5.6: Content Tiles Data - Unit Tests
 * 
 * Static tiles are removed; dashboard tiles come from content_pages.
 */

import {
  CONTENT_TILES_DATA,
  sortContentTilesDeterministic,
  getContentTiles,
  type ContentTileData,
} from '../contentTiles'

describe('Content Tiles Data - E6.5.6', () => {
  describe('CONTENT_TILES_DATA', () => {
    it('should be empty (DB-backed tiles now)', () => {
      expect(CONTENT_TILES_DATA).toHaveLength(0)
    })
  })

  describe('sortContentTilesDeterministic - E6.5.6 AC2', () => {
    it('should sort by rank ascending (lower rank first)', () => {
      const tiles: ContentTileData[] = [
        { id: '1', slug: 'a', title: 'A', summary: 'A', category: 'info', href: '/a', rank: 30 },
        { id: '2', slug: 'b', title: 'B', summary: 'B', category: 'info', href: '/b', rank: 10 },
        { id: '3', slug: 'c', title: 'C', summary: 'C', category: 'info', href: '/c', rank: 20 },
      ]

      const sorted = sortContentTilesDeterministic(tiles)

      expect(sorted[0].rank).toBe(10)
      expect(sorted[1].rank).toBe(20)
      expect(sorted[2].rank).toBe(30)
    })

    it('should sort by slug ascending when rank is equal', () => {
      const tiles: ContentTileData[] = [
        { id: '1', slug: 'charlie', title: 'C', summary: 'C', category: 'info', href: '/c', rank: 10 },
        { id: '2', slug: 'alpha', title: 'A', summary: 'A', category: 'info', href: '/a', rank: 10 },
        { id: '3', slug: 'bravo', title: 'B', summary: 'B', category: 'info', href: '/b', rank: 10 },
      ]

      const sorted = sortContentTilesDeterministic(tiles)

      expect(sorted[0].slug).toBe('alpha')
      expect(sorted[1].slug).toBe('bravo')
      expect(sorted[2].slug).toBe('charlie')
    })

    it('should handle empty array', () => {
      const sorted = sortContentTilesDeterministic([])
      expect(sorted).toEqual([])
    })

    it('should handle single item', () => {
      const tiles: ContentTileData[] = [
        { id: '1', slug: 'a', title: 'A', summary: 'A', category: 'info', href: '/a', rank: 10 },
      ]

      const sorted = sortContentTilesDeterministic(tiles)

      expect(sorted).toHaveLength(1)
      expect(sorted[0].id).toBe('1')
    })

    it('should use lexicographic comparison for slugs (no localeCompare drift)', () => {
      const tiles: ContentTileData[] = [
        { id: '1', slug: 'Zebra', title: 'Z', summary: 'Z', category: 'info', href: '/z', rank: 10 },
        { id: '2', slug: 'apple', title: 'A', summary: 'A', category: 'info', href: '/a', rank: 10 },
        { id: '3', slug: 'Banana', title: 'B', summary: 'B', category: 'info', href: '/b', rank: 10 },
      ]

      const sorted = sortContentTilesDeterministic(tiles)

      // Lexicographic order (capital letters come before lowercase in ASCII)
      expect(sorted[0].slug).toBe('Banana')
      expect(sorted[1].slug).toBe('Zebra')
      expect(sorted[2].slug).toBe('apple')
    })
  })

  describe('getContentTiles - E6.5.6 AC1 & AC2', () => {
    it('returns empty array (DB-backed tiles now)', () => {
      expect(getContentTiles()).toEqual([])
    })

    it('handles maxTiles of 0', () => {
      expect(getContentTiles(0)).toEqual([])
    })
  })
})
