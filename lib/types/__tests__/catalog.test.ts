/**
 * V05-FIXOPT-01: Catalog Availability Tests
 * 
 * Tests for catalog funnel availability status
 */

import type { CatalogFunnel, FunnelAvailability } from '../catalog'

describe('CatalogFunnel Type', () => {
  it('should accept availability field', () => {
    const funnel: CatalogFunnel = {
      id: 'test-id',
      slug: 'test-funnel',
      title: 'Test Funnel',
      subtitle: null,
      description: 'Test description',
      pillar_id: null,
      est_duration_min: 10,
      outcomes: ['Test outcome'],
      is_active: true,
      default_version_id: null,
      availability: 'available',
    }

    expect(funnel.availability).toBe('available')
  })

  it('should accept coming_soon availability', () => {
    const funnel: CatalogFunnel = {
      id: 'test-id',
      slug: 'test-funnel',
      title: 'Test Funnel',
      subtitle: null,
      description: 'Test description',
      pillar_id: null,
      est_duration_min: 10,
      outcomes: ['Test outcome'],
      is_active: true,
      default_version_id: null,
      availability: 'coming_soon',
    }

    expect(funnel.availability).toBe('coming_soon')
  })

  it('should accept not_available availability', () => {
    const funnel: CatalogFunnel = {
      id: 'test-id',
      slug: 'test-funnel',
      title: 'Test Funnel',
      subtitle: null,
      description: 'Test description',
      pillar_id: null,
      est_duration_min: 10,
      outcomes: ['Test outcome'],
      is_active: true,
      default_version_id: null,
      availability: 'not_available',
    }

    expect(funnel.availability).toBe('not_available')
  })

  it('should work without availability field (optional)', () => {
    const funnel: CatalogFunnel = {
      id: 'test-id',
      slug: 'test-funnel',
      title: 'Test Funnel',
      subtitle: null,
      description: 'Test description',
      pillar_id: null,
      est_duration_min: 10,
      outcomes: ['Test outcome'],
      is_active: true,
      default_version_id: null,
    }

    expect(funnel.availability).toBeUndefined()
  })
})

describe('FunnelAvailability Type', () => {
  it('should validate availability values', () => {
    const validStatuses: FunnelAvailability[] = [
      'available',
      'coming_soon',
      'not_available',
    ]

    validStatuses.forEach((status) => {
      expect(['available', 'coming_soon', 'not_available']).toContain(status)
    })
  })
})

describe('Catalog Availability Logic', () => {
  /**
   * Test helper that simulates catalog availability determination
   */
  function determineAvailability(
    inCatalog: boolean,
    inFunnels: boolean,
  ): FunnelAvailability | null {
    if (!inCatalog) return null
    return inFunnels ? 'available' : 'coming_soon'
  }

  it('should mark funnel as available when in both catalog and funnels table', () => {
    const availability = determineAvailability(true, true)
    expect(availability).toBe('available')
  })

  it('should mark funnel as coming_soon when only in catalog table', () => {
    const availability = determineAvailability(true, false)
    expect(availability).toBe('coming_soon')
  })

  it('should return null when not in catalog', () => {
    const availability = determineAvailability(false, false)
    expect(availability).toBeNull()
  })

  it('should return null when not in catalog but in funnels (should not happen)', () => {
    const availability = determineAvailability(false, true)
    expect(availability).toBeNull()
  })
})

describe('Catalog Response Structure', () => {
  it('should have proper structure with availability fields', () => {
    const mockCatalogResponse = {
      pillars: [
        {
          pillar: {
            id: 'pillar-1',
            key: 'prevention',
            title: 'Prevention',
            description: 'Prevention pillar',
            sort_order: 1,
          },
          funnels: [
            {
              id: 'funnel-1',
              slug: 'stress-assessment',
              title: 'Stress Assessment',
              subtitle: null,
              description: 'Assess your stress',
              pillar_id: 'pillar-1',
              est_duration_min: 5,
              outcomes: ['Stress score'],
              is_active: true,
              default_version_id: 'version-1',
              availability: 'available' as FunnelAvailability,
            },
            {
              id: 'funnel-2',
              slug: 'cardiovascular-age',
              title: 'Cardiovascular Age',
              subtitle: null,
              description: 'Assess your CV age',
              pillar_id: 'pillar-1',
              est_duration_min: 8,
              outcomes: ['CV age'],
              is_active: true,
              default_version_id: null,
              availability: 'coming_soon' as FunnelAvailability,
            },
          ],
        },
      ],
      uncategorized_funnels: [],
    }

    expect(mockCatalogResponse.pillars).toHaveLength(1)
    expect(mockCatalogResponse.pillars[0].funnels).toHaveLength(2)
    expect(mockCatalogResponse.pillars[0].funnels[0].availability).toBe('available')
    expect(mockCatalogResponse.pillars[0].funnels[1].availability).toBe('coming_soon')
  })
})
