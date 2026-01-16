/**
 * E6.6.5 — Triage Router
 *
 * Maps TriageResultV1.nextAction to concrete navigation routes.
 * This is the "productlogic" that converts triage decisions into user journeys.
 *
 * Key Principles:
 * - AC1: Each nextAction maps to exactly one route (deterministic)
 * - AC2: Router actions are pure functions (testable)
 * - AC3: Navigation always initiated from dashboard
 *
 * @module lib/triage/router
 */

import type { TriageResultV1, TriageNextAction } from '@/lib/api/contracts/triage'
import { TRIAGE_NEXT_ACTION } from '@/lib/api/contracts/triage'

/**
 * Route destination for triage result
 */
export type TriageRoute = {
  /** Target URL to navigate to */
  path: string
  /** Optional query parameters */
  query?: Record<string, string>
  /** Optional state to pass (for highlighting, etc.) */
  state?: Record<string, unknown>
  /** Human-readable description for logging/debugging */
  description: string
}

/**
 * Maps TriageNextAction to a concrete route
 *
 * AC1: Each nextAction has exactly one deterministic mapping
 * AC2: Pure function - same input → same output
 *
 * @param nextAction - The triage decision
 * @param triageResult - Full triage result for context (e.g., rationale, tier)
 * @returns TriageRoute with path, query, state, and description
 */
export function mapNextActionToRoute(
  nextAction: TriageNextAction,
  triageResult: TriageResultV1,
): TriageRoute {
  switch (nextAction) {
    case TRIAGE_NEXT_ACTION.SHOW_CONTENT:
      // Navigate to content tiles section, optionally highlight first tile
      return {
        path: '/patient/dashboard',
        query: {
          scrollTo: 'content',
        },
        state: {
          highlightContent: true,
          triageTier: triageResult.tier,
        },
        description: 'Show content tiles (INFO tier)',
      }

    case TRIAGE_NEXT_ACTION.START_FUNNEL_A:
      // Navigate to stress/resilience funnel
      return {
        path: '/patient/funnel/stress-resilience',
        query: {
          source: 'triage',
        },
        state: {
          triageRationale: triageResult.rationale,
          triageTier: triageResult.tier,
        },
        description: 'Start Stress & Resilience Assessment (Funnel A)',
      }

    case TRIAGE_NEXT_ACTION.START_FUNNEL_B:
      // Navigate to sleep funnel (if implemented)
      return {
        path: '/patient/funnel/sleep',
        query: {
          source: 'triage',
        },
        state: {
          triageRationale: triageResult.rationale,
          triageTier: triageResult.tier,
        },
        description: 'Start Sleep Assessment (Funnel B)',
      }

    case TRIAGE_NEXT_ACTION.RESUME_FUNNEL:
      // Navigate to dashboard with instruction to resume
      // Dashboard will show "Next Step" card with resume CTA
      return {
        path: '/patient/dashboard',
        query: {
          action: 'resume',
        },
        state: {
          triageRationale: triageResult.rationale,
        },
        description: 'Resume existing funnel from dashboard',
      }

    case TRIAGE_NEXT_ACTION.SHOW_ESCALATION:
      // Navigate to escalation/support page
      return {
        path: '/patient/support',
        query: {
          source: 'triage',
          tier: triageResult.tier,
        },
        state: {
          triageRationale: triageResult.rationale,
          redFlags: triageResult.redFlags,
          urgent: true,
        },
        description: 'Show escalation support (ESCALATE tier)',
      }

    default:
      // Fallback to dashboard (should never happen with proper typing)
      console.warn('[TriageRouter] Unknown nextAction, falling back to dashboard', {
        nextAction,
      })
      return {
        path: '/patient/dashboard',
        query: {},
        state: {},
        description: 'Fallback to dashboard (unknown action)',
      }
  }
}

/**
 * Builds a complete URL from a TriageRoute
 *
 * @param route - The route object
 * @returns Full URL string ready for navigation
 *
 * @example
 * const route = mapNextActionToRoute('SHOW_CONTENT', triageResult)
 * const url = buildRouteUrl(route)
 * // → '/patient/dashboard?scrollTo=content'
 */
export function buildRouteUrl(route: TriageRoute): string {
  const { path, query } = route

  if (!query || Object.keys(query).length === 0) {
    return path
  }

  const queryString = new URLSearchParams(query).toString()
  return `${path}?${queryString}`
}

/**
 * Navigate to a route from triage result
 * AC3: Navigation always initiated from dashboard
 *
 * This is a helper that combines mapping + URL building.
 * The actual router.push() call should be done by the caller (AMYComposer).
 *
 * @param nextAction - The triage decision
 * @param triageResult - Full triage result
 * @returns Object with url and state for navigation
 *
 * @example
 * const { url, state } = getNavigationTarget('START_FUNNEL_A', triageResult)
 * router.push(url, { state })
 */
export function getNavigationTarget(
  nextAction: TriageNextAction,
  triageResult: TriageResultV1,
): { url: string; state: Record<string, unknown>; description: string } {
  const route = mapNextActionToRoute(nextAction, triageResult)
  const url = buildRouteUrl(route)

  return {
    url,
    state: route.state || {},
    description: route.description,
  }
}

/**
 * Validates that a nextAction is routable
 *
 * @param nextAction - Action to validate
 * @returns true if action is valid and routable
 */
export function isRoutableAction(nextAction: string): nextAction is TriageNextAction {
  return Object.values(TRIAGE_NEXT_ACTION).includes(nextAction as TriageNextAction)
}
