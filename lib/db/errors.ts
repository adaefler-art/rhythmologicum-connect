/**
 * Database Error Handling Utilities
 * 
 * Provides consistent error classification and handling for Supabase operations.
 * All API routes should use these utilities for uniform error responses.
 * 
 * @module lib/db/errors
 */

/**
 * Error classification types
 */
export type DbErrorKind =
  | 'SCHEMA_NOT_READY'
  | 'AUTH_OR_RLS'
  | 'CONFIGURATION_ERROR'
  | 'TRANSIENT'
  | 'INTERNAL_ERROR'

/**
 * Sanitized error structure
 */
export type SafeDbError = {
  code?: string
  message: string
  hint?: string
}

/**
 * Classified error result
 */
export type ClassifiedError = {
  kind: DbErrorKind
  error: SafeDbError
}

/**
 * Sanitizes a Supabase error to prevent leaking sensitive information
 * 
 * @param error - Raw error from Supabase
 * @returns Sanitized error with safe fields
 */
export function sanitizeSupabaseError(error: unknown): SafeDbError {
  if (!error) {
    return { message: 'Unknown error' }
  }

  if (typeof error === 'string') {
    return { message: error }
  }

  if (typeof error === 'object') {
    const anyErr = error as Record<string, unknown>

    return {
      code: typeof anyErr.code === 'string' ? anyErr.code : undefined,
      message: typeof anyErr.message === 'string' ? anyErr.message : 'Unknown error',
      hint: typeof anyErr.hint === 'string' ? anyErr.hint : undefined,
    }
  }

  return { message: 'Unknown error' }
}

/**
 * Classifies a Supabase error into a known category
 * 
 * This helps determine the appropriate response status code and message.
 * 
 * @param error - Raw error from Supabase
 * @returns Classified error with kind and sanitized error
 * 
 * @example
 * ```typescript
 * const { data, error } = await supabase.from('table').select('*')
 * if (error) {
 *   const classified = classifySupabaseError(error)
 *   if (classified.kind === 'SCHEMA_NOT_READY') {
 *     return schemaNotReadyResponse()
 *   }
 * }
 * ```
 */
export function classifySupabaseError(error: unknown): ClassifiedError {
  const safeError = sanitizeSupabaseError(error)
  const code = safeError.code
  const message = safeError.message.toLowerCase()

  // Schema/table not ready errors
  if (
    code === '42P01' || // undefined_table
    code === '42703' || // undefined_column
    code === 'PGRST205' || // schema cache error
    message.includes('relation') && message.includes('does not exist') ||
    message.includes('column') && message.includes('does not exist') ||
    message.includes('schema cache')
  ) {
    return { kind: 'SCHEMA_NOT_READY', error: safeError }
  }

  // Authentication/RLS errors
  if (
    code === '42501' || // insufficient_privilege
    code === 'PGRST116' || // jwt_invalid
    code === 'PGRST301' || // row_level_security
    code === 'PGRST302' || // insufficient_permission
    message.includes('permission denied') ||
    message.includes('jwt') ||
    message.includes('rls') ||
    message.includes('not authorized') ||
    message.includes('insufficient') && message.includes('privilege')
  ) {
    return { kind: 'AUTH_OR_RLS', error: safeError }
  }

  // Transient errors (connection, timeout, etc.)
  if (
    code === '08000' || // connection_exception
    code === '08003' || // connection_does_not_exist
    code === '08006' || // connection_failure
    code === '57P01' || // admin_shutdown
    message.includes('timeout') ||
    message.includes('connection') && message.includes('fail') ||
    message.includes('network')
  ) {
    return { kind: 'TRANSIENT', error: safeError }
  }

  // Configuration errors
  if (
    message.includes('configuration') ||
    message.includes('not configured') ||
    message.includes('missing') && (message.includes('url') || message.includes('key'))
  ) {
    return { kind: 'CONFIGURATION_ERROR', error: safeError }
  }

  // Default to internal error
  return { kind: 'INTERNAL_ERROR', error: safeError }
}

/**
 * Generates a unique request ID
 * 
 * @param request - Optional Request object to extract existing ID from headers
 * @returns Request ID (existing or newly generated)
 */
export function getRequestId(request?: Request): string {
  if (request) {
    const headerId = request.headers.get('x-request-id')
    if (headerId && headerId.trim().length > 0) {
      return headerId
    }
  }

  // Generate new ID
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Adds request ID to a Response object
 * 
 * @param response - Response to add header to
 * @param requestId - Request ID to add
 * @returns Response with x-request-id header
 */
export function withRequestId<T extends Response>(response: T, requestId: string): T {
  response.headers.set('x-request-id', requestId)
  return response
}

/**
 * Checks if a value is blank (null, undefined, or empty string)
 * 
 * @param value - Value to check
 * @returns true if value is blank
 */
export function isBlank(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0)
  )
}

/**
 * Logs an error with context
 * 
 * @param context - Context object with relevant information
 */
export function logError(context: {
  requestId?: string
  operation?: string
  error: unknown
  userId?: string
  [key: string]: unknown
}): void {
  const safeError = sanitizeSupabaseError(context.error)
  const classified = classifySupabaseError(context.error)

  console.error('[DB_ERROR]', {
    ...context,
    error: safeError,
    errorKind: classified.kind,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Logs a warning with context
 * 
 * @param context - Context object with relevant information
 */
export function logWarning(context: {
  requestId?: string
  operation?: string
  message: string
  [key: string]: unknown
}): void {
  console.warn('[DB_WARNING]', {
    ...context,
    timestamp: new Date().toISOString(),
  })
}
