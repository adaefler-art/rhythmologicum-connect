/**
 * E6.4.8: Correlation ID Utilities
 * 
 * Enhanced correlation ID handling with validation and bounded length.
 * Aligns with E6.2.8 (X-Request-Id) but adds stricter validation.
 */

/**
 * Maximum allowed length for correlation IDs
 */
const MAX_CORRELATION_ID_LENGTH = 64

/**
 * Allowed characters for correlation ID: alphanumeric, hyphens, underscores
 */
const CORRELATION_ID_PATTERN = /^[a-zA-Z0-9_-]+$/

/**
 * Validates a correlation ID format and length
 * 
 * @param correlationId - Correlation ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidCorrelationId(correlationId: string): boolean {
  if (!correlationId || typeof correlationId !== 'string') {
    return false
  }
  
  if (correlationId.length > MAX_CORRELATION_ID_LENGTH) {
    return false
  }
  
  return CORRELATION_ID_PATTERN.test(correlationId)
}

/**
 * Gets or generates a correlation ID from a request
 * 
 * E6.4.8 Guardrails:
 * - Bounded length (max 64 characters)
 * - Only [a-zA-Z0-9-_] allowed
 * - Fail-closed: invalid incoming ID → generate new one (don't fail request)
 * 
 * @param request - Optional Request object to extract existing ID from headers
 * @returns Valid correlation ID (existing or newly generated)
 */
export function getCorrelationId(request?: Request): string {
  if (request) {
    // Try X-Correlation-Id header first (E6.4.8 standard)
    const correlationIdHeader = request.headers.get('x-correlation-id')
    if (correlationIdHeader && isValidCorrelationId(correlationIdHeader)) {
      return correlationIdHeader
    }
    
    // Fallback to X-Request-Id (E6.2.8 compatibility)
    const requestIdHeader = request.headers.get('x-request-id')
    if (requestIdHeader && isValidCorrelationId(requestIdHeader)) {
      return requestIdHeader
    }
  }
  
  // Generate new UUID v4
  return generateCorrelationId()
}

/**
 * Generates a new correlation ID (UUID v4 format)
 * 
 * @returns New correlation ID
 */
export function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Adds correlation ID to response headers
 * 
 * Sets both X-Correlation-Id (E6.4.8) and X-Request-Id (E6.2.8 compat)
 * 
 * @param response - Response to modify
 * @param correlationId - Correlation ID to add
 * @returns Modified response
 */
export function withCorrelationId<T extends Response>(
  response: T,
  correlationId: string,
): T {
  response.headers.set('x-correlation-id', correlationId)
  response.headers.set('x-request-id', correlationId) // E6.2.8 compatibility
  return response
}
