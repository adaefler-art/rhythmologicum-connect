/**
 * Client-side Event Logging
 * 
 * Part of V0.4-E6 Technical Cleanup & Stability Layer
 * 
 * Provides structured logging for key user actions and events on the client side.
 * This helps track user behavior, identify issues, and improve the user experience.
 * 
 * In production, these logs can be sent to a monitoring service (e.g., LogRocket, Sentry).
 * For now, they output to the console with structured formatting.
 */

export enum ClientEventType {
  // Assessment lifecycle events
  ASSESSMENT_STARTED = 'assessment_started',
  ASSESSMENT_RESUMED = 'assessment_resumed',
  ASSESSMENT_COMPLETED = 'assessment_completed',
  
  // Navigation events
  STEP_NAVIGATED = 'step_navigated',
  STEP_VALIDATED = 'step_validated',
  
  // Answer events
  ANSWER_SAVED = 'answer_saved',
  ANSWER_CHANGED = 'answer_changed',
  
  // UI events
  PAGE_VIEW = 'page_view',
  ERROR_DISPLAYED = 'error_displayed',
  LOADING_STARTED = 'loading_started',
  LOADING_COMPLETED = 'loading_completed',
  
  // User actions
  BUTTON_CLICKED = 'button_clicked',
  LINK_CLICKED = 'link_clicked',
  FORM_SUBMITTED = 'form_submitted',
  
  // Content events
  CONTENT_PAGE_VIEWED = 'content_page_viewed',
  
  // Export events
  DATA_EXPORTED = 'data_exported',
}

export type ClientEventContext = {
  // Assessment context
  assessmentId?: string
  funnelSlug?: string
  stepId?: string
  questionId?: string
  
  // Navigation context
  currentPath?: string
  previousPath?: string
  
  // User context
  userId?: string
  userRole?: string
  
  // Additional metadata
  [key: string]: unknown
}

type ClientLogEntry = {
  timestamp: string
  eventType: ClientEventType
  context: ClientEventContext
  message?: string
}

/**
 * Log a client-side event
 * 
 * @param eventType - Type of event to log
 * @param context - Event context with additional metadata
 * @param message - Optional human-readable message
 */
export function logClientEvent(
  eventType: ClientEventType,
  context: ClientEventContext,
  message?: string
): void {
  const entry: ClientLogEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    context: {
      ...context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      screenSize: typeof window !== 'undefined' 
        ? `${window.innerWidth}x${window.innerHeight}` 
        : 'unknown',
    },
    message,
  }

  // Output to console with structured formatting
  const logOutput = JSON.stringify(entry, null, 2)
  console.log(`[CLIENT EVENT] ${eventType}`, logOutput)

  // TODO: Send to monitoring service in production
  // Example:
  // if (process.env.NODE_ENV === 'production') {
  //   sendToMonitoringService(entry)
  // }
}

/**
 * Specialized logging functions for common events
 */

export function logAssessmentStarted(assessmentId: string, funnelSlug: string): void {
  logClientEvent(
    ClientEventType.ASSESSMENT_STARTED,
    { assessmentId, funnelSlug },
    `Assessment started: ${funnelSlug}`
  )
}

export function logAssessmentResumed(
  assessmentId: string,
  funnelSlug: string,
  answeredCount: number
): void {
  logClientEvent(
    ClientEventType.ASSESSMENT_RESUMED,
    { assessmentId, funnelSlug, answeredCount },
    `Assessment resumed with ${answeredCount} existing answers`
  )
}

export function logAssessmentCompleted(assessmentId: string, funnelSlug: string): void {
  logClientEvent(
    ClientEventType.ASSESSMENT_COMPLETED,
    { assessmentId, funnelSlug },
    `Assessment completed: ${funnelSlug}`
  )
}

export function logStepNavigated(
  assessmentId: string,
  stepId: string,
  direction: 'next' | 'previous'
): void {
  logClientEvent(
    ClientEventType.STEP_NAVIGATED,
    { assessmentId, stepId, direction },
    `Navigated ${direction} to step ${stepId}`
  )
}

export function logValidationError(
  assessmentId: string,
  stepId: string,
  missingCount: number
): void {
  logClientEvent(
    ClientEventType.STEP_VALIDATED,
    { assessmentId, stepId, missingCount, valid: false },
    `Validation failed: ${missingCount} missing answers`
  )
}

export function logAnswerSaved(
  assessmentId: string,
  questionId: string,
  answerValue: number | string
): void {
  logClientEvent(
    ClientEventType.ANSWER_SAVED,
    { assessmentId, questionId, answerValue },
    `Answer saved for question ${questionId}`
  )
}

export function logPageView(path: string, context?: ClientEventContext): void {
  logClientEvent(
    ClientEventType.PAGE_VIEW,
    { currentPath: path, ...context },
    `Page viewed: ${path}`
  )
}

export function logErrorDisplayed(
  errorMessage: string,
  area: string,
  context?: ClientEventContext
): void {
  logClientEvent(
    ClientEventType.ERROR_DISPLAYED,
    { area, errorMessage, ...context },
    `Error displayed in ${area}: ${errorMessage}`
  )
}

export function logLoadingState(
  isLoading: boolean,
  area: string,
  context?: ClientEventContext
): void {
  const eventType = isLoading 
    ? ClientEventType.LOADING_STARTED 
    : ClientEventType.LOADING_COMPLETED
    
  logClientEvent(
    eventType,
    { area, ...context },
    `Loading ${isLoading ? 'started' : 'completed'} in ${area}`
  )
}

/**
 * Helper to track button/link clicks with context
 */
export function logUserAction(
  action: 'button_click' | 'link_click' | 'form_submit',
  label: string,
  context?: ClientEventContext
): void {
  const eventTypeMap = {
    'button_click': ClientEventType.BUTTON_CLICKED,
    'link_click': ClientEventType.LINK_CLICKED,
    'form_submit': ClientEventType.FORM_SUBMITTED,
  }
  
  logClientEvent(
    eventTypeMap[action],
    { label, ...context },
    `User action: ${action} - ${label}`
  )
}

/**
 * Placeholder for future monitoring service integration
 * 
 * TODO: Implement actual event collection when ready.
 * This can send events to:
 * - LogRocket (Recommended for session recording)
 * - Sentry (For error tracking with session replay)
 * - PostHog (For product analytics)
 * - Custom analytics endpoint
 * 
 * See: docs/MONITORING_INTEGRATION.md for detailed integration guide
 * 
 * Example implementation with LogRocket:
 * 
 * import LogRocket from 'logrocket'
 * 
 * if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_LOGROCKET_ID) {
 *   LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_ID)
 * }
 * 
 * async function sendToMonitoringService(entry: ClientLogEntry): Promise<void> {
 *   if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
 *     LogRocket.track(entry.eventType, entry.context)
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function sendToMonitoringService(entry: ClientLogEntry): Promise<void> {
  // Future implementation
  // await fetch('/api/analytics/events', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(entry),
  // })
}
