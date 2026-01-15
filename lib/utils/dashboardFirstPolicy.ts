/**
 * Dashboard-First Policy Enforcement (E6.5.1)
 * 
 * Ensures patients always land on the dashboard before accessing other routes.
 * Prevents direct deep-linking into funnels, results, or other patient pages.
 * 
 * Policy:
 * - After login/onboarding, users must visit /patient/dashboard first
 * - Direct access to /patient/funnel/*, /patient/funnels, /patient/history, etc.
 *   redirects to dashboard if dashboard hasn't been visited in this session
 * - Dashboard sets a session marker allowing subsequent navigation
 * 
 * @module lib/utils/dashboardFirstPolicy
 */

import { cookies } from 'next/headers'
import { env } from '@/lib/env'

/**
 * Cookie name for tracking dashboard visit
 */
const DASHBOARD_VISITED_COOKIE = 'dashboard_visited'

/**
 * Cookie max age (1 hour - session-like behavior)
 */
const COOKIE_MAX_AGE = 60 * 60 // 1 hour

/**
 * Routes that require dashboard-first entry
 * These routes will redirect to dashboard if not visited yet
 */
const PROTECTED_ROUTES = [
  '/patient/funnel',
  '/patient/funnels',
  '/patient/history',
  '/patient/assessment',
  '/patient/support',
  '/patient/escalation',
  '/patient/documents',
]

/**
 * Routes that are exempt from dashboard-first policy
 * These can be accessed directly
 */
const EXEMPT_ROUTES = [
  '/patient/dashboard',
  '/patient/onboarding',
]

/**
 * Special case: patient root route (redirects to dashboard anyway)
 */
const PATIENT_ROOT = '/patient'

/**
 * Checks if the user has visited the dashboard in this session
 * 
 * @returns Promise<boolean> - true if dashboard has been visited
 */
export async function hasDashboardVisit(): Promise<boolean> {
  const cookieStore = await cookies()
  const visited = cookieStore.get(DASHBOARD_VISITED_COOKIE)
  return visited?.value === 'true'
}

/**
 * Marks the dashboard as visited for this session
 * Sets a cookie that expires after COOKIE_MAX_AGE
 */
export async function markDashboardVisited(): Promise<void> {
  const cookieStore = await cookies()
  const isProduction = env.NODE_ENV === 'production'
  
  cookieStore.set(DASHBOARD_VISITED_COOKIE, 'true', {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: 'lax',
    path: '/patient',
    secure: isProduction,
  })
}

/**
 * Clears the dashboard visit marker
 * Useful for testing or logout scenarios
 */
export async function clearDashboardVisit(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(DASHBOARD_VISITED_COOKIE)
}

/**
 * Checks if a route requires dashboard-first enforcement
 * 
 * @param pathname - The pathname to check (e.g., '/patient/funnels')
 * @returns boolean - true if route requires dashboard-first
 */
export function requiresDashboardFirst(pathname: string): boolean {
  // Special case: patient root is handled by its own redirect logic
  if (pathname === PATIENT_ROOT) {
    return false
  }

  // Check if it's an exempt route (exact match or subdirectory)
  const isExempt = EXEMPT_ROUTES.some((route) => {
    return pathname === route || pathname.startsWith(route + '/')
  })
  
  if (isExempt) {
    return false
  }

  // Check if it's a protected route
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Enforces dashboard-first policy for protected routes
 * 
 * @param pathname - Current pathname
 * @returns Promise<string | null> - Redirect URL if dashboard visit required, null otherwise
 * 
 * @example
 * ```typescript
 * // In a page component
 * const redirectUrl = await enforceDashboardFirst(pathname)
 * if (redirectUrl) {
 *   redirect(redirectUrl)
 * }
 * ```
 */
export async function enforceDashboardFirst(pathname: string): Promise<string | null> {
  // Check if this route requires dashboard-first
  if (!requiresDashboardFirst(pathname)) {
    return null
  }

  // Check if dashboard has been visited
  const hasVisited = await hasDashboardVisit()
  
  if (!hasVisited) {
    // Redirect to dashboard with return URL
    const returnUrl = encodeURIComponent(pathname)
    return `/patient/dashboard?return=${returnUrl}`
  }

  return null
}
