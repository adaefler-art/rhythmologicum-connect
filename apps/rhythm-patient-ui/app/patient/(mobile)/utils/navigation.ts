/**
 * Navigation Utilities - I2.5 Navigation Consistency
 * 
 * Canonical navigation routes and semantics for patient UI.
 * Prevents redirect loops and ensures deterministic navigation behavior.
 * 
 * Design Principles:
 * - All navigation targets are explicit and canonical
 * - No browser history fallbacks (no router.back())
 * - Each screen type has defined back/close behavior
 * - Dialog screens always return to non-dialog screens
 */

// ==========================================
// CANONICAL ROUTES
// ==========================================

/**
 * Canonical patient routes - single source of truth
 */
export const CANONICAL_ROUTES = {
  /** Main hub/home screen */
  DASHBOARD: '/patient/dashboard',
  
  /** Assessment selection/list screen */
  ASSESS: '/patient/assess',
  
  /** Legacy assessments list (v2) */
  ASSESSMENTS_V2: '/patient/assessments-v2',
  
  /** Dialog/chat with AMY */
  DIALOG: '/patient/dialog',
  
  /** User profile and settings */
  PROFILE: '/patient/profile',
  
  /** Results overview */
  RESULTS: '/patient/results-v2',
  
  /** Anamnese Timeline (E75.3) */
  ANAMNESE_TIMELINE: '/patient/anamnese-timeline',
} as const

// ==========================================
// NAVIGATION SEMANTICS
// ==========================================

/**
 * Screen type for navigation semantics
 */
export type ScreenType = 
  | 'dashboard'      // Main hub
  | 'tab'            // Top-level tab screens (assess, dialog, profile)
  | 'assessment-flow' // Active funnel/assessment in progress
  | 'result'         // Assessment result page
  | 'dialog'         // Dialog/chat screen
  | 'content'        // Content detail pages

/**
 * Navigation semantics for each screen type
 * Defines canonical behavior for Back and Close actions
 */
export const NAVIGATION_SEMANTICS = {
  'dashboard': {
    back: null, // Dashboard has no back (it's the root)
    close: null, // Dashboard has no close
  },
  'tab': {
    back: CANONICAL_ROUTES.DASHBOARD, // Tab screens back to dashboard
    close: null, // Tabs don't have close action
  },
  'assessment-flow': {
    back: null, // Back handled within flow (previous question)
    close: CANONICAL_ROUTES.ASSESS, // Close exits to assessments list
  },
  'result': {
    back: CANONICAL_ROUTES.DASHBOARD, // Results back to dashboard
    close: CANONICAL_ROUTES.DASHBOARD, // Results close to dashboard
  },
  'dialog': {
    back: CANONICAL_ROUTES.DASHBOARD, // Dialog back to dashboard (last non-dialog screen)
    close: CANONICAL_ROUTES.DASHBOARD, // Dialog close to dashboard
  },
  'content': {
    back: CANONICAL_ROUTES.DASHBOARD, // Content back to dashboard
    close: CANONICAL_ROUTES.DASHBOARD, // Content close to dashboard
  },
} as const

/**
 * Get canonical back route for a screen type
 * Returns null if back action should be handled by component logic (e.g., within flow)
 */
export function getBackRoute(screenType: ScreenType): string | null {
  return NAVIGATION_SEMANTICS[screenType].back
}

/**
 * Get canonical close route for a screen type
 * Returns null if close action is not applicable
 */
export function getCloseRoute(screenType: ScreenType): string | null {
  return NAVIGATION_SEMANTICS[screenType].close
}

// ==========================================
// ASSESSMENT FLOW NAVIGATION
// ==========================================

/**
 * Get exit route for assessment flow based on mode
 * Ensures deterministic exit behavior
 */
export function getAssessmentFlowExitRoute(mode: 'demo' | 'live' = 'live'): string {
  // Demo mode exits to v2 assessments list
  // Live mode exits to canonical assess route
  return mode === 'demo' ? CANONICAL_ROUTES.ASSESSMENTS_V2 : CANONICAL_ROUTES.ASSESS
}

// ==========================================
// DIALOG NAVIGATION
// ==========================================

/**
 * Get dialog entry URL with context
 */
export function getDialogUrl(context?: {
  source?: 'dashboard' | 'results'
  assessmentId?: string
}): string {
  if (!context) {
    return CANONICAL_ROUTES.DIALOG
  }

  const params = new URLSearchParams()
  
  if (context.source) {
    params.set('context', context.source)
  }
  
  if (context.assessmentId) {
    params.set('assessmentId', context.assessmentId)
  }

  const queryString = params.toString()
  return queryString ? `${CANONICAL_ROUTES.DIALOG}?${queryString}` : CANONICAL_ROUTES.DIALOG
}

/**
 * Get fallback route for dialog back navigation
 * Always returns to dashboard (last non-dialog screen fallback)
 */
export function getDialogBackRoute(): string {
  return CANONICAL_ROUTES.DASHBOARD
}

// ==========================================
// ROUTE VALIDATION
// ==========================================

/**
 * Check if a route is a canonical route
 */
export function isCanonicalRoute(route: string): boolean {
  return Object.values(CANONICAL_ROUTES).includes(route as any)
}

/**
 * Get the nearest canonical route for a path
 * Used to resolve aliases or dynamic routes to their canonical equivalent
 */
export function getNearestCanonicalRoute(path: string): string {
  // Strip query params
  const pathWithoutQuery = path.split('?')[0]
  
  // Exact match
  if (isCanonicalRoute(pathWithoutQuery)) {
    return pathWithoutQuery
  }
  
  // Dashboard routes
  if (pathWithoutQuery.startsWith('/patient/dashboard')) {
    return CANONICAL_ROUTES.DASHBOARD
  }
  
  // Assessment routes
  if (pathWithoutQuery.startsWith('/patient/assess')) {
    // If it's the flow, don't resolve to assess
    if (pathWithoutQuery.includes('/flow')) {
      return pathWithoutQuery
    }
    return CANONICAL_ROUTES.ASSESS
  }
  
  // Dialog routes
  if (pathWithoutQuery.startsWith('/patient/dialog')) {
    return CANONICAL_ROUTES.DIALOG
  }
  
  // Profile routes
  if (pathWithoutQuery.startsWith('/patient/profile')) {
    return CANONICAL_ROUTES.PROFILE
  }
  
  // Results routes
  if (pathWithoutQuery.includes('/result')) {
    return CANONICAL_ROUTES.RESULTS
  }
  
  // Anamnese routes (E75.3)
  if (pathWithoutQuery.startsWith('/patient/anamnese-timeline')) {
    return CANONICAL_ROUTES.ANAMNESE_TIMELINE
  }
  
  // Default fallback to dashboard
  return CANONICAL_ROUTES.DASHBOARD
}
