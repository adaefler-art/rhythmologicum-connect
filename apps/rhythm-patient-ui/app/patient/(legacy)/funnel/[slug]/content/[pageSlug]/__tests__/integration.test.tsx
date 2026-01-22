/**
 * Integration Test for V05-I06.5
 * 
 * Tests ContentBlockRenderer integration into standalone content page route
 * Verifies manifest-driven content rendering in patient content pages
 */

// Set environment variables BEFORE any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import ContentPageClient from '../client'
import { SECTION_TYPE } from '@/lib/contracts/funnelManifest'
import type { FunnelContentManifest } from '@/lib/contracts/funnelManifest'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}))

// Mock useIsMobile hook
jest.mock('@/lib/hooks/useIsMobile', () => ({
  useIsMobile: jest.fn(() => false),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('V05-I06.5 — Content Page Route Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('AC1: Manifest-driven content page renders via ContentBlockRenderer', () => {
    it('should render manifest-driven content page with blocks', async () => {
      const contentManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'stress-info',
            title: 'Understanding Stress',
            description: 'Learn about stress and its effects',
            sections: [
              {
                key: 'hero',
                type: SECTION_TYPE.HERO,
                content: {
                  title: 'Understanding Stress',
                  subtitle: 'What you need to know',
                },
              },
              {
                key: 'content',
                type: SECTION_TYPE.MARKDOWN,
                content: {
                  markdown: '# Stress Overview\n\nStress is a natural response...',
                },
              },
            ],
          },
        ],
      }

      const { container } = render(
        <ContentPageClient
          funnelSlug="stress-assessment"
          pageSlug="stress-info"
          contentManifest={contentManifest}
          manifestError={null}
        />
      )

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Seite wird geladen...')).not.toBeInTheDocument()
      }, { timeout: 3000 })

      // Wait for component to process manifest
      await waitFor(() => {
        // Verify ContentBlockRenderer is being used
        expect(container.querySelector('[data-page-slug="stress-info"]')).toBeInTheDocument()
      })

      // Verify content is rendered
      await waitFor(() => {
        // Use getAllByText since "Understanding Stress" appears in multiple places (page title, hero)
        const stressTitles = screen.getAllByText('Understanding Stress')
        expect(stressTitles.length).toBeGreaterThan(0)
        expect(screen.getByText('What you need to know')).toBeInTheDocument()
      })
    })

    it('should render content page with deterministic section order', async () => {
      const contentManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Content',
            sections: [
              {
                key: 'section-b',
                type: SECTION_TYPE.TEXT,
                orderIndex: 1,
                content: { text: 'Second' },
              },
              {
                key: 'section-a',
                type: SECTION_TYPE.HERO,
                orderIndex: 0,
                content: { title: 'First' },
              },
              {
                key: 'section-c',
                type: SECTION_TYPE.DIVIDER,
                orderIndex: 2,
              },
            ],
          },
        ],
      }

      const { container } = render(
        <ContentPageClient
          funnelSlug="test-funnel"
          pageSlug="test-page"
          contentManifest={contentManifest}
          manifestError={null}
        />
      )

      await waitFor(() => {
        const sections = container.querySelectorAll('[data-section-key]')
        expect(sections).toHaveLength(3)

        // Verify deterministic order
        expect(sections[0].getAttribute('data-section-key')).toBe('section-a')
        expect(sections[1].getAttribute('data-section-key')).toBe('section-b')
        expect(sections[2].getAttribute('data-section-key')).toBe('section-c')
      })
    })

    it('should render only the requested page when pageSlug is provided', async () => {
      const contentManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'page-1',
            title: 'Page 1',
            sections: [
              {
                key: 'p1-section',
                type: SECTION_TYPE.HERO,
                content: { title: 'Page 1 Title' },
              },
            ],
          },
          {
            slug: 'page-2',
            title: 'Page 2',
            sections: [
              {
                key: 'p2-section',
                type: SECTION_TYPE.HERO,
                content: { title: 'Page 2 Title' },
              },
            ],
          },
        ],
      }

      const { container } = render(
        <ContentPageClient
          funnelSlug="test-funnel"
          pageSlug="page-1"
          contentManifest={contentManifest}
          manifestError={null}
        />
      )

      await waitFor(() => {
        // Only page-1 should be rendered
        expect(container.querySelector('[data-page-slug="page-1"]')).toBeInTheDocument()
        expect(container.querySelector('[data-page-slug="page-2"]')).not.toBeInTheDocument()
        expect(screen.getByText('Page 1 Title')).toBeInTheDocument()
        expect(screen.queryByText('Page 2 Title')).not.toBeInTheDocument()
      })
    })
  })

  describe('AC2: Fail-closed behavior for invalid manifests', () => {
    it('should display error UI for manifest validation error (422)', async () => {
      const manifestError = 'Manifest-Validierung fehlgeschlagen: Ungültige Konfiguration'

      render(
        <ContentPageClient
          funnelSlug="invalid-funnel"
          pageSlug="test-page"
          contentManifest={null}
          manifestError={manifestError}
        />
      )

      // Wait for component to mount and process
      await waitFor(() => {
        expect(screen.queryByText('Seite wird geladen...')).not.toBeInTheDocument()
      })

      // Should show error UI
      expect(screen.getByText('Konfigurationsfehler')).toBeInTheDocument()
      expect(screen.getByText(manifestError)).toBeInTheDocument()
      expect(screen.getByText('Zurück zur Übersicht')).toBeInTheDocument()
    })

    it('should not render ContentBlockRenderer when manifest is invalid', async () => {
      const manifestError = 'Invalid manifest'

      const { container } = render(
        <ContentPageClient
          funnelSlug="invalid-funnel"
          pageSlug="test-page"
          contentManifest={null}
          manifestError={manifestError}
        />
      )

      // Should NOT render ContentBlockRenderer
      expect(container.querySelector('.content-block-renderer')).not.toBeInTheDocument()
      expect(container.querySelector('[data-page-slug]')).not.toBeInTheDocument()
    })
  })

  describe('AC3: Unknown block type handling', () => {
    it('should handle unknown block type gracefully with error callback', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const contentManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test',
            sections: [
              {
                key: 'valid-text',
                type: SECTION_TYPE.TEXT,
                content: { text: 'Valid text' },
              },
              // @ts-expect-error - Testing unknown type handling
              {
                key: 'invalid-block',
                type: 'fantasy_block_type',
              },
            ],
          },
        ],
      }

      render(
        <ContentPageClient
          funnelSlug="invalid-funnel"
          pageSlug="test-page"
          contentManifest={contentManifest}
          manifestError={null}
        />
      )

      await waitFor(() => {
        // Should log error with PHI-free message
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[CONTENT_PAGE] Unsupported block type')
        )
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('AC4: Fallback to legacy content when manifest is empty', () => {
    it('should not use ContentBlockRenderer when manifest has no matching page', async () => {
      const contentManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'other-page',
            title: 'Other Page',
            sections: [],
          },
        ],
      }

      // Mock legacy API content fetch returns error (no legacy content)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const { container } = render(
        <ContentPageClient
          funnelSlug="test-funnel"
          pageSlug="legacy-page"
          contentManifest={contentManifest}
          manifestError={null}
        />
      )

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Seite wird geladen...')).not.toBeInTheDocument()
      }, { timeout: 3000 })

      // Should NOT use ContentBlockRenderer (no matching page in manifest)
      expect(container.querySelector('[data-page-slug="legacy-page"]')).not.toBeInTheDocument()
      expect(container.querySelector('.content-block-renderer')).not.toBeInTheDocument()
    })
  })

  describe('AC5: Navigation elements', () => {
    it('should render back button in header', async () => {
      const contentManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              {
                key: 'text',
                type: SECTION_TYPE.TEXT,
                content: { text: 'Test content' },
              },
            ],
          },
        ],
      }

      render(
        <ContentPageClient
          funnelSlug="test-funnel"
          pageSlug="test-page"
          contentManifest={contentManifest}
          manifestError={null}
        />
      )

      await waitFor(() => {
        expect(screen.getByLabelText('Zurück')).toBeInTheDocument()
      })
    })

    it('should render "Zurück zum Fragebogen" button', async () => {
      const contentManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'test-page',
            title: 'Test Page',
            sections: [
              {
                key: 'text',
                type: SECTION_TYPE.TEXT,
                content: { text: 'Test content' },
              },
            ],
          },
        ],
      }

      render(
        <ContentPageClient
          funnelSlug="test-funnel"
          pageSlug="test-page"
          contentManifest={contentManifest}
          manifestError={null}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Zurück zum Fragebogen')).toBeInTheDocument()
      })
    })
  })
})
