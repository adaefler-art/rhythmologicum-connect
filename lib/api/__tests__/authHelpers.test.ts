/**
 * F10: Unit Tests for Authentication and Authorization Helpers
 * 
 * Tests role-based access control for content CRUD operations
 */

import { hasRole, hasAnyRole } from '../authHelpers'
import { User } from '@supabase/supabase-js'

// Mock user factory
function createMockUser(role?: string): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: role ? { role } : {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User
}

describe('F10: Authentication Helpers', () => {
  describe('hasRole', () => {
    it('should return true when user has the required role in app_metadata', () => {
      const user = createMockUser('admin')
      expect(hasRole(user, 'admin')).toBe(true)
    })

    it('should return false when user does not have the required role', () => {
      const user = createMockUser('patient')
      expect(hasRole(user, 'admin')).toBe(false)
    })

    it('should return false when user has no role set', () => {
      const user = createMockUser()
      expect(hasRole(user, 'admin')).toBe(false)
    })

    it('should check clinician role correctly', () => {
      const clinicianUser = createMockUser('clinician')
      expect(hasRole(clinicianUser, 'clinician')).toBe(true)
      expect(hasRole(clinicianUser, 'admin')).toBe(false)
    })

    it('should check patient role correctly', () => {
      const patientUser = createMockUser('patient')
      expect(hasRole(patientUser, 'patient')).toBe(true)
      expect(hasRole(patientUser, 'clinician')).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    it('should return true when user has one of the required roles', () => {
      const adminUser = createMockUser('admin')
      expect(hasAnyRole(adminUser, ['admin', 'clinician'])).toBe(true)
    })

    it('should return true when user is clinician and clinician is in allowed roles', () => {
      const clinicianUser = createMockUser('clinician')
      expect(hasAnyRole(clinicianUser, ['admin', 'clinician'])).toBe(true)
    })

    it('should return false when user role is not in the list', () => {
      const patientUser = createMockUser('patient')
      expect(hasAnyRole(patientUser, ['admin', 'clinician'])).toBe(false)
    })

    it('should return false when user has no role', () => {
      const user = createMockUser()
      expect(hasAnyRole(user, ['admin', 'clinician'])).toBe(false)
    })

    it('should handle empty roles array', () => {
      const user = createMockUser('admin')
      expect(hasAnyRole(user, [])).toBe(false)
    })

    it('should handle single role in array', () => {
      const adminUser = createMockUser('admin')
      expect(hasAnyRole(adminUser, ['admin'])).toBe(true)
      expect(hasAnyRole(adminUser, ['clinician'])).toBe(false)
    })
  })

  describe('Role-based access scenarios for Content CRUD', () => {
    it('admin should have access to content CRUD operations', () => {
      const adminUser = createMockUser('admin')
      const allowedRoles = ['admin', 'clinician']
      expect(hasAnyRole(adminUser, allowedRoles)).toBe(true)
    })

    it('clinician should have access to content CRUD operations', () => {
      const clinicianUser = createMockUser('clinician')
      const allowedRoles = ['admin', 'clinician']
      expect(hasAnyRole(clinicianUser, allowedRoles)).toBe(true)
    })

    it('patient should NOT have access to content CRUD operations', () => {
      const patientUser = createMockUser('patient')
      const allowedRoles = ['admin', 'clinician']
      expect(hasAnyRole(patientUser, allowedRoles)).toBe(false)
    })

    it('unauthenticated user (no role) should NOT have access', () => {
      const user = createMockUser()
      const allowedRoles = ['admin', 'clinician']
      expect(hasAnyRole(user, allowedRoles)).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should handle role in user_metadata as fallback', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: { role: 'admin' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User

      expect(hasRole(user, 'admin')).toBe(true)
    })

    it('should prioritize app_metadata over user_metadata', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: { role: 'admin' },
        user_metadata: { role: 'patient' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User

      // app_metadata should take precedence
      expect(hasRole(user, 'admin')).toBe(true)
      expect(hasRole(user, 'patient')).toBe(false)
    })
  })
})
