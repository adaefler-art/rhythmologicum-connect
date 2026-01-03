/**
 * Tests for Document Upload API Route
 * 
 * Ensures authentication is checked FIRST (401 before any other validation)
 */

import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/db/supabase.server', () => ({
  createServerSupabaseClient: jest.fn(),
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/documents/helpers', () => ({
  isValidMimeType: jest.fn(),
  isValidFileSize: jest.fn(),
  generateStoragePath: jest.fn(),
  uploadToStorage: jest.fn(),
  verifyAssessmentOwnership: jest.fn(),
  deleteFromStorage: jest.fn(),
}))

jest.mock('@/lib/logging/logger', () => ({
  logUnauthorized: jest.fn(),
  logForbidden: jest.fn(),
}))

const { getCurrentUser } = require('@/lib/db/supabase.server')
const { isValidMimeType, isValidFileSize } = require('@/lib/documents/helpers')

describe('POST /api/documents/upload - Authentication-First Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 for unauthenticated request (no user)', async () => {
    // Mock: No authenticated user
    getCurrentUser.mockResolvedValue(null)

    const formData = new FormData()
    formData.append('file', new Blob(['test'], { type: 'application/pdf' }), 'test.pdf')
    formData.append('assessmentId', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')

    const request = new NextRequest('http://localhost:3000/api/documents/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 401 even when file MIME type is invalid (auth checked first)', async () => {
    // Mock: No authenticated user
    getCurrentUser.mockResolvedValue(null)
    
    // Mock MIME validation to return false (invalid)
    isValidMimeType.mockReturnValue(false)

    const formData = new FormData()
    // Invalid MIME type - but should still get 401, not 415
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt')
    formData.append('assessmentId', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')

    const request = new NextRequest('http://localhost:3000/api/documents/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const json = await response.json()

    // MUST return 401 (not 415) because auth is checked first
    expect(response.status).toBe(401)
    expect(json.error.code).toBe('UNAUTHORIZED')
    
    // Verify MIME validation was NOT called (because auth failed first)
    expect(isValidMimeType).not.toHaveBeenCalled()
  })

  it('returns 401 even when file size exceeds limit (auth checked first)', async () => {
    // Mock: No authenticated user
    getCurrentUser.mockResolvedValue(null)
    
    // Mock size validation to return false (too large)
    isValidFileSize.mockReturnValue(false)

    const formData = new FormData()
    // File too large - but should still get 401, not 413
    const largeBlob = new Blob(['x'.repeat(100 * 1024 * 1024)], { type: 'application/pdf' })
    formData.append('file', largeBlob, 'large.pdf')
    formData.append('assessmentId', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')

    const request = new NextRequest('http://localhost:3000/api/documents/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const json = await response.json()

    // MUST return 401 (not 413) because auth is checked first
    expect(response.status).toBe(401)
    expect(json.error.code).toBe('UNAUTHORIZED')
    
    // Verify size validation was NOT called (because auth failed first)
    expect(isValidFileSize).not.toHaveBeenCalled()
  })

  it('returns 400 for authenticated user with invalid MIME type', async () => {
    // Mock: Authenticated user
    getCurrentUser.mockResolvedValue({ id: 'user-123', email: 'test@example.com' })
    
    // Mock MIME validation to return false (invalid)
    isValidMimeType.mockReturnValue(false)

    const formData = new FormData()
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt')
    formData.append('assessmentId', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')

    const request = new NextRequest('http://localhost:3000/api/documents/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const json = await response.json()

    // For authenticated user, validation errors return 400
    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error.message).toContain('Ungültiger Dateityp')
    
    // Verify MIME validation WAS called (because auth passed)
    expect(isValidMimeType).toHaveBeenCalledWith('text/plain')
  })

  it('returns 400 for authenticated user with file size exceeding limit', async () => {
    // Mock: Authenticated user
    getCurrentUser.mockResolvedValue({ id: 'user-123', email: 'test@example.com' })
    
    // Mock validations
    isValidMimeType.mockReturnValue(true)
    isValidFileSize.mockReturnValue(false) // Too large

    const formData = new FormData()
    const largeBlob = new Blob(['x'.repeat(100 * 1024 * 1024)], { type: 'application/pdf' })
    formData.append('file', largeBlob, 'large.pdf')
    formData.append('assessmentId', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')

    const request = new NextRequest('http://localhost:3000/api/documents/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const json = await response.json()

    // For authenticated user, validation errors return 400
    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error.message).toContain('zu groß')
    
    // Verify size validation WAS called (because auth passed)
    expect(isValidFileSize).toHaveBeenCalled()
  })

  it('returns 401 for missing file even when unauthenticated (auth still first)', async () => {
    // Mock: No authenticated user
    getCurrentUser.mockResolvedValue(null)

    const formData = new FormData()
    // No file attached
    formData.append('assessmentId', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')

    const request = new NextRequest('http://localhost:3000/api/documents/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const json = await response.json()

    // MUST return 401 (not 400 for missing file) because auth is checked first
    expect(response.status).toBe(401)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })
})
