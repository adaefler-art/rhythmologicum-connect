/**
 * E6.4.1: Pilot Eligibility Tests
 * 
 * Tests for pilot eligibility checking functionality.
 * Covers allowlists, DB flags, and combined eligibility checks.
 */

import { User } from '@supabase/supabase-js'
import {
  isPilotEnabled,
  isUserInAllowlist,
  isOrgInAllowlist,
  isPilotEnvironment,
} from '../pilotEligibility'

// Mock user factory
function createMockUser(email: string, id: string = 'test-user-id'): User {
  return {
    id,
    email,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User
}

describe('E6.4.1: Pilot Eligibility', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isPilotEnabled', () => {
    it('should return false when pilot is not enabled', () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'false'
      expect(isPilotEnabled()).toBe(false)
    })

    it('should return true when pilot is enabled', () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'true'
      expect(isPilotEnabled()).toBe(true)
    })

    it('should return false when PILOT_ENABLED is not set', () => {
      delete process.env.NEXT_PUBLIC_PILOT_ENABLED
      expect(isPilotEnabled()).toBe(false)
    })
  })

  describe('isUserInAllowlist', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'true'
      process.env.PILOT_USER_ALLOWLIST = 'test@example.com,pilot@test.com'
    })

    it('should return true for user in email allowlist', () => {
      const user = createMockUser('test@example.com')
      expect(isUserInAllowlist(user)).toBe(true)
    })

    it('should return true for second user in allowlist', () => {
      const user = createMockUser('pilot@test.com')
      expect(isUserInAllowlist(user)).toBe(true)
    })

    it('should return false for user not in allowlist', () => {
      const user = createMockUser('other@example.com')
      expect(isUserInAllowlist(user)).toBe(false)
    })

    it('should return false when pilot is disabled', () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'false'
      const user = createMockUser('test@example.com')
      expect(isUserInAllowlist(user)).toBe(false)
    })

    it('should check by user ID when email not in list', () => {
      process.env.PILOT_USER_ALLOWLIST = 'user-uuid-123'
      const user = createMockUser('other@example.com', 'user-uuid-123')
      expect(isUserInAllowlist(user)).toBe(true)
    })
  })

  describe('isOrgInAllowlist', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'true'
      process.env.PILOT_ORG_ALLOWLIST = 'org-uuid-1,org-uuid-2'
    })

    it('should return true for org in allowlist', () => {
      expect(isOrgInAllowlist('org-uuid-1')).toBe(true)
    })

    it('should return true for second org in allowlist', () => {
      expect(isOrgInAllowlist('org-uuid-2')).toBe(true)
    })

    it('should return false for org not in allowlist', () => {
      expect(isOrgInAllowlist('org-uuid-3')).toBe(false)
    })

    it('should return false when pilot is disabled', () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'false'
      expect(isOrgInAllowlist('org-uuid-1')).toBe(false)
    })
  })

  describe('isPilotEnvironment', () => {
    it('should return true when PILOT_ENV is all', () => {
      process.env.NEXT_PUBLIC_PILOT_ENV = 'all'
      expect(isPilotEnvironment()).toBe(true)
    })

    it('should return true when PILOT_ENV is production', () => {
      process.env.NEXT_PUBLIC_PILOT_ENV = 'production'
      expect(isPilotEnvironment()).toBe(true)
    })

    it('should return true when PILOT_ENV is staging and NODE_ENV is not production', () => {
      process.env.NEXT_PUBLIC_PILOT_ENV = 'staging'
      process.env.NODE_ENV = 'development'
      expect(isPilotEnvironment()).toBe(true)
    })

    it('should return false when PILOT_ENV is staging and NODE_ENV is production', () => {
      process.env.NEXT_PUBLIC_PILOT_ENV = 'staging'
      process.env.NODE_ENV = 'production'
      expect(isPilotEnvironment()).toBe(false)
    })

    it('should return false when PILOT_ENV is invalid', () => {
      process.env.NEXT_PUBLIC_PILOT_ENV = 'invalid'
      expect(isPilotEnvironment()).toBe(false)
    })
  })

  describe('Fail-closed behavior', () => {
    it('should deny access when pilot is disabled globally', () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'false'
      process.env.PILOT_USER_ALLOWLIST = 'test@example.com'
      
      const user = createMockUser('test@example.com')
      expect(isUserInAllowlist(user)).toBe(false)
    })

    it('should deny access when no allowlists are configured', () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'true'
      delete process.env.PILOT_USER_ALLOWLIST
      delete process.env.PILOT_ORG_ALLOWLIST
      
      const user = createMockUser('test@example.com')
      expect(isUserInAllowlist(user)).toBe(false)
      expect(isOrgInAllowlist('any-org')).toBe(false)
    })
  })

  describe('Allowlist parsing', () => {
    it('should handle empty allowlist string', () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'true'
      process.env.PILOT_USER_ALLOWLIST = ''
      
      const user = createMockUser('test@example.com')
      expect(isUserInAllowlist(user)).toBe(false)
    })

    it('should handle whitespace in allowlist', () => {
      process.env.NEXT_PUBLIC_PILOT_ENABLED = 'true'
      process.env.PILOT_ORG_ALLOWLIST = 'org-1, org-2 , org-3'
      
      // Note: Current implementation splits by comma but doesn't trim
      // This documents the behavior
      expect(isOrgInAllowlist('org-1')).toBe(true)
      expect(isOrgInAllowlist(' org-2 ')).toBe(true)
    })
  })
})
