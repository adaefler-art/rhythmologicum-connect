import { UC1_SAFETY_ROUTE } from '@/lib/api/contracts/triage'
import {
  buildSafetyGateSupportUrl,
  getSupportRouteUi,
  isUc1SafetyRoute,
} from '@/lib/triage/support'

describe('lib/triage/support', () => {
  describe('isUc1SafetyRoute', () => {
    it('returns true for valid UC1 routes', () => {
      expect(isUc1SafetyRoute(UC1_SAFETY_ROUTE.NOTRUF)).toBe(true)
      expect(isUc1SafetyRoute(UC1_SAFETY_ROUTE.NOTAUFNAHME)).toBe(true)
      expect(isUc1SafetyRoute(UC1_SAFETY_ROUTE.DRINGENDER_TERMIN)).toBe(true)
      expect(isUc1SafetyRoute(UC1_SAFETY_ROUTE.STANDARD_INTAKE)).toBe(true)
    })

    it('returns false for invalid or missing routes', () => {
      expect(isUc1SafetyRoute('UNKNOWN_ROUTE')).toBe(false)
      expect(isUc1SafetyRoute(null)).toBe(false)
      expect(isUc1SafetyRoute(undefined)).toBe(false)
    })
  })

  describe('getSupportRouteUi', () => {
    it('marks NOTRUF route as blocked and uses fallback message', () => {
      const ui = getSupportRouteUi(UC1_SAFETY_ROUTE.NOTRUF, null)

      expect(ui.blocked).toBe(true)
      expect(ui.title).toContain('Notruf')
      expect(ui.message).toContain('Notfallsituation')
    })

    it('prefers provided message over fallback text', () => {
      const customMessage = 'Bitte sofort handeln.'
      const ui = getSupportRouteUi(UC1_SAFETY_ROUTE.NOTAUFNAHME, customMessage)

      expect(ui.blocked).toBe(true)
      expect(ui.message).toBe(customMessage)
    })

    it('keeps DRINGENDER_TERMIN route non-blocking', () => {
      const ui = getSupportRouteUi(UC1_SAFETY_ROUTE.DRINGENDER_TERMIN, null)

      expect(ui.blocked).toBe(false)
      expect(ui.title).toContain('dringenden Termin')
    })
  })

  describe('buildSafetyGateSupportUrl', () => {
    it('builds support URL with encoded route and message', () => {
      const message = 'Bitte sofort Notruf kontaktieren.'
      const url = buildSafetyGateSupportUrl({
        route: UC1_SAFETY_ROUTE.NOTRUF,
        message,
      })

      expect(url).toContain('/patient/support?')
      const [, queryString] = url.split('?')
      const params = new URLSearchParams(queryString)

      expect(params.get('source')).toBe('uc1_safety_gate')
      expect(params.get('route')).toBe(UC1_SAFETY_ROUTE.NOTRUF)
      expect(params.get('message')).toBe(message)
    })

    it('supports custom source for triage-driven support deep links', () => {
      const url = buildSafetyGateSupportUrl({
        route: UC1_SAFETY_ROUTE.NOTAUFNAHME,
        message: 'Notaufnahme empfohlen',
        source: 'triage',
      })

      const [, queryString] = url.split('?')
      const params = new URLSearchParams(queryString)
      expect(params.get('source')).toBe('triage')
    })
  })
})