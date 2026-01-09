/**
 * Tests for role-specific menu filtering (V05-I06.3)
 * 
 * Validates that menu items are correctly filtered based on user roles:
 * - Patient sees only patient menu items
 * - Clinician sees clinician menu items
 * - Admin sees admin menu items
 * - Nurse sees nurse menu items
 * - Unauthenticated users see no menu items
 * - Unknown roles see no menu items (fail-closed)
 */

import { 
  getNavItemsForRole,
  getPatientNavItems,
  getClinicianNavItems,
  getAdminNavItems,
  getNurseNavItems,
  getUserRole,
  hasRole,
  hasAnyRole,
  canAccessRoute,
  getRoleDisplayName,
} from '../roleBasedRouting'
import type { User } from '@supabase/supabase-js'

// Mock user factory
function createMockUser(role: string): User {
  return {
    id: 'test-user-id',
    email: `${role}@example.com`,
    app_metadata: {
      role: role,
    },
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User
}

describe('Role-Specific Menu Filtering (V05-I06.3)', () => {
  const testPathname = '/clinician'

  describe('getNavItemsForRole - Patient Role', () => {
    it('should return patient navigation items for patient user', () => {
      const user = createMockUser('patient')
      const navItems = getNavItemsForRole(user, '/patient/funnels')
      
      expect(navItems).toHaveLength(2)
      expect(navItems[0].href).toBe('/patient/funnels')
      expect(navItems[0].label).toBe('Fragebogen starten')
      expect(navItems[1].href).toBe('/patient/history')
      expect(navItems[1].label).toBe('Mein Verlauf')
    })

    it('should not return clinician items for patient user', () => {
      const user = createMockUser('patient')
      const navItems = getNavItemsForRole(user, '/clinician')
      
      // Patient should see patient items, not clinician items
      expect(navItems.some(item => item.href === '/clinician')).toBe(false)
      expect(navItems.some(item => item.href === '/clinician/funnels')).toBe(false)
      expect(navItems.some(item => item.href === '/admin/content')).toBe(false)
    })

    it('should not return admin items for patient user', () => {
      const user = createMockUser('patient')
      const navItems = getNavItemsForRole(user, '/admin/content')
      
      expect(navItems.some(item => item.href === '/admin/design-system')).toBe(false)
    })
  })

  describe('getNavItemsForRole - Clinician Role', () => {
    it('should return clinician navigation items for clinician user', () => {
      const user = createMockUser('clinician')
      const navItems = getNavItemsForRole(user, '/clinician')
      
      expect(navItems).toHaveLength(6)
      expect(navItems[0].href).toBe('/clinician')
      expect(navItems[0].label).toBe('Übersicht')
      expect(navItems[1].href).toBe('/clinician/triage')
      expect(navItems[1].label).toBe('Triage')
      expect(navItems[2].href).toBe('/clinician/pre-screening')
      expect(navItems[2].label).toBe('Pre-Screening')
      expect(navItems[3].href).toBe('/clinician/shipments')
      expect(navItems[3].label).toBe('Geräteversand')
      expect(navItems[4].href).toBe('/clinician/funnels')
      expect(navItems[4].label).toBe('Fragebögen')
      expect(navItems[5].href).toBe('/admin/content')
      expect(navItems[5].label).toBe('Inhalte')
    })

    it('should not return patient items for clinician user', () => {
      const user = createMockUser('clinician')
      const navItems = getNavItemsForRole(user, '/clinician')
      
      expect(navItems.some(item => item.href === '/patient/funnels')).toBe(false)
      expect(navItems.some(item => item.href === '/patient/history')).toBe(false)
    })

    it('should not return admin-only items for clinician user', () => {
      const user = createMockUser('clinician')
      const navItems = getNavItemsForRole(user, '/clinician')
      
      // Clinicians should not see Design System
      expect(navItems.some(item => item.href === '/admin/design-system')).toBe(false)
    })
  })

  describe('getNavItemsForRole - Admin Role', () => {
    it('should return admin navigation items for admin user', () => {
      const user = createMockUser('admin')
      const navItems = getNavItemsForRole(user, '/admin/content')
      
      expect(navItems).toHaveLength(8)
      expect(navItems[0].href).toBe('/clinician')
      expect(navItems[1].href).toBe('/clinician/triage')
      expect(navItems[2].href).toBe('/clinician/pre-screening')
      expect(navItems[3].href).toBe('/clinician/shipments')
      expect(navItems[4].href).toBe('/clinician/funnels')
      expect(navItems[5].href).toBe('/admin/content')
      expect(navItems[6].href).toBe('/admin/navigation')
      expect(navItems[7].href).toBe('/admin/design-system')
      expect(navItems[7].label).toBe('Design System')
    })

    it('should not return patient items for admin user', () => {
      const user = createMockUser('admin')
      const navItems = getNavItemsForRole(user, '/admin/content')
      
      expect(navItems.some(item => item.href === '/patient/funnels')).toBe(false)
      expect(navItems.some(item => item.href === '/patient/history')).toBe(false)
    })
  })

  describe('getNavItemsForRole - Nurse Role', () => {
    it('should return nurse navigation items for nurse user', () => {
      const user = createMockUser('nurse')
      const navItems = getNavItemsForRole(user, '/clinician')
      
      expect(navItems).toHaveLength(4)
      expect(navItems[0].href).toBe('/clinician')
      expect(navItems[0].label).toBe('Übersicht')
      expect(navItems[1].href).toBe('/clinician/triage')
      expect(navItems[1].label).toBe('Triage')
      expect(navItems[2].href).toBe('/clinician/shipments')
      expect(navItems[2].label).toBe('Geräteversand')
      expect(navItems[3].href).toBe('/clinician/funnels')
      expect(navItems[3].label).toBe('Fragebögen')
    })

    it('should not return patient items for nurse user', () => {
      const user = createMockUser('nurse')
      const navItems = getNavItemsForRole(user, '/clinician')
      
      expect(navItems.some(item => item.href === '/patient/funnels')).toBe(false)
      expect(navItems.some(item => item.href === '/patient/history')).toBe(false)
    })

    it('should not return admin-only items for nurse user', () => {
      const user = createMockUser('nurse')
      const navItems = getNavItemsForRole(user, '/clinician')
      
      // Nurses should not see Design System
      expect(navItems.some(item => item.href === '/admin/design-system')).toBe(false)
      // Nurses should not see Content management
      expect(navItems.some(item => item.href === '/admin/content')).toBe(false)
    })
  })

  describe('getNavItemsForRole - Unauthenticated User (Fail-Closed)', () => {
    it('should return empty array for null user', () => {
      const navItems = getNavItemsForRole(null, testPathname)
      
      expect(navItems).toEqual([])
      expect(navItems).toHaveLength(0)
    })

    it('should not return any privileged items for unauthenticated user', () => {
      const navItems = getNavItemsForRole(null, testPathname)
      
      expect(navItems.some(item => item.href.startsWith('/patient'))).toBe(false)
      expect(navItems.some(item => item.href.startsWith('/clinician'))).toBe(false)
      expect(navItems.some(item => item.href.startsWith('/admin'))).toBe(false)
    })
  })

  describe('getNavItemsForRole - Unknown Role (Fail-Closed)', () => {
    it('should return empty array for unknown role', () => {
      const user = createMockUser('unknown-role')
      const navItems = getNavItemsForRole(user, testPathname)
      
      expect(navItems).toEqual([])
      expect(navItems).toHaveLength(0)
    })

    it('should return empty array when role is missing from metadata', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User
      
      const navItems = getNavItemsForRole(user, testPathname)
      
      expect(navItems).toEqual([])
    })
  })

  describe('Individual Navigation Functions', () => {
    it('getPatientNavItems should return patient items', () => {
      const items = getPatientNavItems('/patient/funnels')
      expect(items).toHaveLength(2)
      expect(items[0].href).toBe('/patient/funnels')
    })

    it('getClinicianNavItems should return clinician items', () => {
      const items = getClinicianNavItems('/clinician')
      expect(items).toHaveLength(6)
      expect(items[0].href).toBe('/clinician')
    })

    it('getAdminNavItems should return admin items', () => {
      const items = getAdminNavItems('/admin/content')
      expect(items).toHaveLength(8)
      expect(items[7].href).toBe('/admin/design-system')
    })

    it('getNurseNavItems should return nurse items', () => {
      const items = getNurseNavItems('/clinician')
      expect(items).toHaveLength(4)
      expect(items[0].href).toBe('/clinician')
      expect(items[1].href).toBe('/clinician/triage')
      expect(items[2].href).toBe('/clinician/shipments')
      expect(items[3].href).toBe('/clinician/funnels')
    })
  })

  describe('getUserRole', () => {
    it('should extract role from app_metadata', () => {
      const user = createMockUser('clinician')
      expect(getUserRole(user)).toBe('clinician')
    })

    it('should return null for null user', () => {
      expect(getUserRole(null)).toBe(null)
    })

    it('should fall back to user_metadata if app_metadata is not available', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: { role: 'patient' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User
      
      expect(getUserRole(user)).toBe('patient')
    })
  })

  describe('hasRole', () => {
    it('should return true when user has the required role', () => {
      const user = createMockUser('clinician')
      expect(hasRole(user, 'clinician')).toBe(true)
    })

    it('should return false when user does not have the required role', () => {
      const user = createMockUser('patient')
      expect(hasRole(user, 'clinician')).toBe(false)
    })

    it('should return false for null user', () => {
      expect(hasRole(null, 'clinician')).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    it('should return true when user has one of the required roles', () => {
      const user = createMockUser('clinician')
      expect(hasAnyRole(user, ['clinician', 'admin'])).toBe(true)
    })

    it('should return false when user does not have any of the required roles', () => {
      const user = createMockUser('patient')
      expect(hasAnyRole(user, ['clinician', 'admin'])).toBe(false)
    })

    it('should return false for null user', () => {
      expect(hasAnyRole(null, ['clinician', 'admin'])).toBe(false)
    })

    it('should work with nurse role', () => {
      const user = createMockUser('nurse')
      expect(hasAnyRole(user, ['clinician', 'admin', 'nurse'])).toBe(true)
    })

    it('should NOT allow nurse to pass admin layout gate', () => {
      const user = createMockUser('nurse')
      // Admin layout requires ['clinician', 'admin'] only
      expect(hasAnyRole(user, ['clinician', 'admin'])).toBe(false)
    })
  })

  describe('canAccessRoute', () => {
    it('should allow patient to access patient routes', () => {
      const user = createMockUser('patient')
      expect(canAccessRoute(user, '/patient/funnels')).toBe(true)
    })

    it('should allow clinician to access clinician routes', () => {
      const user = createMockUser('clinician')
      expect(canAccessRoute(user, '/clinician')).toBe(true)
    })

    it('should allow nurse to access clinician routes', () => {
      const user = createMockUser('nurse')
      expect(canAccessRoute(user, '/clinician')).toBe(true)
    })

    it('should NOT allow nurse to access admin routes', () => {
      const user = createMockUser('nurse')
      expect(canAccessRoute(user, '/admin/content')).toBe(false)
      expect(canAccessRoute(user, '/admin/design-system')).toBe(false)
    })

    it('should not allow patient to access clinician routes', () => {
      const user = createMockUser('patient')
      expect(canAccessRoute(user, '/clinician')).toBe(false)
    })

    it('should allow everyone to access public routes', () => {
      const patientUser = createMockUser('patient')
      const clinicianUser = createMockUser('clinician')
      
      expect(canAccessRoute(patientUser, '/')).toBe(true)
      expect(canAccessRoute(clinicianUser, '/')).toBe(true)
      expect(canAccessRoute(null, '/')).toBe(true)
      expect(canAccessRoute(patientUser, '/datenschutz')).toBe(true)
    })
  })

  describe('getRoleDisplayName', () => {
    it('should return correct display names for all roles', () => {
      expect(getRoleDisplayName('patient')).toBe('Patient')
      expect(getRoleDisplayName('clinician')).toBe('Clinician')
      expect(getRoleDisplayName('admin')).toBe('Administrator')
      expect(getRoleDisplayName('nurse')).toBe('Nurse')
      expect(getRoleDisplayName(null)).toBe('Benutzer')
    })
  })

  describe('Active State Handling', () => {
    it('should set correct active state for patient items', () => {
      const user = createMockUser('patient')
      const navItems = getNavItemsForRole(user, '/patient/history')
      
      expect(navItems[0].active).toBe(false)
      expect(navItems[1].active).toBe(true)
    })

    it('should set correct active state for clinician items', () => {
      const user = createMockUser('clinician')
      const navItems = getNavItemsForRole(user, '/clinician/funnels')
      
      expect(navItems[0].active).toBe(false)
      expect(navItems[1].active).toBe(false)
      expect(navItems[2].active).toBe(false)
      expect(navItems[3].active).toBe(false)
      expect(navItems[4].active).toBe(true)
      expect(navItems[5].active).toBe(false)
    })

    it('should set correct active state for nurse items', () => {
      const user = createMockUser('nurse')
      const navItems = getNavItemsForRole(user, '/clinician')
      
      expect(navItems[0].active).toBe(true)
      expect(navItems[1].active).toBe(false)
    })
  })
})
