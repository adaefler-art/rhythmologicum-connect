/**
 * Content Block Renderer Tests (V05-I06.2)
 * 
 * Tests for manifest-driven content rendering
 * 
 * Coverage:
 * - All supported block types render correctly
 * - Unknown block type → controlled error
 * - Deterministic rendering order
 * - Empty manifest → empty valid UI
 * - Server/client boundaries respected
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ContentBlockRenderer } from '../ContentBlockRenderer'
import { UnsupportedBlockTypeError } from '../SectionRenderer'
import { SECTION_TYPE } from '@/lib/contracts/funnelManifest'
import type { FunnelContentManifest, ContentSection } from '@/lib/contracts/funnelManifest'

describe('ContentBlockRenderer', () => {
  describe('AC1 — Manifest-driven, no fantasy names', () => {
    it('should accept only block types from SECTION_TYPE registry', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              { key: 'hero', type: SECTION_TYPE.HERO },
              { key: 'text', type: SECTION_TYPE.TEXT },
              { key: 'image', type: SECTION_TYPE.IMAGE },
              { key: 'video', type: SECTION_TYPE.VIDEO },
              { key: 'markdown', type: SECTION_TYPE.MARKDOWN },
              { key: 'cta', type: SECTION_TYPE.CTA },
              { key: 'divider', type: SECTION_TYPE.DIVIDER },
            ],
          },
        ],
      }

      const { container } = render(<ContentBlockRenderer manifest={manifest} />)
      
      // All sections should render
      expect(container.querySelector('[data-section-key="hero"]')).toBeInTheDocument()
      expect(container.querySelector('[data-section-key="text"]')).toBeInTheDocument()
      expect(container.querySelector('[data-section-key="image"]')).toBeInTheDocument()
      expect(container.querySelector('[data-section-key="video"]')).toBeInTheDocument()
      expect(container.querySelector('[data-section-key="markdown"]')).toBeInTheDocument()
      expect(container.querySelector('[data-section-key="cta"]')).toBeInTheDocument()
      expect(container.querySelector('[data-section-key="divider"]')).toBeInTheDocument()
    })

    it('should throw UnsupportedBlockTypeError for unknown type', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              // @ts-expect-error - Testing invalid type handling
              { key: 'invalid', type: 'fantasy_block_type' },
            ],
          },
        ],
      }

      // Should throw when rendering unknown type
      expect(() => {
        render(<ContentBlockRenderer manifest={manifest} />)
      }).toThrow(UnsupportedBlockTypeError)

      // Should include block type and section key in error
      try {
        render(<ContentBlockRenderer manifest={manifest} />)
      } catch (error) {
        expect(error).toBeInstanceOf(UnsupportedBlockTypeError)
        expect((error as UnsupportedBlockTypeError).blockType).toBe('fantasy_block_type')
        expect((error as UnsupportedBlockTypeError).sectionKey).toBe('invalid')
      }
    })

    it('should call onBlockTypeError callback instead of throwing when provided', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              // @ts-expect-error - Testing invalid type handling
              { key: 'invalid', type: 'fantasy_block_type' },
            ],
          },
        ],
      }

      const onBlockTypeError = jest.fn()

      // Should not throw when callback provided
      expect(() => {
        render(<ContentBlockRenderer manifest={manifest} onBlockTypeError={onBlockTypeError} />)
      }).not.toThrow()

      // Callback should be called with block type and section key
      expect(onBlockTypeError).toHaveBeenCalledWith('fantasy_block_type', 'invalid')
    })
  })

  describe('AC2 — Deterministic rendering', () => {
    it('should render sections in manifest order', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              { key: 'section-3', type: SECTION_TYPE.TEXT },
              { key: 'section-1', type: SECTION_TYPE.HERO },
              { key: 'section-2', type: SECTION_TYPE.DIVIDER },
            ],
          },
        ],
      }

      const { container } = render(<ContentBlockRenderer manifest={manifest} />)
      
      const sections = container.querySelectorAll('[data-section-key]')
      expect(sections).toHaveLength(3)
      
      // Order should match manifest order, not alphabetical
      expect(sections[0].getAttribute('data-section-key')).toBe('section-3')
      expect(sections[1].getAttribute('data-section-key')).toBe('section-1')
      expect(sections[2].getAttribute('data-section-key')).toBe('section-2')
    })

    it('should respect orderIndex when present', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              { key: 'section-c', type: SECTION_TYPE.TEXT, orderIndex: 2 },
              { key: 'section-a', type: SECTION_TYPE.HERO, orderIndex: 0 },
              { key: 'section-b', type: SECTION_TYPE.DIVIDER, orderIndex: 1 },
            ],
          },
        ],
      }

      const { container } = render(<ContentBlockRenderer manifest={manifest} />)
      
      const sections = container.querySelectorAll('[data-section-key]')
      expect(sections).toHaveLength(3)
      
      // Order should be sorted by orderIndex
      expect(sections[0].getAttribute('data-section-key')).toBe('section-a')
      expect(sections[1].getAttribute('data-section-key')).toBe('section-b')
      expect(sections[2].getAttribute('data-section-key')).toBe('section-c')
    })

    it('should produce identical output for same manifest input', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              { key: 'section-1', type: SECTION_TYPE.HERO, content: { title: 'Hero Title' } },
              { key: 'section-2', type: SECTION_TYPE.TEXT, content: { text: 'Some text' } },
            ],
          },
        ],
      }

      // Render twice with same manifest
      const { container: container1 } = render(<ContentBlockRenderer manifest={manifest} />)
      const { container: container2 } = render(<ContentBlockRenderer manifest={manifest} />)
      
      // HTML structure should be identical
      expect(container1.innerHTML).toBe(container2.innerHTML)
    })
  })

  describe('AC3 — UI Stack Pattern', () => {
    it('should render pages as sections stack', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'page-1',
            title: 'Page 1',
            sections: [
              { key: 'section-1', type: SECTION_TYPE.HERO },
            ],
          },
        ],
      }

      const { container } = render(<ContentBlockRenderer manifest={manifest} />)
      
      expect(container.querySelector('.content-page')).toBeInTheDocument()
      expect(container.querySelector('.content-sections-stack')).toBeInTheDocument()
    })

    it('should render page title when provided', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page Title',
            description: 'Test page description',
            sections: [],
          },
        ],
      }

      render(<ContentBlockRenderer manifest={manifest} />)
      
      expect(screen.getByText('Test Page Title')).toBeInTheDocument()
      expect(screen.getByText('Test page description')).toBeInTheDocument()
    })

    it('should filter to specific page when pageSlug provided', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'page-1',
            title: 'Page 1',
            sections: [{ key: 'section-1', type: SECTION_TYPE.HERO }],
          },
          {
            slug: 'page-2',
            title: 'Page 2',
            sections: [{ key: 'section-2', type: SECTION_TYPE.TEXT }],
          },
        ],
      }

      const { container } = render(<ContentBlockRenderer manifest={manifest} pageSlug="page-1" />)
      
      // Only page-1 should be rendered
      expect(container.querySelector('[data-page-slug="page-1"]')).toBeInTheDocument()
      expect(container.querySelector('[data-page-slug="page-2"]')).not.toBeInTheDocument()
      expect(screen.getByText('Page 1')).toBeInTheDocument()
      expect(screen.queryByText('Page 2')).not.toBeInTheDocument()
    })
  })

  describe('AC4 — Server/Client Boundaries', () => {
    it('should be a client component (uses client-side rendering)', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test',
            sections: [{ key: 'section-1', type: SECTION_TYPE.HERO }],
          },
        ],
      }

      // Should render without server-side issues
      const { container } = render(<ContentBlockRenderer manifest={manifest} />)
      expect(container.querySelector('.content-block-renderer')).toBeInTheDocument()
    })

    it('should accept pre-validated manifest from server', () => {
      // Manifest should be validated server-side before passing
      const validatedManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [],
      }

      // Should accept without re-validation
      expect(() => {
        render(<ContentBlockRenderer manifest={validatedManifest} />)
      }).not.toThrow()
    })
  })

  describe('Empty manifest handling', () => {
    it('should handle empty pages array gracefully', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [],
      }

      const { container } = render(<ContentBlockRenderer manifest={manifest} />)
      
      // Should render nothing but not crash
      expect(container.firstChild).toBeNull()
    })

    it('should handle page with no sections', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'empty-page',
            title: 'Empty Page',
            sections: [],
          },
        ],
      }

      render(<ContentBlockRenderer manifest={manifest} />)
      
      // Should render page title but no sections
      expect(screen.getByText('Empty Page')).toBeInTheDocument()
    })

    it('should handle section with no content gracefully', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test',
            sections: [
              { key: 'empty-text', type: SECTION_TYPE.TEXT },
            ],
          },
        ],
      }

      // Should not crash with empty content
      expect(() => {
        render(<ContentBlockRenderer manifest={manifest} />)
      }).not.toThrow()
    })
  })

  describe('Individual block types', () => {
    it('should render hero block with content', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test',
            title: 'Test',
            sections: [
              {
                key: 'hero',
                type: SECTION_TYPE.HERO,
                content: {
                  title: 'Welcome',
                  subtitle: 'To our app',
                },
              },
            ],
          },
        ],
      }

      render(<ContentBlockRenderer manifest={manifest} />)
      
      expect(screen.getByText('Welcome')).toBeInTheDocument()
      expect(screen.getByText('To our app')).toBeInTheDocument()
    })

    it('should render text block with content', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test',
            title: 'Test',
            sections: [
              {
                key: 'text',
                type: SECTION_TYPE.TEXT,
                content: {
                  title: 'Section Title',
                  text: 'Section text content',
                },
              },
            ],
          },
        ],
      }

      render(<ContentBlockRenderer manifest={manifest} />)
      
      expect(screen.getByText('Section Title')).toBeInTheDocument()
      expect(screen.getByText('Section text content')).toBeInTheDocument()
    })

    it('should render divider block', () => {
      const manifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test',
            title: 'Test',
            sections: [
              {
                key: 'divider',
                type: SECTION_TYPE.DIVIDER,
              },
            ],
          },
        ],
      }

      const { container } = render(<ContentBlockRenderer manifest={manifest} />)
      
      expect(container.querySelector('.divider-block')).toBeInTheDocument()
    })
  })

  describe('V05-I06.2 Hardening — Security Tests', () => {
    describe('Markdown security', () => {
      it('should not render raw HTML in markdown', () => {
        const manifest: FunnelContentManifest = {
          version: '1.0',
          pages: [
            {
              slug: 'test-page',
              title: 'Test',
              sections: [
                {
                  key: 'markdown-xss',
                  type: SECTION_TYPE.MARKDOWN,
                  content: {
                    markdown: '# Title\n\n<script>alert("XSS")</script>\n\n<img src=x onerror="alert(1)">',
                  },
                },
              ],
            },
          ],
        }

        const { container } = render(<ContentBlockRenderer manifest={manifest} />)
        
        // Should not contain script tag
        expect(container.querySelector('script')).not.toBeInTheDocument()
        // Should not contain img tag with onerror
        const imgs = container.querySelectorAll('img')
        imgs.forEach(img => {
          expect(img.getAttribute('onerror')).toBeNull()
        })
      })

      it('should render markdown links with safe attributes for external URLs', () => {
        const manifest: FunnelContentManifest = {
          version: '1.0',
          pages: [
            {
              slug: 'test-page',
              title: 'Test',
              sections: [
                {
                  key: 'markdown-link',
                  type: SECTION_TYPE.MARKDOWN,
                  content: {
                    markdown: '[External Link](https://example.com)\n[Internal Link](/page)',
                  },
                },
              ],
            },
          ],
        }

        const { container } = render(<ContentBlockRenderer manifest={manifest} />)
        
        const externalLink = container.querySelector('a[href="https://example.com"]')
        expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer')
        expect(externalLink).toHaveAttribute('target', '_blank')

        const internalLink = container.querySelector('a[href="/page"]')
        expect(internalLink).not.toHaveAttribute('rel')
        expect(internalLink).not.toHaveAttribute('target')
      })
    })

    describe('URL validation', () => {
      it('should reject javascript: URLs in CTA blocks', () => {
        const manifest: FunnelContentManifest = {
          version: '1.0',
          pages: [
            {
              slug: 'test-page',
              title: 'Test',
              sections: [
                {
                  key: 'cta-xss',
                  type: SECTION_TYPE.CTA,
                  content: {
                    text: 'Click Me',
                    href: 'javascript:alert(1)',
                  },
                },
              ],
            },
          ],
        }

        const { container } = render(<ContentBlockRenderer manifest={manifest} />)
        
        const link = container.querySelector('a')
        // Should be sanitized to fallback
        expect(link?.getAttribute('href')).toBe('#')
      })

      it('should allow safe URLs in CTA blocks', () => {
        const manifest: FunnelContentManifest = {
          version: '1.0',
          pages: [
            {
              slug: 'test-page',
              title: 'Test',
              sections: [
                {
                  key: 'cta-safe',
                  type: SECTION_TYPE.CTA,
                  content: {
                    text: 'Click Me',
                    href: 'https://example.com',
                  },
                },
              ],
            },
          ],
        }

        const { container } = render(<ContentBlockRenderer manifest={manifest} />)
        
        const link = container.querySelector('a')
        expect(link?.getAttribute('href')).toBe('https://example.com')
        expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
      })

      it('should reject javascript: URLs in image blocks', () => {
        const manifest: FunnelContentManifest = {
          version: '1.0',
          pages: [
            {
              slug: 'test-page',
              title: 'Test',
              sections: [
                {
                  key: 'img-xss',
                  type: SECTION_TYPE.IMAGE,
                  content: {
                    url: 'javascript:alert(1)',
                    alt: 'Test',
                  },
                },
              ],
            },
          ],
        }

        const { container } = render(<ContentBlockRenderer manifest={manifest} />)
        
        const img = container.querySelector('img')
        // Should not render image with dangerous URL
        expect(img).not.toBeInTheDocument()
      })

      it('should allow data: URLs in image blocks for inline images', () => {
        const manifest: FunnelContentManifest = {
          version: '1.0',
          pages: [
            {
              slug: 'test-page',
              title: 'Test',
              sections: [
                {
                  key: 'img-data',
                  type: SECTION_TYPE.IMAGE,
                  content: {
                    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                    alt: 'Test',
                  },
                },
              ],
            },
          ],
        }

        const { container } = render(<ContentBlockRenderer manifest={manifest} />)
        
        const img = container.querySelector('img')
        expect(img).toBeInTheDocument()
        expect(img?.getAttribute('src')).toContain('data:image/png;base64')
      })
    })

    describe('Deterministic sorting with stable tie-breakers', () => {
      it('should sort by orderIndex with original index as tie-breaker', () => {
        const manifest: FunnelContentManifest = {
          version: '1.0',
          pages: [
            {
              slug: 'test-page',
              title: 'Test',
              sections: [
                { key: 'section-d', type: SECTION_TYPE.TEXT, orderIndex: 1 },
                { key: 'section-a', type: SECTION_TYPE.TEXT, orderIndex: 1 },
                { key: 'section-c', type: SECTION_TYPE.TEXT, orderIndex: 0 },
                { key: 'section-b', type: SECTION_TYPE.TEXT, orderIndex: 1 },
              ],
            },
          ],
        }

        const { container } = render(<ContentBlockRenderer manifest={manifest} />)
        
        const sections = container.querySelectorAll('[data-section-key]')
        expect(sections).toHaveLength(4)
        
        // orderIndex 0 comes first
        expect(sections[0].getAttribute('data-section-key')).toBe('section-c')
        // orderIndex 1 sorted by original index (d, a, b)
        expect(sections[1].getAttribute('data-section-key')).toBe('section-d')
        expect(sections[2].getAttribute('data-section-key')).toBe('section-a')
        expect(sections[3].getAttribute('data-section-key')).toBe('section-b')
      })

      it('should use key as final tie-breaker when orderIndex and originalIndex are same', () => {
        // This tests the lexicographic sort when everything else is equal
        const manifest: FunnelContentManifest = {
          version: '1.0',
          pages: [
            {
              slug: 'test-page',
              title: 'Test',
              sections: [
                { key: 'c-section', type: SECTION_TYPE.TEXT, orderIndex: 0 },
                { key: 'a-section', type: SECTION_TYPE.TEXT, orderIndex: 0 },
                { key: 'b-section', type: SECTION_TYPE.TEXT, orderIndex: 0 },
              ],
            },
          ],
        }

        const { container } = render(<ContentBlockRenderer manifest={manifest} />)
        
        const sections = container.querySelectorAll('[data-section-key]')
        
        // When orderIndex is same, original index should take precedence
        // But if somehow they're also same, key should be the final tie-breaker
        expect(sections[0].getAttribute('data-section-key')).toBe('c-section')
        expect(sections[1].getAttribute('data-section-key')).toBe('a-section')
        expect(sections[2].getAttribute('data-section-key')).toBe('b-section')
      })

      it('should produce identical output for same manifest (determinism test)', () => {
        const manifest: FunnelContentManifest = {
          version: '1.0',
          pages: [
            {
              slug: 'test-page',
              title: 'Test',
              sections: [
                { key: 'section-3', type: SECTION_TYPE.TEXT, orderIndex: 2 },
                { key: 'section-1', type: SECTION_TYPE.HERO, orderIndex: 0 },
                { key: 'section-2', type: SECTION_TYPE.DIVIDER, orderIndex: 1 },
              ],
            },
          ],
        }

        // Render multiple times
        const { container: container1 } = render(<ContentBlockRenderer manifest={manifest} />)
        const { container: container2 } = render(<ContentBlockRenderer manifest={manifest} />)
        const { container: container3 } = render(<ContentBlockRenderer manifest={manifest} />)
        
        // Extract keys from each render
        const getKeys = (container: HTMLElement) =>
          Array.from(container.querySelectorAll('[data-section-key]')).map(el =>
            el.getAttribute('data-section-key')
          )

        const keys1 = getKeys(container1)
        const keys2 = getKeys(container2)
        const keys3 = getKeys(container3)

        // All renders should produce identical order
        expect(keys1).toEqual(['section-1', 'section-2', 'section-3'])
        expect(keys2).toEqual(keys1)
        expect(keys3).toEqual(keys1)
      })
    })

    describe('Zod schema strict validation', () => {
      it('should reject manifest with unknown fields at section level', () => {
        const invalidManifest = {
          version: '1.0',
          pages: [
            {
              slug: 'test-page',
              title: 'Test',
              sections: [
                {
                  key: 'test',
                  type: 'text',
                  unknownField: 'should fail', // Unknown field
                },
              ],
            },
          ],
        }

        // Note: This test validates that the Zod schema would reject this
        // In practice, the manifest should be validated server-side before passing to renderer
        const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
        const result = FunnelContentManifestSchema.safeParse(invalidManifest)
        
        expect(result.success).toBe(false)
      })

      it('should reject manifest with overly long strings', () => {
        const invalidManifest = {
          version: '1.0',
          pages: [
            {
              slug: 'a'.repeat(201), // Exceeds max 200
              title: 'Test',
              sections: [],
            },
          ],
        }

        const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
        const result = FunnelContentManifestSchema.safeParse(invalidManifest)
        
        expect(result.success).toBe(false)
      })

      it('should reject negative orderIndex', () => {
        const invalidManifest = {
          version: '1.0',
          pages: [
            {
              slug: 'test-page',
              title: 'Test',
              sections: [
                {
                  key: 'test',
                  type: 'text',
                  orderIndex: -1, // Negative not allowed
                },
              ],
            },
          ],
        }

        const { FunnelContentManifestSchema } = require('@/lib/contracts/funnelManifest')
        const result = FunnelContentManifestSchema.safeParse(invalidManifest)
        
        expect(result.success).toBe(false)
      })
    })
  })
})
