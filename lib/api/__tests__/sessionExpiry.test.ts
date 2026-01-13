/**
 * E6.2.6: Tests for SESSION_EXPIRED error handling
 * 
 * Verifies that session expiry is detected and reported consistently
 * across all authentication scenarios.
 */

import { isSessionExpired } from '../authHelpers'

describe('E6.2.6: Session Expiry Detection', () => {
  describe('isSessionExpired', () => {
    it('should detect JWT expired error', () => {
      const error = new Error('JWT expired')
      expect(isSessionExpired(error)).toBe(true)
    })

    it('should detect jwt expired (lowercase)', () => {
      const error = new Error('jwt expired')
      expect(isSessionExpired(error)).toBe(true)
    })

    it('should detect token expired error', () => {
      const error = new Error('Token expired at 2026-01-13')
      expect(isSessionExpired(error)).toBe(true)
    })

    it('should detect session expired error', () => {
      const error = new Error('Session expired')
      expect(isSessionExpired(error)).toBe(true)
    })

    it('should detect refresh_token_not_found error', () => {
      const error = new Error('refresh_token_not_found')
      expect(isSessionExpired(error)).toBe(true)
    })

    it('should detect invalid refresh token error', () => {
      const error = new Error('Invalid refresh token')
      expect(isSessionExpired(error)).toBe(true)
    })

    it('should return false for non-expiry errors', () => {
      const error = new Error('Network error')
      expect(isSessionExpired(error)).toBe(false)
    })

    it('should return false for undefined error', () => {
      expect(isSessionExpired(undefined)).toBe(false)
    })

    it('should return false for null error', () => {
      expect(isSessionExpired(null)).toBe(false)
    })

    it('should handle error objects with message property', () => {
      const error = { message: 'JWT expired' }
      expect(isSessionExpired(error)).toBe(true)
    })

    it('should handle string errors', () => {
      const error = 'jwt expired'
      expect(isSessionExpired(error)).toBe(true)
    })

    it('should be case-insensitive', () => {
      const error = new Error('JWT EXPIRED')
      expect(isSessionExpired(error)).toBe(true)
    })
  })
})
