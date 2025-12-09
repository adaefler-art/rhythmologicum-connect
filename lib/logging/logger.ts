/**
 * B8: Structured Logging Utility
 * 
 * Provides consistent, structured logging across the application.
 * Supports multiple log levels and JSON formatting for better monitoring.
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
  [key: string]: any
}

type LogEntry = {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: any
}

/**
 * Core logging function with structured output
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: any): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  }

  if (context) {
    entry.context = context
  }

  if (error) {
    entry.error = {
      message: error.message,
      stack: error.stack,
      ...error,
    }
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
export function logError(message: string, context?: LogContext, error?: any): void {
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

export function logDatabaseError(context: LogContext, error: any): void {
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
