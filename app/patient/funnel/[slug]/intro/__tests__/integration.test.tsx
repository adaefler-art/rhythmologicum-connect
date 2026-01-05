/**
 * Integration Test for V05-I06.5
 * 
 * Tests ContentBlockRenderer integration into funnel intro route
 * Verifies manifest-driven content rendering in patient pages
 */

// Set environment variables BEFORE any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import IntroPageClient from '../client'
import { SECTION_TYPE } from '@/lib/contracts/funnelManifest'
import type { FunnelContentManifest, QuestionnaireStep } from '@/lib/contracts/funnelManifest'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('V05-I06.5 — Funnel Intro Route Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('AC1: Manifest-driven content renders via ContentBlockRenderer', () => {
    it('should render manifest-driven intro page with blocks', async () => {
      const contentManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'intro',
            title: 'Welcome to Stress Assessment',
            sections: [
              {
                key: 'hero-section',
                type: SECTION_TYPE.HERO,
                content: {
                  title: 'Stress Assessment',
                  subtitle: 'Understand your stress levels',
                },
              },
              {
                key: 'text-section',
                type: SECTION_TYPE.TEXT,
                content: {
                  title: 'About This Assessment',
                  text: 'This assessment will help you understand your stress.',
                },
              },
            ],
          },
        ],
      }

      const steps: QuestionnaireStep[] = [
        {
          id: 'step-1',
          title: 'Step 1',
          questions: [
            {
              id: 'q1',
              key: 'q1',
              type: 'scale',
              label: 'Question 1',
              required: true,
              minValue: 1,
              maxValue: 10,
            },
          ],
        },
      ]

      const manifestData = {
        version: '1.0.0',
        funnelId: 'funnel-123',
        algorithmVersion: 'v1.0.0',
        promptVersion: '1.0',
        steps,
        contentPages: contentManifest.pages,
        contentManifest,
      }

      // Mock successful funnel definition fetch
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: 'Stress Assessment' }),
      })

      const { container } = render(
        <IntroPageClient
          funnelSlug="stress-assessment"
          manifestData={manifestData}
          manifestError={null}
        />
      )

      // Wait for component to process manifest
      await waitFor(() => {
        // Verify ContentBlockRenderer is being used (check for data attributes)
        expect(container.querySelector('[data-page-slug="intro"]')).toBeInTheDocument()
      })

      // Verify content is rendered
      await waitFor(() => {
        expect(screen.getByText('Stress Assessment')).toBeInTheDocument()
        expect(screen.getByText('Understand your stress levels')).toBeInTheDocument()
      })
    })

    it('should render expected blocks in deterministic order', async () => {
      const contentManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [
          {
            slug: 'intro',
            title: 'Test Page',
            sections: [
              {
                key: 'section-3',
                type: SECTION_TYPE.TEXT,
                orderIndex: 2,
                content: { text: 'Third section' },
              },
              {
                key: 'section-1',
                type: SECTION_TYPE.HERO,
                orderIndex: 0,
                content: { title: 'First section' },
              },
              {
                key: 'section-2',
                type: SECTION_TYPE.DIVIDER,
                orderIndex: 1,
              },
            ],
          },
        ],
      }

      const manifestData = {
        version: '1.0.0',
        funnelId: 'funnel-123',
        algorithmVersion: 'v1.0.0',
        promptVersion: '1.0',
        steps: [],
        contentPages: contentManifest.pages,
        contentManifest,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: 'Test Funnel' }),
      })

      const { container } = render(
        <IntroPageClient
          funnelSlug="test-funnel"
          manifestData={manifestData}
          manifestError={null}
        />
      )

      await waitFor(() => {
        const sections = container.querySelectorAll('[data-section-key]')
        expect(sections).toHaveLength(3)

        // Verify order by orderIndex
        expect(sections[0].getAttribute('data-section-key')).toBe('section-1')
        expect(sections[1].getAttribute('data-section-key')).toBe('section-2')
        expect(sections[2].getAttribute('data-section-key')).toBe('section-3')
      })
    })
  })

  describe('AC2: Fail-closed behavior for invalid manifests', () => {
    it('should display error UI for manifest validation error (422)', async () => {
      const manifestError = 'Manifest-Validierung fehlgeschlagen: Ungültige Konfiguration'

      render(
        <IntroPageClient
          funnelSlug="invalid-funnel"
          manifestData={null}
          manifestError={manifestError}
        />
      )

      // Should show error UI immediately
      expect(screen.getByText('Konfigurationsfehler')).toBeInTheDocument()
      expect(screen.getByText(manifestError)).toBeInTheDocument()
      expect(screen.getByText('Zurück zur Übersicht')).toBeInTheDocument()
    })

    it('should not render ContentBlockRenderer when manifest is invalid', async () => {
      const manifestError = 'Invalid manifest'

      const { container } = render(
        <IntroPageClient
          funnelSlug="invalid-funnel"
          manifestData={null}
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
            slug: 'intro',
            title: 'Test',
            sections: [
              {
                key: 'valid-hero',
                type: SECTION_TYPE.HERO,
                content: { title: 'Valid Hero' },
              },
              // @ts-expect-error - Testing unknown type handling
              {
                key: 'invalid-block',
                type: 'unknown_fantasy_type',
              },
            ],
          },
        ],
      }

      const manifestData = {
        version: '1.0.0',
        funnelId: 'funnel-123',
        algorithmVersion: 'v1.0.0',
        promptVersion: '1.0',
        steps: [],
        contentPages: contentManifest.pages,
        contentManifest,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: 'Test Funnel' }),
      })

      render(
        <IntroPageClient
          funnelSlug="test-funnel"
          manifestData={manifestData}
          manifestError={null}
        />
      )

      await waitFor(() => {
        // Should log error with PHI-free message  
        // Error callback receives blockType and sectionKey
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[INTRO_PAGE] Unsupported block type')
        )
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('AC4: Fallback to legacy content when manifest is empty', () => {
    it('should not use ContentBlockRenderer when manifest has no intro page', async () => {
      const contentManifest: FunnelContentManifest = {
        version: '1.0',
        pages: [], // No intro page in manifest
      }

      const manifestData = {
        version: '1.0.0',
        funnelId: 'funnel-123',
        algorithmVersion: 'v1.0.0',
        promptVersion: '1.0',
        steps: [],
        contentPages: [],
        contentManifest,
      }

      // Mock funnel definition fetch
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: 'Test Funnel' }),
      })

      // Mock content resolver fetch returns error (no legacy content)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const { container } = render(
        <IntroPageClient
          funnelSlug="test-funnel"
          manifestData={manifestData}
          manifestError={null}
        />
      )

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Bitte warten…')).not.toBeInTheDocument()
      }, { timeout: 3000 })

      // Should NOT use ContentBlockRenderer (no manifest content)
      expect(container.querySelector('[data-page-slug="intro"]')).not.toBeInTheDocument()
      expect(container.querySelector('.content-block-renderer')).not.toBeInTheDocument()
    })
  })
})
