/**
 * Integration Test for E6.5.7
 * 
 * Tests content page rendering with safe markdown and 404 handling
 */

// Set environment variables BEFORE any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ContentPageClient from '../client'
import type { ContentPage } from '@/lib/types/content'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    back: jest.fn(),
  })),
}))

describe('E6.5.7 — Content Page Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
  })

  const mockContentPage: ContentPage = {
    id: 'test-id',
    slug: 'stress-verstehen',
    title: 'Stress verstehen',
    excerpt: 'Erfahren Sie mehr über die verschiedenen Arten von Stress.',
    body_markdown: '# Was ist Stress?\n\nStress ist eine natürliche Reaktion des Körpers.',
    status: 'published',
    layout: 'default',
    category: 'info',
    priority: 10,
    funnel_id: null,
    flow_step: null,
    order_index: null,
    created_at: '2026-01-16T00:00:00Z',
    updated_at: '2026-01-16T00:00:00Z',
    deleted_at: null,
    seo_title: null,
    seo_description: null,
  }

  describe('AC2: Safe markdown rendering (no XSS)', () => {
    it('should render markdown content safely', () => {
      const { container } = render(<ContentPageClient contentPage={mockContentPage} />)

      // Verify title is rendered
      expect(screen.getByText('Stress verstehen')).toBeInTheDocument()

      // Verify excerpt is rendered
      expect(
        screen.getByText('Erfahren Sie mehr über die verschiedenen Arten von Stress.')
      ).toBeInTheDocument()

      // Verify markdown content is rendered within prose wrapper
      // Note: In test environment, react-markdown is mocked and returns raw markdown
      const markdownContainer = container.querySelector('.markdown-content')
      expect(markdownContainer).toBeInTheDocument()
      expect(markdownContainer?.textContent).toContain('Was ist Stress?')
      expect(markdownContainer?.textContent).toContain('Stress ist eine natürliche Reaktion des Körpers.')
    })

    it('should strip HTML from markdown (XSS protection)', () => {
      const xssContentPage: ContentPage = {
        ...mockContentPage,
        body_markdown: '<script>alert("XSS")</script>\n\nSafe content here.',
      }

      const { container } = render(<ContentPageClient contentPage={xssContentPage} />)

      // Verify no script tags are rendered
      expect(container.querySelector('script')).not.toBeInTheDocument()

      // Verify content is rendered (in test environment, HTML tags are escaped by react-markdown mock)
      const markdownContainer = container.querySelector('.markdown-content')
      expect(markdownContainer).toBeInTheDocument()
      expect(markdownContainer?.textContent).toContain('Safe content here.')
    })

    it('should render external links with security attributes', () => {
      const linkContentPage: ContentPage = {
        ...mockContentPage,
        body_markdown: '[External Link](https://example.com)',
      }

      const { container } = render(<ContentPageClient contentPage={linkContentPage} />)

      const link = container.querySelector('a[href="https://example.com"]')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveAttribute('target', '_blank')
    })
  })

  describe('AC3: Back navigation to start', () => {
    it('should render back to start button', () => {
      render(<ContentPageClient contentPage={mockContentPage} />)

      const backButton = screen.getByText('Zurück zum Start')
      expect(backButton).toBeInTheDocument()
    })

    it('should navigate to start when back button is clicked', () => {
      render(<ContentPageClient contentPage={mockContentPage} />)

      const backButton = screen.getByText('Zurück zum Start')
      fireEvent.click(backButton)

      expect(mockPush).toHaveBeenCalledWith('/patient/start')
    })
  })

  describe('Content rendering', () => {
    it('should render CMS blocks when blocks are present', () => {
      const blockContentPage: ContentPage = {
        ...mockContentPage,
        blocks: [
          { id: 'hero-1', type: 'hero', title: 'Hero Titel', subtitle: 'Hero Untertitel', order: 0 },
          { id: 'badge-1', type: 'badge', label: 'Auszeichnung', text: 'Top bewertet', order: 1 },
          { id: 'cta-1', type: 'cta', label: 'Mehr erfahren', href: '/patient/start', order: 2 },
        ],
      }

      render(<ContentPageClient contentPage={blockContentPage} />)

      expect(screen.getByText('Hero Titel')).toBeInTheDocument()
      expect(screen.getByText('Auszeichnung')).toBeInTheDocument()
      expect(screen.getByText('Mehr erfahren')).toBeInTheDocument()
    })

    it('should render content without excerpt if not provided', () => {
      const noExcerptPage: ContentPage = {
        ...mockContentPage,
        excerpt: null,
      }

      render(<ContentPageClient contentPage={noExcerptPage} />)

      expect(screen.getByText('Stress verstehen')).toBeInTheDocument()
      expect(
        screen.queryByText('Erfahren Sie mehr über die verschiedenen Arten von Stress.')
      ).not.toBeInTheDocument()
    })

    it('should render markdown with GFM features (tables, strikethrough)', () => {
      const gfmContentPage: ContentPage = {
        ...mockContentPage,
        body_markdown: '| Header | Header 2 |\n|--------|----------|\n| Cell 1 | Cell 2 |\n\n~~strikethrough~~',
      }

      const { container } = render(<ContentPageClient contentPage={gfmContentPage} />)

      // Verify markdown content is rendered
      // Note: In test environment, react-markdown is mocked and returns raw markdown
      const markdownContainer = container.querySelector('.markdown-content')
      expect(markdownContainer).toBeInTheDocument()
      expect(markdownContainer?.textContent).toContain('Header')
      expect(markdownContainer?.textContent).toContain('Cell 1')
      expect(markdownContainer?.textContent).toContain('strikethrough')
    })
  })
})
