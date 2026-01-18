/**
 * V061-I01: Example test demonstrating proper PGRST116 → 404 mapping
 * 
 * This test demonstrates the recommended pattern for API routes:
 * 1. Use isNotFoundPostgrestError() to detect missing resources
 * 2. Map to HTTP 404 with NOT_FOUND error code
 * 3. Map real DB errors to HTTP 500 with DATABASE_ERROR or INTERNAL_ERROR
 */

import { isNotFoundPostgrestError } from '@/lib/db/errors'

/**
 * Example API route handler demonstrating proper error mapping
 * This is a reference implementation showing how to use isNotFoundPostgrestError
 */
async function exampleGetResourceHandler(resourceId: string) {
  // Simulated Supabase query that might return PGRST116
  const mockSupabaseQuery = async (id: string) => {
    if (id === 'missing') {
      return {
        data: null,
        error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
      }
    }
    if (id === 'db-error') {
      return {
        data: null,
        error: { code: '08000', message: 'connection_exception' },
      }
    }
    return {
      data: { id, name: 'Resource' },
      error: null,
    }
  }

  const { data, error } = await mockSupabaseQuery(resourceId)

  if (error) {
    // V061-I01: Check for "not found" FIRST, before other error classification
    if (isNotFoundPostgrestError(error)) {
      // Return 404 NOT_FOUND
      return {
        status: 404,
        body: {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
          },
        },
      }
    }

    // Real database error - return 500
    return {
      status: 500,
      body: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database error occurred',
        },
      },
    }
  }

  if (!data) {
    // Null data without error is also a not-found case
    return {
      status: 404,
      body: {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      },
    }
  }

  return {
    status: 200,
    body: {
      success: true,
      data,
    },
  }
}

describe('V061-I01 Example: PGRST116 → 404 mapping', () => {
  it('returns 404 NOT_FOUND for missing resource (PGRST116)', async () => {
    const response = await exampleGetResourceHandler('missing')

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
    expect(response.body.error.code).toBe('NOT_FOUND')
  })

  it('returns 500 INTERNAL_ERROR for real database error', async () => {
    const response = await exampleGetResourceHandler('db-error')

    expect(response.status).toBe(500)
    expect(response.body.success).toBe(false)
    expect(response.body.error.code).toBe('INTERNAL_ERROR')
  })

  it('returns 200 with data for existing resource', async () => {
    const response = await exampleGetResourceHandler('valid-id')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toEqual({ id: 'valid-id', name: 'Resource' })
  })
})

describe('isNotFoundPostgrestError usage patterns', () => {
  it('correctly identifies PGRST116 as not-found', () => {
    const error = { code: 'PGRST116', message: 'No rows returned' }
    expect(isNotFoundPostgrestError(error)).toBe(true)
  })

  it('correctly identifies real DB errors as NOT not-found', () => {
    const connectionError = { code: '08000', message: 'connection failed' }
    expect(isNotFoundPostgrestError(connectionError)).toBe(false)

    const rlsError = { code: 'PGRST301', message: 'permission denied' }
    expect(isNotFoundPostgrestError(rlsError)).toBe(false)

    const schemaError = { code: '42P01', message: 'table does not exist' }
    expect(isNotFoundPostgrestError(schemaError)).toBe(false)
  })

  it('handles null and undefined safely', () => {
    expect(isNotFoundPostgrestError(null)).toBe(false)
    expect(isNotFoundPostgrestError(undefined)).toBe(false)
  })
})
