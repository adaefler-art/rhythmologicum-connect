/**
 * E6.5.6: Content Tiles MVP - Unit Tests
 * 
 * Tests for deterministic ordering and max tiles limit.
 */

import {
  CONTENT_TILES_DATA,
  sortContentTilesDeterministic,
  getContentTiles,
  type ContentTileData,
} from '../contentTiles'

describe('Content Tiles MVP - E6.5.6', () => {
  describe('CONTENT_TILES_DATA', () => {
    it('should have at least 6 tiles', () => {
      expect(CONTENT_TILES_DATA.length).toBeGreaterThanOrEqual(6)
    })

    it('should have at most 12 tiles', () => {
      expect(CONTENT_TILES_DATA.length).toBeLessThanOrEqual(12)
    })

    it('should have all required fields', () => {
      CONTENT_TILES_DATA.forEach((tile) => {
        expect(tile).toHaveProperty('id')
        expect(tile).toHaveProperty('slug')
        expect(tile).toHaveProperty('title')
        expect(tile).toHaveProperty('summary')
        expect(tile).toHaveProperty('category')
        expect(tile).toHaveProperty('href')
        expect(tile).toHaveProperty('rank')
      })
    })

    it('should have unique ids', () => {
      const ids = CONTENT_TILES_DATA.map((t) => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have unique slugs', () => {
      const slugs = CONTENT_TILES_DATA.map((t) => t.slug)
      const uniqueSlugs = new Set(slugs)
      expect(uniqueSlugs.size).toBe(slugs.length)
    })

    it('should have valid href paths', () => {
      CONTENT_TILES_DATA.forEach((tile) => {
        expect(tile.href).toMatch(/^\//)
      })
    })

    it('should have non-negative ranks', () => {
      CONTENT_TILES_DATA.forEach((tile) => {
        expect(tile.rank).toBeGreaterThanOrEqual(0)
      })
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

    it('should be deterministic - same input produces same output', () => {
      const tiles = [...CONTENT_TILES_DATA]

      const sorted1 = sortContentTilesDeterministic(tiles)
      const sorted2 = sortContentTilesDeterministic(tiles)
      const sorted3 = sortContentTilesDeterministic(tiles)

      expect(sorted1).toEqual(sorted2)
      expect(sorted2).toEqual(sorted3)
    })

    it('should not mutate original array', () => {
      const tiles = [...CONTENT_TILES_DATA]
      const originalOrder = tiles.map((t) => t.id)

      sortContentTilesDeterministic(tiles)

      const currentOrder = tiles.map((t) => t.id)
      expect(currentOrder).toEqual(originalOrder)
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
    it('should return tiles sorted by rank then slug', () => {
      const tiles = getContentTiles()

      // Verify sorted by rank ascending
      for (let i = 1; i < tiles.length; i++) {
        expect(tiles[i].rank).toBeGreaterThanOrEqual(tiles[i - 1].rank)
      }
    })

    it('should limit to default 10 tiles', () => {
      const tiles = getContentTiles()
      expect(tiles.length).toBeLessThanOrEqual(10)
    })

    it('should limit to specified max tiles', () => {
      const tiles3 = getContentTiles(3)
      expect(tiles3.length).toBe(3)

      const tiles5 = getContentTiles(5)
      expect(tiles5.length).toBe(5)
    })

    it('should return all tiles if max is greater than available', () => {
      const tiles = getContentTiles(100)
      expect(tiles.length).toBe(CONTENT_TILES_DATA.length)
    })

    it('should return highest priority tiles when limited', () => {
      const tiles = getContentTiles(3)

      // Should return tiles with lowest rank values (highest priority)
      const allSorted = sortContentTilesDeterministic(CONTENT_TILES_DATA)
      expect(tiles[0].id).toBe(allSorted[0].id)
      expect(tiles[1].id).toBe(allSorted[1].id)
      expect(tiles[2].id).toBe(allSorted[2].id)
    })

    it('should be deterministic - same maxTiles produces same output', () => {
      const tiles1 = getContentTiles(5)
      const tiles2 = getContentTiles(5)
      const tiles3 = getContentTiles(5)

      expect(tiles1).toEqual(tiles2)
      expect(tiles2).toEqual(tiles3)
    })

    it('should handle maxTiles of 0', () => {
      const tiles = getContentTiles(0)
      expect(tiles).toEqual([])
    })
  })

  describe('E6.5.6 Integration Tests', () => {
    it('should provide tiles ready for dashboard API consumption', () => {
      const tiles = getContentTiles(6)

      tiles.forEach((tile) => {
        // Verify structure matches what dashboard expects
        expect(typeof tile.id).toBe('string')
        expect(typeof tile.slug).toBe('string')
        expect(typeof tile.title).toBe('string')
        expect(typeof tile.summary).toBe('string')
        expect(typeof tile.category).toBe('string')
        expect(typeof tile.href).toBe('string')
        expect(typeof tile.rank).toBe('number')
      })
    })

    it('should maintain deterministic order across multiple calls', () => {
      const tiles1 = getContentTiles(8)
      const tiles2 = getContentTiles(8)

      // Same input should produce identical output
      expect(tiles1).toEqual(tiles2)

      // Order should be deterministic
      tiles1.forEach((tile, idx) => {
        expect(tile.id).toBe(tiles2[idx].id)
      })
    })
  })
})
