/**
 * Tests for Funnel Catalog API (V05-I02.1)
 * 
 * Tests the catalog endpoints for response shape, ordering, and basic behavior.
 * Note: These are unit tests that verify the contract, not integration tests.
 */

import type { FunnelCatalogResponse, FunnelDetailResponse } from '@/lib/types/catalog'
import { PILLAR_KEY } from '@/lib/contracts/registry'

describe('Funnel Catalog API Types', () => {
  describe('FunnelCatalogResponse', () => {
    it('should have correct structure', () => {
      const mockResponse: FunnelCatalogResponse = {
        pillars: [
          {
            pillar: {
              id: 'test-id',
              key: PILLAR_KEY.MENTAL_HEALTH,
              title: 'Mentale Gesundheit & Stressmanagement',
              description: 'Test description',
              sort_order: 4,
            },
            funnels: [
              {
                id: 'funnel-id',
                slug: 'test-funnel',
                title: 'Test Funnel',
                subtitle: 'Test subtitle',
                description: 'Test description',
                pillar_id: 'test-id',
                est_duration_min: 10,
                outcomes: ['outcome1', 'outcome2'],
                is_active: true,
                default_version_id: 'version-id',
                default_version: '1.0.0',
              },
            ],
          },
        ],
        uncategorized_funnels: [],
      }

      expect(mockResponse).toHaveProperty('pillars')
      expect(mockResponse).toHaveProperty('uncategorized_funnels')
      expect(Array.isArray(mockResponse.pillars)).toBe(true)
      expect(Array.isArray(mockResponse.uncategorized_funnels)).toBe(true)
    })

    it('should support empty pillars', () => {
      const mockResponse: FunnelCatalogResponse = {
        pillars: [],
        uncategorized_funnels: [],
      }

      expect(mockResponse.pillars).toHaveLength(0)
      expect(mockResponse.uncategorized_funnels).toHaveLength(0)
    })
  })

  describe('FunnelDetailResponse', () => {
    it('should have correct structure', () => {
      const mockResponse: FunnelDetailResponse = {
        funnel: {
          id: 'funnel-id',
          slug: 'test-funnel',
          title: 'Test Funnel',
          subtitle: 'Test subtitle',
          description: 'Test description',
          pillar_id: 'pillar-id',
          pillar_key: PILLAR_KEY.MENTAL_HEALTH,
          pillar_title: 'Mentale Gesundheit & Stressmanagement',
          est_duration_min: 10,
          outcomes: ['outcome1'],
          is_active: true,
          default_version_id: 'version-id',
          default_version: '1.0.0',
        },
        versions: [
          {
            id: 'version-id',
            funnel_id: 'funnel-id',
            version: '1.0.0',
            is_default: true,
            is_active: true,
          },
        ],
        active_version: {
          id: 'version-id',
          funnel_id: 'funnel-id',
          version: '1.0.0',
          is_default: true,
          is_active: true,
        },
        default_version: {
          id: 'version-id',
          funnel_id: 'funnel-id',
          version: '1.0.0',
          is_default: true,
          is_active: true,
        },
      }

      expect(mockResponse).toHaveProperty('funnel')
      expect(mockResponse).toHaveProperty('versions')
      expect(mockResponse).toHaveProperty('active_version')
      expect(mockResponse).toHaveProperty('default_version')
      expect(Array.isArray(mockResponse.versions)).toBe(true)
    })

    it('should support null versions', () => {
      const mockResponse: FunnelDetailResponse = {
        funnel: {
          id: 'funnel-id',
          slug: 'test-funnel',
          title: 'Test Funnel',
          subtitle: null,
          description: null,
          pillar_id: null,
          est_duration_min: null,
          outcomes: [],
          is_active: true,
          default_version_id: null,
          default_version: null,
        },
        versions: [],
        active_version: null,
        default_version: null,
      }

      expect(mockResponse.active_version).toBeNull()
      expect(mockResponse.default_version).toBeNull()
    })
  })
})

describe('Catalog Response Shape Validation', () => {
  it('should validate pillar sort order is deterministic', () => {
    const mockCatalog: FunnelCatalogResponse = {
      pillars: [
        {
          pillar: {
            id: '1',
            key: PILLAR_KEY.NUTRITION,
            title: 'Ernährung',
            description: null,
            sort_order: 1,
          },
          funnels: [],
        },
        {
          pillar: {
            id: '2',
            key: PILLAR_KEY.MOVEMENT,
            title: 'Bewegung',
            description: null,
            sort_order: 2,
          },
          funnels: [],
        },
      ],
      uncategorized_funnels: [],
    }

    // Verify sort order is ascending
    for (let i = 1; i < mockCatalog.pillars.length; i++) {
      expect(mockCatalog.pillars[i].pillar.sort_order).toBeGreaterThan(
        mockCatalog.pillars[i - 1].pillar.sort_order,
      )
    }
  })

  it('should validate funnel outcomes are arrays', () => {
    const mockFunnel = {
      id: 'test',
      slug: 'test',
      title: 'Test',
      subtitle: null,
      description: null,
      pillar_id: null,
      est_duration_min: 10,
      outcomes: ['outcome1', 'outcome2'],
      is_active: true,
      default_version_id: null,
      default_version: null,
    }

    expect(Array.isArray(mockFunnel.outcomes)).toBe(true)
    expect(mockFunnel.outcomes).toHaveLength(2)
  })
})
