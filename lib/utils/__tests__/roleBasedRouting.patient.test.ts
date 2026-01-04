/**
 * Tests for patient navigation configuration (V05-I06.1)
 * 
 * Validates that the mobile shell navigation items have correct
 * active states for different patient routes.
 */

import { getPatientNavItems } from '../roleBasedRouting'

describe('getPatientNavItems - Mobile Shell Navigation', () => {
  describe('Active state for first navigation item (Fragebogen starten)', () => {
    it('should be active on /patient/funnels route', () => {
      const navItems = getPatientNavItems('/patient/funnels')
      const firstItem = navItems[0]
      
      expect(firstItem.label).toBe('Fragebogen starten')
      expect(firstItem.href).toBe('/patient/funnels')
      expect(firstItem.active).toBe(false) // Active only on assessment/funnel routes
    })

    it('should be active on /patient/assessment route', () => {
      const navItems = getPatientNavItems('/patient/assessment')
      const firstItem = navItems[0]
      
      expect(firstItem.active).toBe(true)
    })

    it('should be active on /patient/funnel/stress-assessment route', () => {
      const navItems = getPatientNavItems('/patient/funnel/stress-assessment')
      const firstItem = navItems[0]
      
      expect(firstItem.active).toBe(true)
    })

    it('should be active on /patient/funnel/stress-assessment/intro route', () => {
      const navItems = getPatientNavItems('/patient/funnel/stress-assessment/intro')
      const firstItem = navItems[0]
      
      expect(firstItem.active).toBe(true)
    })

    it('should NOT be active on /patient/history route', () => {
      const navItems = getPatientNavItems('/patient/history')
      const firstItem = navItems[0]
      
      expect(firstItem.active).toBe(false)
    })
  })

  describe('Active state for second navigation item (Mein Verlauf)', () => {
    it('should be active on /patient/history route', () => {
      const navItems = getPatientNavItems('/patient/history')
      const secondItem = navItems[1]
      
      expect(secondItem.label).toBe('Mein Verlauf')
      expect(secondItem.href).toBe('/patient/history')
      expect(secondItem.active).toBe(true)
    })

    it('should NOT be active on /patient/funnels route', () => {
      const navItems = getPatientNavItems('/patient/funnels')
      const secondItem = navItems[1]
      
      expect(secondItem.active).toBe(false)
    })

    it('should NOT be active on /patient/assessment route', () => {
      const navItems = getPatientNavItems('/patient/assessment')
      const secondItem = navItems[1]
      
      expect(secondItem.active).toBe(false)
    })
  })

  describe('Navigation structure', () => {
    it('should return exactly 2 navigation items', () => {
      const navItems = getPatientNavItems('/patient/funnels')
      
      expect(navItems).toHaveLength(2)
    })

    it('should have correct hrefs for both items', () => {
      const navItems = getPatientNavItems('/patient/funnels')
      
      expect(navItems[0].href).toBe('/patient/funnels')
      expect(navItems[1].href).toBe('/patient/history')
    })

    it('should have correct labels for both items', () => {
      const navItems = getPatientNavItems('/patient/funnels')
      
      expect(navItems[0].label).toBe('Fragebogen starten')
      expect(navItems[1].label).toBe('Mein Verlauf')
    })
  })

  describe('Edge cases', () => {
    it('should handle undefined pathname gracefully', () => {
      const navItems = getPatientNavItems(undefined as any)
      
      expect(navItems).toHaveLength(2)
      expect(navItems[0].active).toBe(false)
      expect(navItems[1].active).toBe(false)
    })

    it('should handle empty pathname', () => {
      const navItems = getPatientNavItems('')
      
      expect(navItems).toHaveLength(2)
      expect(navItems[0].active).toBe(false)
      expect(navItems[1].active).toBe(false)
    })

    it('should handle null pathname', () => {
      const navItems = getPatientNavItems(null as any)
      
      expect(navItems).toHaveLength(2)
      expect(navItems[0].active).toBe(false)
      expect(navItems[1].active).toBe(false)
    })
  })
})
