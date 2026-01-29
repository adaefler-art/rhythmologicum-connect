/**
 * E73.7: Content API Tests
 * 
 * Tests for patient content API endpoint GET /api/content/{slug}
 * Validates:
 * - Published content returns 200
 * - Draft content returns 404
 * - Deleted content returns 404
 * - Non-existent slug returns 404
 * - Deterministic behavior (no fallbacks)
 */

import { NextRequest } from 'next/server'
import { GET } from '../route'

// Mock Supabase client
jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

const { createServerSupabaseClient } = require('@/lib/db/supabase.server')

describe('E73.7: GET /api/content/{slug}', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      is: jest.fn(() => mockSupabase),
      single: jest.fn(),
    }

    createServerSupabaseClient.mockResolvedValue(mockSupabase)
  })

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest(new URL('http://localhost/api/content/test-slug'))
      const response = await GET(request, { params: Promise.resolve({ slug: 'test-slug' }) })

      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toBe('Authentication required')
    })

    it('returns 401 when auth error occurs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth failed'),
      })

      const request = new NextRequest(new URL('http://localhost/api/content/test-slug'))
      const response = await GET(request, { params: Promise.resolve({ slug: 'test-slug' }) })

      expect(response.status).toBe(401)
    })
  })

  describe('Published Content', () => {
    const mockUser = { id: 'user-123' }
    const mockPublishedContent = {
      id: 'content-123',
      slug: 'test-content',
      title: 'Test Content',
      excerpt: 'Test excerpt',
      body_markdown: '# Test\n\nContent',
      status: 'published',
      layout: 'default',
      category: 'info',
      priority: 0,
      funnel_id: null,
      flow_step: null,
      order_index: null,
      seo_title: null,
      seo_description: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    })

    it('returns 200 with published content', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockPublishedContent,
        error: null,
      })

      const request = new NextRequest(new URL('http://localhost/api/content/test-content'))
      const response = await GET(request, { params: Promise.resolve({ slug: 'test-content' }) })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data).toMatchObject({
        slug: 'test-content',
        title: 'Test Content',
        status: 'published',
      })
    })

    it('sets appropriate cache headers for published content', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockPublishedContent,
        error: null,
      })

      const request = new NextRequest(new URL('http://localhost/api/content/test-content'))
      const response = await GET(request, { params: Promise.resolve({ slug: 'test-content' }) })

      expect(response.headers.get('Cache-Control')).toBeTruthy()
    })
  })

  describe('Deterministic 404 Behavior', () => {
    const mockUser = { id: 'user-123' }

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    })

    it('returns 404 for non-existent slug', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      const request = new NextRequest(new URL('http://localhost/api/content/nonexistent'))
      const response = await GET(request, { params: Promise.resolve({ slug: 'nonexistent' }) })

      expect(response.status).toBe(404)
      const json = await response.json()
      expect(json.error).toBe('Content not found')
    })

    it('returns 404 for draft content (not published)', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      const request = new NextRequest(new URL('http://localhost/api/content/draft-content'))
      const response = await GET(request, { params: Promise.resolve({ slug: 'draft-content' }) })

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Content not found' })
    })

    it('returns 404 for archived content', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      const request = new NextRequest(new URL('http://localhost/api/content/archived-content'))
      const response = await GET(request, { params: Promise.resolve({ slug: 'archived-content' }) })

      expect(response.status).toBe(404)
    })

    it('returns 404 for soft-deleted content', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      const request = new NextRequest(new URL('http://localhost/api/content/deleted-content'))
      const response = await GET(request, { params: Promise.resolve({ slug: 'deleted-content' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('Input Validation', () => {
    const mockUser = { id: 'user-123' }

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    })

    it('returns 400 for empty slug', async () => {
      const request = new NextRequest(new URL('http://localhost/api/content/'))
      const response = await GET(request, { params: Promise.resolve({ slug: '' }) })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Invalid slug parameter')
    })
  })

  describe('Error Handling', () => {
    const mockUser = { id: 'user-123' }

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    })

    it('returns 500 on unexpected database error', async () => {
      mockSupabase.single.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest(new URL('http://localhost/api/content/test-slug'))
      const response = await GET(request, { params: Promise.resolve({ slug: 'test-slug' }) })

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Internal server error')
    })
  })
})
