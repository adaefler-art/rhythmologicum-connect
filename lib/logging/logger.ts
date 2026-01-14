/**
 * B8: Structured Logging Utility
 * 
 * Provides consistent, structured logging across the application.
 * Supports multiple log levels and JSON formatting for better monitoring.
 * 
 * TODO: Integrate with production error tracking service (Sentry recommended)
 * See: docs/MONITORING_INTEGRATION.md for integration guide
 */

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export type LogContext = {
  userId?: string
  assessmentId?: string
  stepId?: string
  questionId?: string
  endpoint?: string
  requestId?: string // E6.2.8: Add correlation ID support
  [key: string]: unknown
}

type LogEntry = {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    message: string
    stack?: string
    name?: string
    [key: string]: unknown
  }
}

/**
 * Core logging function with structured output
 * 
 * TODO: Integrate with Sentry for production error tracking
 * See: docs/MONITORING_INTEGRATION.md
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  }

  if (context) {
    entry.context = context
  }

  if (error) {
    const normalizedError =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : {
            message: typeof error === 'string' ? error : JSON.stringify(error),
          }

    entry.error = normalizedError
  }

  // Output as JSON for structured logging
  const logOutput = JSON.stringify(entry)

  // Route to appropriate console method
  switch (level) {
    case LogLevel.ERROR:
      console.error(logOutput)
      break
    case LogLevel.WARN:
      console.warn(logOutput)
      break
    case LogLevel.INFO:
    default:
      console.log(logOutput)
      break
  }
}

/**
 * Log info-level message
 */
export function logInfo(message: string, context?: LogContext): void {
  log(LogLevel.INFO, message, context)
}

/**
 * Log warning-level message
 */
export function logWarn(message: string, context?: LogContext): void {
  log(LogLevel.WARN, message, context)
}

/**
 * Log error-level message
 */
export function logError(message: string, context?: LogContext, error?: unknown): void {
  log(LogLevel.ERROR, message, context, error)
}

/**
 * Specialized logging functions for common scenarios
 */

export function logUnauthorized(context: LogContext): void {
  logWarn('Unauthorized access attempt', {
    ...context,
    type: 'unauthorized',
  })
}

export function logForbidden(context: LogContext, reason: string): void {
  logWarn(`Forbidden access attempt: ${reason}`, {
    ...context,
    type: 'forbidden',
    reason,
  })
}

export function logStepSkipping(context: LogContext, attemptedStepId: string): void {
  logWarn('Step-skipping attempt detected', {
    ...context,
    type: 'step_skipping',
    attemptedStepId,
  })
}

export function logValidationFailure(
  context: LogContext,
  missingQuestions: Array<{ questionKey: string }>,
): void {
  logInfo('Validation failed', {
    ...context,
    type: 'validation_failure',
    missingCount: missingQuestions.length,
    missingQuestions: missingQuestions.map((q) => q.questionKey),
  })
}

export function logDatabaseError(context: LogContext, error: unknown): void {
  logError('Database error', context, error)
}

export function logApiRequest(endpoint: string, method: string, context?: LogContext): void {
  logInfo(`API Request: ${method} ${endpoint}`, {
    ...context,
    endpoint,
    method,
    type: 'api_request',
  })
}

/**
 * Log assessment lifecycle events
 */

export function logAssessmentStarted(context: LogContext): void {
  logInfo('Assessment started', {
    ...context,
    type: 'assessment_started',
  })
}

export function logAssessmentCompleted(context: LogContext): void {
  logInfo('Assessment completed', {
    ...context,
    type: 'assessment_completed',
  })
}

export function logAssessmentError(context: LogContext, error: unknown): void {
  logError('Assessment error', context, error)
}

/**
 * Log major flow errors for monitoring
 */

export function logClinicianFlowError(context: LogContext, error: unknown): void {
  logError('Clinician flow error', { ...context, area: 'clinician' }, error)
}

export function logPatientFlowError(context: LogContext, error: unknown): void {
  logError('Patient flow error', { ...context, area: 'patient' }, error)
}
