/**
 * E6.6.5 — Triage Router Tests
 *
 * Tests for deterministic nextAction → route mapping.
 * AC2: Router actions are deterministic and tested.
 */

import {
  mapNextActionToRoute,
  buildRouteUrl,
  getNavigationTarget,
  isRoutableAction,
  type TriageRoute,
} from '../router'
import { TRIAGE_NEXT_ACTION, TRIAGE_TIER, UC1_SAFETY_ROUTE } from '@/lib/api/contracts/triage'
import type { TriageResultV1 } from '@/lib/api/contracts/triage'

describe('lib/triage/router', () => {
  // Helper to create a minimal triage result
  const createTriageResult = (
    nextAction: TriageResultV1['nextAction'],
    tier: TriageResultV1['tier'] = TRIAGE_TIER.ASSESSMENT,
  ): TriageResultV1 => ({
    tier,
    nextAction,
    redFlags: [],
    rationale: 'Test rationale',
    version: 'v1',
    correlationId: 'test-correlation-id',
  })

  describe('mapNextActionToRoute', () => {
    it('AC1: maps SHOW_CONTENT to content section on dashboard', () => {
      const result = createTriageResult(TRIAGE_NEXT_ACTION.SHOW_CONTENT, TRIAGE_TIER.INFO)
      const route = mapNextActionToRoute(TRIAGE_NEXT_ACTION.SHOW_CONTENT, result)

      expect(route.path).toBe('/patient/dashboard')
      expect(route.query).toEqual({ scrollTo: 'content' })
      expect(route.state).toMatchObject({
        highlightContent: true,
        triageTier: TRIAGE_TIER.INFO,
      })
      expect(route.description).toContain('content')
    })

    it('AC1: maps START_FUNNEL_A to stress-resilience funnel', () => {
      const result = createTriageResult(
        TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        TRIAGE_TIER.ASSESSMENT,
      )
      const route = mapNextActionToRoute(TRIAGE_NEXT_ACTION.START_FUNNEL_A, result)

      expect(route.path).toBe('/patient/funnel/stress-resilience')
      expect(route.query).toEqual({ source: 'triage' })
      expect(route.state).toMatchObject({
        triageRationale: result.rationale,
        triageTier: TRIAGE_TIER.ASSESSMENT,
      })
      expect(route.description).toContain('Funnel A')
    })

    it('propagates triageSafetyRoute in START_FUNNEL_A query when present', () => {
      const result = createTriageResult(
        TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        TRIAGE_TIER.ASSESSMENT,
      )
      result.safetyRoute = UC1_SAFETY_ROUTE.DRINGENDER_TERMIN

      const route = mapNextActionToRoute(TRIAGE_NEXT_ACTION.START_FUNNEL_A, result)

      expect(route.query).toEqual({
        source: 'triage',
        triageSafetyRoute: UC1_SAFETY_ROUTE.DRINGENDER_TERMIN,
      })
      expect(route.state).toMatchObject({
        triageSafetyRoute: UC1_SAFETY_ROUTE.DRINGENDER_TERMIN,
      })
    })

    it('AC1: maps START_FUNNEL_B to sleep funnel', () => {
      const result = createTriageResult(
        TRIAGE_NEXT_ACTION.START_FUNNEL_B,
        TRIAGE_TIER.ASSESSMENT,
      )
      const route = mapNextActionToRoute(TRIAGE_NEXT_ACTION.START_FUNNEL_B, result)

      expect(route.path).toBe('/patient/funnel/sleep')
      expect(route.query).toEqual({ source: 'triage' })
      expect(route.state).toMatchObject({
        triageRationale: result.rationale,
        triageTier: TRIAGE_TIER.ASSESSMENT,
      })
      expect(route.description).toContain('Funnel B')
    })

    it('AC1: maps RESUME_FUNNEL to dashboard with resume action', () => {
      const result = createTriageResult(TRIAGE_NEXT_ACTION.RESUME_FUNNEL)
      const route = mapNextActionToRoute(TRIAGE_NEXT_ACTION.RESUME_FUNNEL, result)

      expect(route.path).toBe('/patient/dashboard')
      expect(route.query).toEqual({ action: 'resume' })
      expect(route.state).toMatchObject({
        triageRationale: result.rationale,
      })
      expect(route.description).toContain('Resume')
    })

    it('AC1: maps SHOW_ESCALATION to support page with urgent flag', () => {
      const result = createTriageResult(
        TRIAGE_NEXT_ACTION.SHOW_ESCALATION,
        TRIAGE_TIER.ESCALATE,
      )
      result.redFlags = ['answer_pattern']

      const route = mapNextActionToRoute(TRIAGE_NEXT_ACTION.SHOW_ESCALATION, result)

      expect(route.path).toBe('/patient/support')
      expect(route.query).toMatchObject({
        source: 'triage',
        tier: TRIAGE_TIER.ESCALATE,
      })
      expect(route.state).toMatchObject({
        triageRationale: result.rationale,
        redFlags: ['answer_pattern'],
        urgent: true,
      })
      expect(route.description).toContain('escalation')
    })

    it('propagates safety route to escalation query when present', () => {
      const result = createTriageResult(
        TRIAGE_NEXT_ACTION.SHOW_ESCALATION,
        TRIAGE_TIER.ESCALATE,
      )
      result.redFlags = ['answer_pattern']
      result.safetyRoute = UC1_SAFETY_ROUTE.NOTRUF

      const route = mapNextActionToRoute(TRIAGE_NEXT_ACTION.SHOW_ESCALATION, result)

      expect(route.query).toMatchObject({
        source: 'triage',
        tier: TRIAGE_TIER.ESCALATE,
        route: UC1_SAFETY_ROUTE.NOTRUF,
      })
      expect(route.state).toMatchObject({
        triageSafetyRoute: UC1_SAFETY_ROUTE.NOTRUF,
      })
    })

    it('AC2: is deterministic - same input produces same output', () => {
      const result1 = createTriageResult(TRIAGE_NEXT_ACTION.START_FUNNEL_A)
      const result2 = createTriageResult(TRIAGE_NEXT_ACTION.START_FUNNEL_A)

      const route1 = mapNextActionToRoute(TRIAGE_NEXT_ACTION.START_FUNNEL_A, result1)
      const route2 = mapNextActionToRoute(TRIAGE_NEXT_ACTION.START_FUNNEL_A, result2)

      expect(route1).toEqual(route2)
    })

    it('handles unknown nextAction gracefully with fallback', () => {
      const result = createTriageResult(TRIAGE_NEXT_ACTION.SHOW_CONTENT)
      // Force unknown action via type assertion
      const unknownAction = 'UNKNOWN_ACTION' as any

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const route = mapNextActionToRoute(unknownAction, result)

      expect(route.path).toBe('/patient/dashboard')
      expect(route.query).toEqual({})
      expect(route.description).toContain('Fallback')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown nextAction'),
        expect.any(Object),
      )

      consoleSpy.mockRestore()
    })
  })

  describe('buildRouteUrl', () => {
    it('builds URL without query parameters', () => {
      const route: TriageRoute = {
        path: '/patient/dashboard',
        query: {},
        description: 'Test',
      }

      const url = buildRouteUrl(route)
      expect(url).toBe('/patient/dashboard')
    })

    it('builds URL with single query parameter', () => {
      const route: TriageRoute = {
        path: '/patient/dashboard',
        query: { scrollTo: 'content' },
        description: 'Test',
      }

      const url = buildRouteUrl(route)
      expect(url).toBe('/patient/dashboard?scrollTo=content')
    })

    it('builds URL with multiple query parameters', () => {
      const route: TriageRoute = {
        path: '/patient/support',
        query: {
          source: 'triage',
          tier: 'ESCALATE',
        },
        description: 'Test',
      }

      const url = buildRouteUrl(route)
      expect(url).toBe('/patient/support?source=triage&tier=ESCALATE')
    })

    it('handles missing query object', () => {
      const route: TriageRoute = {
        path: '/patient/dashboard',
        description: 'Test',
      }

      const url = buildRouteUrl(route)
      expect(url).toBe('/patient/dashboard')
    })

    it('URL-encodes query parameter values', () => {
      const route: TriageRoute = {
        path: '/patient/dashboard',
        query: {
          message: 'Hello World',
          special: 'chars&stuff',
        },
        description: 'Test',
      }

      const url = buildRouteUrl(route)
      expect(url).toContain('message=Hello+World')
      expect(url).toContain('special=chars%26stuff')
    })
  })

  describe('getNavigationTarget', () => {
    it('combines route mapping and URL building', () => {
      const result = createTriageResult(TRIAGE_NEXT_ACTION.START_FUNNEL_A)
      const target = getNavigationTarget(TRIAGE_NEXT_ACTION.START_FUNNEL_A, result)

      expect(target.url).toBe('/patient/funnel/stress-resilience?source=triage')
      expect(target.state).toMatchObject({
        triageRationale: result.rationale,
        triageTier: result.tier,
      })
      expect(target.description).toContain('Funnel A')
    })

    it('preserves state from route mapping', () => {
      const result = createTriageResult(
        TRIAGE_NEXT_ACTION.SHOW_ESCALATION,
        TRIAGE_TIER.ESCALATE,
      )
      result.redFlags = ['answer_pattern']

      const target = getNavigationTarget(TRIAGE_NEXT_ACTION.SHOW_ESCALATION, result)

      expect(target.state).toMatchObject({
        triageRationale: result.rationale,
        redFlags: ['answer_pattern'],
        urgent: true,
      })
    })

    it('handles routes without state gracefully', () => {
      const result = createTriageResult(TRIAGE_NEXT_ACTION.RESUME_FUNNEL)
      const target = getNavigationTarget(TRIAGE_NEXT_ACTION.RESUME_FUNNEL, result)

      expect(target.state).toBeDefined()
      expect(typeof target.state).toBe('object')
    })
  })

  describe('isRoutableAction', () => {
    it('returns true for valid nextActions', () => {
      expect(isRoutableAction(TRIAGE_NEXT_ACTION.SHOW_CONTENT)).toBe(true)
      expect(isRoutableAction(TRIAGE_NEXT_ACTION.START_FUNNEL_A)).toBe(true)
      expect(isRoutableAction(TRIAGE_NEXT_ACTION.START_FUNNEL_B)).toBe(true)
      expect(isRoutableAction(TRIAGE_NEXT_ACTION.RESUME_FUNNEL)).toBe(true)
      expect(isRoutableAction(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)).toBe(true)
    })

    it('returns false for invalid actions', () => {
      expect(isRoutableAction('INVALID_ACTION')).toBe(false)
      expect(isRoutableAction('')).toBe(false)
      expect(isRoutableAction('random_string')).toBe(false)
    })
  })

  describe('AC2: All nextActions are covered', () => {
    it('has a route mapping for every TRIAGE_NEXT_ACTION', () => {
      const allActions = Object.values(TRIAGE_NEXT_ACTION)

      allActions.forEach((action) => {
        const result = createTriageResult(action)
        const route = mapNextActionToRoute(action, result)

        // Route should have a valid path
        expect(route.path).toBeTruthy()
        expect(route.path).toMatch(/^\/patient\//)

        // Route should have a description
        expect(route.description).toBeTruthy()
        expect(typeof route.description).toBe('string')
      })
    })
  })

  describe('AC3: Dashboard-first compliance', () => {
    it('SHOW_CONTENT navigates to dashboard (not external page)', () => {
      const result = createTriageResult(TRIAGE_NEXT_ACTION.SHOW_CONTENT)
      const route = mapNextActionToRoute(TRIAGE_NEXT_ACTION.SHOW_CONTENT, result)

      expect(route.path).toBe('/patient/dashboard')
    })

    it('RESUME_FUNNEL navigates to dashboard (not directly to funnel)', () => {
      const result = createTriageResult(TRIAGE_NEXT_ACTION.RESUME_FUNNEL)
      const route = mapNextActionToRoute(TRIAGE_NEXT_ACTION.RESUME_FUNNEL, result)

      expect(route.path).toBe('/patient/dashboard')
    })

    it('all routes are under /patient/* (patient-facing only)', () => {
      const allActions = Object.values(TRIAGE_NEXT_ACTION)

      allActions.forEach((action) => {
        const result = createTriageResult(action)
        const route = mapNextActionToRoute(action, result)

        expect(route.path).toMatch(/^\/patient\//)
      })
    })
  })
})
