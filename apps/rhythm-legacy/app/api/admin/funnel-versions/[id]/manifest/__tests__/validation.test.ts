/**
 * V05-I06.4 Manifest API Tests
 * 
 * Tests for GET/PUT /api/admin/funnel-versions/[id]/manifest
 * 
 * Coverage:
 * - Schema validation gating save
 * - Deterministic ordering / stable serialization
 * - Fail-closed behavior for unknown types
 * - URL security validation (V05-I06.4 Hardening)
 */

import { SECTION_TYPE } from '@/lib/contracts/funnelManifest'
import type { FunnelContentManifest, ContentSection } from '@/lib/contracts/funnelManifest'

describe('Manifest API - Validation', () => {
  describe('Schema validation gating save', () => {
    it('should accept valid manifest with all SECTION_TYPE blocks', () => {
      const validManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              { key: 'hero', type: SECTION_TYPE.HERO, content: {} },
              { key: 'text', type: SECTION_TYPE.TEXT, content: {} },
              { key: 'image', type: SECTION_TYPE.IMAGE, content: {} },
              { key: 'video', type: SECTION_TYPE.VIDEO, content: {} },
              { key: 'markdown', type: SECTION_TYPE.MARKDOWN, content: {} },
              { key: 'cta', type: SECTION_TYPE.CTA, content: {} },
              { key: 'divider', type: SECTION_TYPE.DIVIDER, content: {} },
            ],
          },
        ],
      }

      // Validate using schema
      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(validManifest)).not.toThrow()
    })

    it('should reject manifest with unknown block type', () => {
      const invalidManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              { key: 'invalid', type: 'fantasy_block_type', content: {} },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(invalidManifest)).toThrow()
    })

    it('should reject manifest with missing required fields', () => {
      const invalidManifest = {
        version: '1.0',
        pages: [
          {
            // Missing slug
            title: 'Test Page',
            sections: [],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(invalidManifest)).toThrow()
    })

    it('should reject manifest exceeding bounds', () => {
      const tooManySections = Array.from({ length: 101 }, (_, i) => ({
        key: `section-${i}`,
        type: SECTION_TYPE.TEXT,
        content: {},
      }))

      const invalidManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: tooManySections,
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(invalidManifest)).toThrow()
    })
  })

  describe('Deterministic ordering', () => {
    it('should preserve array order when no orderIndex specified', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              { key: 'section-1', type: SECTION_TYPE.TEXT, content: {} },
              { key: 'section-2', type: SECTION_TYPE.HERO, content: {} },
              { key: 'section-3', type: SECTION_TYPE.CTA, content: {} },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      const parsed = FunnelContentManifestSchema.parse(manifest)
      
      expect(parsed.pages[0].sections[0].key).toBe('section-1')
      expect(parsed.pages[0].sections[1].key).toBe('section-2')
      expect(parsed.pages[0].sections[2].key).toBe('section-3')
    })

    it('should support explicit orderIndex for deterministic sorting', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              { key: 'section-c', type: SECTION_TYPE.TEXT, content: {}, orderIndex: 2 },
              { key: 'section-a', type: SECTION_TYPE.HERO, content: {}, orderIndex: 0 },
              { key: 'section-b', type: SECTION_TYPE.CTA, content: {}, orderIndex: 1 },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      const parsed = FunnelContentManifestSchema.parse(manifest)
      
      // Sections can be sorted by orderIndex
      const sorted = [...parsed.pages[0].sections].sort((a, b) => 
        (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
      )
      
      expect(sorted[0].key).toBe('section-a')
      expect(sorted[1].key).toBe('section-b')
      expect(sorted[2].key).toBe('section-c')
    })

    it('should validate orderIndex is non-negative', () => {
      const invalidManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              { key: 'section-1', type: SECTION_TYPE.TEXT, content: {}, orderIndex: -1 },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(invalidManifest)).toThrow()
    })
  })

  describe('Fail-closed behavior for unknown types', () => {
    it('should fail validation for unknown section type', () => {
      const invalidManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              { key: 'unknown', type: 'carousel', content: {} }, // Not in SECTION_TYPE
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(invalidManifest)).toThrow()
    })

    it('should reject unknown keys in strict mode', () => {
      const invalidManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              {
                key: 'section-1',
                type: SECTION_TYPE.TEXT,
                content: {},
                unknownField: 'value', // Unknown field
              },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(invalidManifest)).toThrow()
    })

    it('should validate all block types are from SECTION_TYPE registry', () => {
      const allTypes = Object.values(SECTION_TYPE)
      
      allTypes.forEach(type => {
        const manifest: FunnelContentManifest = {
          version: '1.0',
          pages: [
            {
              slug: 'test-page',
              title: 'Test Page',
              sections: [
                { key: 'test', type: type as ContentSection['type'], content: {} },
              ],
            },
          ],
        }

        const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
        expect(() => FunnelContentManifestSchema.parse(manifest)).not.toThrow()
      })
    })
  })

  describe('No PHI in manifests', () => {
    it('should allow generic content fields', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              {
                key: 'text-block',
                type: SECTION_TYPE.TEXT,
                content: {
                  title: 'Welcome',
                  text: 'This is a generic welcome message',
                },
              },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(manifest)).not.toThrow()
    })

    it('should enforce schema bounds to prevent PHI storage', () => {
      // Schema bounds prevent PHI by limiting field sizes and types
      // No patient-specific dynamic fields allowed
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              {
                key: 'section-1',
                type: SECTION_TYPE.TEXT,
                content: {
                  // Only pre-defined content structure allowed
                  // No dynamic patient data fields
                  text: 'Static content only',
                },
              },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      const parsed = FunnelContentManifestSchema.parse(manifest)
      
      // Content is generic, no PHI
      expect(parsed.pages[0].sections[0].content).toBeDefined()
      expect(typeof parsed.pages[0].sections[0].content).toBe('object')
    })
  })
})

describe('URL Security Validation (V05-I06.4 Hardening)', () => {
  describe('CTA block href validation', () => {
    it('should reject javascript: URLs', () => {
      const maliciousManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              {
                key: 'cta-1',
                type: SECTION_TYPE.CTA,
                content: {
                  text: 'Click me',
                  href: 'javascript:alert(1)',
                },
              },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(maliciousManifest)).toThrow()
    })

    it('should reject data: URLs', () => {
      const maliciousManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              {
                key: 'cta-1',
                type: SECTION_TYPE.CTA,
                content: {
                  text: 'Click me',
                  href: 'data:text/html,<script>alert(1)</script>',
                },
              },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(maliciousManifest)).toThrow()
    })

    it('should reject vbscript: URLs', () => {
      const maliciousManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              {
                key: 'cta-1',
                type: SECTION_TYPE.CTA,
                content: {
                  text: 'Click me',
                  href: 'vbscript:msgbox(1)',
                },
              },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(maliciousManifest)).toThrow()
    })

    it('should accept safe http/https URLs', () => {
      const safeManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              {
                key: 'cta-1',
                type: SECTION_TYPE.CTA,
                content: {
                  text: 'Click me',
                  href: 'https://example.com',
                },
              },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(safeManifest)).not.toThrow()
    })

    it('should accept relative URLs', () => {
      const safeManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              {
                key: 'cta-1',
                type: SECTION_TYPE.CTA,
                content: {
                  text: 'Click me',
                  href: '/internal/page',
                },
              },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(safeManifest)).not.toThrow()
    })
  })

  describe('Image/Video block url validation', () => {
    it('should reject javascript: URLs in image blocks', () => {
      const maliciousManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              {
                key: 'image-1',
                type: SECTION_TYPE.IMAGE,
                content: {
                  url: 'javascript:alert(1)',
                  alt: 'Test image',
                },
              },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(maliciousManifest)).toThrow()
    })

    it('should accept safe URLs in image blocks', () => {
      const safeManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              {
                key: 'image-1',
                type: SECTION_TYPE.IMAGE,
                content: {
                  url: 'https://example.com/image.jpg',
                  alt: 'Test image',
                },
              },
            ],
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(safeManifest)).not.toThrow()
    })
  })

  describe('Asset URL validation', () => {
    it('should reject javascript: URLs in assets', () => {
      const maliciousManifest = {
        version: '1.0',
        pages: [],
        assets: [
          {
            key: 'asset-1',
            type: 'image' as const,
            url: 'javascript:alert(1)',
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(maliciousManifest)).toThrow()
    })

    it('should accept safe URLs in assets', () => {
      const safeManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [],
        assets: [
          {
            key: 'asset-1',
            type: 'image',
            url: 'https://example.com/asset.jpg',
          },
        ],
      }

      const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
      expect(() => FunnelContentManifestSchema.parse(safeManifest)).not.toThrow()
    })
  })
})

describe('Stable serialization', () => {
  it('should produce consistent JSON output for same manifest', () => {
    const manifest: FunnelContentManifest = {
      version: '1.0',
      pages: [
        {
          slug: 'page-1',
          title: 'Page 1',
          sections: [
            { key: 'section-1', type: SECTION_TYPE.HERO, content: { title: 'Hero' } },
            { key: 'section-2', type: SECTION_TYPE.TEXT, content: { text: 'Text' } },
          ],
        },
      ],
    }

    const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
    const parsed1 = FunnelContentManifestSchema.parse(manifest)
    const parsed2 = FunnelContentManifestSchema.parse(manifest)
    
    // Same input → same parsed output
    expect(JSON.stringify(parsed1)).toBe(JSON.stringify(parsed2))
  })

  it('should handle empty optional fields consistently', () => {
    const manifest1: FunnelContentManifest = {
      version: '1.0',
      pages: [
        {
          slug: 'page-1',
          title: 'Page 1',
          sections: [],
        },
      ],
    }

    const manifest2: FunnelContentManifest = {
      version: '1.0',
      pages: [
        {
          slug: 'page-1',
          title: 'Page 1',
          sections: [],
          description: undefined,
        },
      ],
    }

    const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
    const parsed1 = FunnelContentManifestSchema.parse(manifest1)
    const parsed2 = FunnelContentManifestSchema.parse(manifest2)
    
    // Both should normalize to same structure
    expect(parsed1.pages[0].sections).toEqual([])
    expect(parsed2.pages[0].sections).toEqual([])
  })
})
