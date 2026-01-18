/**
 * V061-I01: Tests for PostgREST error classification and handling
 * 
 * Validates the isNotFoundPostgrestError helper function to ensure:
 * - PGRST116 errors correctly map to HTTP 404
 * - Real database errors correctly map to HTTP 500
 * - No PHI/sensitive data in logs
 */

import {
  isNotFoundPostgrestError,
  sanitizeSupabaseError,
  classifySupabaseError,
} from '../errors'

describe('isNotFoundPostgrestError', () => {
  describe('PGRST116 detection (0 rows from .single())', () => {
    it('returns true for PGRST116 error code', () => {
      const error = {
        code: 'PGRST116',
        message: 'JSON object requested, multiple (or no) rows returned',
      }
      expect(isNotFoundPostgrestError(error)).toBe(true)
    })

    it('returns true for PGRST116 with different message', () => {
      const error = {
        code: 'PGRST116',
        message: 'No rows returned',
      }
      expect(isNotFoundPostgrestError(error)).toBe(true)
    })

    it('returns true for PGRST116 with additional fields', () => {
      const error = {
        code: 'PGRST116',
        message: 'JSON object requested, multiple (or no) rows returned',
        details: 'The result contains 0 rows',
        hint: null,
      }
      expect(isNotFoundPostgrestError(error)).toBe(true)
    })
  })

  describe('message-based detection (defensive fallback)', () => {
    it('returns true for "no rows" in message', () => {
      const error = {
        message: 'The query returned no rows',
      }
      expect(isNotFoundPostgrestError(error)).toBe(true)
    })

    it('returns true for "0 rows returned" in message', () => {
      const error = {
        message: 'Query result: 0 rows returned',
      }
      expect(isNotFoundPostgrestError(error)).toBe(true)
    })

    it('returns true for "JSON object requested, no rows" pattern', () => {
      const error = {
        message: 'JSON object requested, but no rows were found',
      }
      expect(isNotFoundPostgrestError(error)).toBe(true)
    })

    it('is case-insensitive', () => {
      const error = {
        message: 'NO ROWS FOUND',
      }
      expect(isNotFoundPostgrestError(error)).toBe(true)
    })
  })

  describe('real database errors (should return false)', () => {
    it('returns false for connection errors (08000)', () => {
      const error = {
        code: '08000',
        message: 'connection_exception',
      }
      expect(isNotFoundPostgrestError(error)).toBe(false)
    })

    it('returns false for RLS violations (PGRST301)', () => {
      const error = {
        code: 'PGRST301',
        message: 'permission denied for table',
      }
      expect(isNotFoundPostgrestError(error)).toBe(false)
    })

    it('returns false for schema errors (42P01)', () => {
      const error = {
        code: '42P01',
        message: 'relation "table_name" does not exist',
      }
      expect(isNotFoundPostgrestError(error)).toBe(false)
    })

    it('returns false for constraint violations (23505)', () => {
      const error = {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      }
      expect(isNotFoundPostgrestError(error)).toBe(false)
    })

    it('returns false for generic internal errors', () => {
      const error = {
        code: '500',
        message: 'Internal server error',
      }
      expect(isNotFoundPostgrestError(error)).toBe(false)
    })

    it('returns false for timeout errors', () => {
      const error = {
        message: 'Query timeout exceeded',
      }
      expect(isNotFoundPostgrestError(error)).toBe(false)
    })
  })

  describe('edge cases and null safety', () => {
    it('returns false for null error', () => {
      expect(isNotFoundPostgrestError(null)).toBe(false)
    })

    it('returns false for undefined error', () => {
      expect(isNotFoundPostgrestError(undefined)).toBe(false)
    })

    it('returns false for empty object', () => {
      expect(isNotFoundPostgrestError({})).toBe(false)
    })

    it('returns false for string error without "not found" indicators', () => {
      expect(isNotFoundPostgrestError('Something went wrong')).toBe(false)
    })

    it('returns false for error with only code, no PGRST116', () => {
      const error = { code: 'PGRST200' }
      expect(isNotFoundPostgrestError(error)).toBe(false)
    })

    it('returns false for error with only non-matching message', () => {
      const error = { message: 'Database is busy' }
      expect(isNotFoundPostgrestError(error)).toBe(false)
    })
  })

  describe('integration with sanitizeSupabaseError', () => {
    it('correctly handles sanitized errors', () => {
      const rawError = {
        code: 'PGRST116',
        message: 'No rows',
        __internal: 'should not leak',
        stackTrace: 'sensitive stack',
      }
      const sanitized = sanitizeSupabaseError(rawError)
      expect(isNotFoundPostgrestError(sanitized)).toBe(true)
      expect(sanitized).not.toHaveProperty('__internal')
      expect(sanitized).not.toHaveProperty('stackTrace')
    })
  })

  describe('integration with classifySupabaseError', () => {
    it('PGRST116 should still be classified as INTERNAL_ERROR (not a special kind)', () => {
      const error = { code: 'PGRST116', message: 'No rows' }
      const classified = classifySupabaseError(error)
      // PGRST116 is NOT in the classification kinds, it defaults to INTERNAL_ERROR
      // The isNotFoundPostgrestError function is what detects it specifically
      expect(classified.kind).toBe('INTERNAL_ERROR')
    })

    it('isNotFoundPostgrestError should be checked BEFORE classifySupabaseError', () => {
      // This demonstrates the correct usage pattern
      const error = { code: 'PGRST116', message: 'No rows' }
      
      // Step 1: Check if it's a not-found error first
      if (isNotFoundPostgrestError(error)) {
        // Should return 404
        expect(true).toBe(true)
      } else {
        // Step 2: Only classify if not a not-found error
        const classified = classifySupabaseError(error)
        // Should not reach here for PGRST116
        fail('PGRST116 should be caught by isNotFoundPostgrestError')
      }
    })
  })
})

describe('sanitizeSupabaseError', () => {
  it('extracts code, message, and hint from error object', () => {
    const error = {
      code: 'PGRST116',
      message: 'No rows found',
      hint: 'Try a different query',
      __sensitive: 'should not appear',
    }
    const sanitized = sanitizeSupabaseError(error)
    expect(sanitized.code).toBe('PGRST116')
    expect(sanitized.message).toBe('No rows found')
    expect(sanitized.hint).toBe('Try a different query')
    expect(sanitized).not.toHaveProperty('__sensitive')
  })

  it('handles string errors', () => {
    const sanitized = sanitizeSupabaseError('Connection failed')
    expect(sanitized.message).toBe('Connection failed')
    expect(sanitized.code).toBeUndefined()
  })

  it('handles null/undefined errors', () => {
    expect(sanitizeSupabaseError(null)).toEqual({ message: 'Unknown error' })
    expect(sanitizeSupabaseError(undefined)).toEqual({ message: 'Unknown error' })
  })
})

describe('classifySupabaseError', () => {
  it('classifies PGRST205 as SCHEMA_NOT_READY', () => {
    const error = {
      code: 'PGRST205',
      message: 'Could not find the table in the schema cache',
    }
    const classified = classifySupabaseError(error)
    expect(classified.kind).toBe('SCHEMA_NOT_READY')
  })

  it('classifies PGRST301 as AUTH_OR_RLS', () => {
    const error = {
      code: 'PGRST301',
      message: 'permission denied',
    }
    const classified = classifySupabaseError(error)
    expect(classified.kind).toBe('AUTH_OR_RLS')
  })

  it('classifies connection errors as TRANSIENT', () => {
    const error = {
      code: '08000',
      message: 'connection failed',
    }
    const classified = classifySupabaseError(error)
    expect(classified.kind).toBe('TRANSIENT')
  })

  it('classifies configuration errors', () => {
    const error = {
      message: 'invalid api key provided',
    }
    const classified = classifySupabaseError(error)
    expect(classified.kind).toBe('CONFIGURATION_ERROR')
  })

  it('defaults unknown errors to INTERNAL_ERROR', () => {
    const error = {
      code: 'UNKNOWN',
      message: 'something unexpected',
    }
    const classified = classifySupabaseError(error)
    expect(classified.kind).toBe('INTERNAL_ERROR')
  })
})
