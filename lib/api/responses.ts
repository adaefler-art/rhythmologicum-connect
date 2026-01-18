import { NextResponse } from 'next/server'
import { ErrorCode, ApiError, SuccessResponse, ErrorResponse } from './responseTypes'

// Re-export ErrorCode for external use
export { ErrorCode } from './responseTypes'

/**
 * B8: Standardized API Response Utilities
 * 
 * Provides helper functions to create consistent API responses
 * across all endpoints.
 */

/**
 * Create a success response with data
 * E6.2.8: Now includes optional requestId for correlation/observability
 * E6.4.8: requestId serves as correlationId for telemetry
 */
export function successResponse<T>(
  data: T,
  status = 200,
  requestId?: string,
): NextResponse<SuccessResponse<T>> {
  const body: SuccessResponse<T> = {
    success: true,
    data,
  }

  if (requestId) {
    body.requestId = requestId
  }

  const response = NextResponse.json(body, { status })
  
  // E6.4.8: Add correlation ID to response headers
  if (requestId) {
    response.headers.set('x-correlation-id', requestId)
  }
  
  return response
}

/**
 * E6.2.3: Create a versioned success response with data and schemaVersion
 * Used for patient-facing endpoints that require iOS compatibility
 * E6.2.8: Now includes optional requestId for correlation/observability
 * E6.4.8: requestId serves as correlationId for telemetry
 */
export function versionedSuccessResponse<T>(
  data: T,
  schemaVersion: string,
  status = 200,
  requestId?: string,
): NextResponse {
  const body: any = {
    success: true,
    data,
    schemaVersion,
  }

  if (requestId) {
    body.requestId = requestId
  }

  const response = NextResponse.json(body, { status })
  
  // E6.4.8: Add correlation ID to response headers
  if (requestId) {
    response.headers.set('x-correlation-id', requestId)
  }
  
  return response
}

/**
 * Create an error response
 * E6.2.8: Now includes optional requestId for correlation/observability
 * E6.4.8: requestId serves as correlationId for telemetry
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>,
  requestId?: string,
): NextResponse<ErrorResponse> {
  const error: ApiError = {
    code,
    message,
  }

  if (details) {
    error.details = details
  }

  const body: ErrorResponse = {
    success: false,
    error,
  }

  if (requestId) {
    body.requestId = requestId
  }

  const response = NextResponse.json(body, { status })
  
  // E6.4.8: Add correlation ID to response headers
  if (requestId) {
    response.headers.set('x-correlation-id', requestId)
  }
  
  return response
}

/**
 * E6.2.3: Create a versioned error response
 * Used for patient-facing endpoints that require iOS compatibility
 * E6.2.8: Now includes optional requestId for correlation/observability
 */
export function versionedErrorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  schemaVersion: string,
  details?: Record<string, unknown>,
  requestId?: string,
): NextResponse {
  const error: ApiError = {
    code,
    message,
  }

  if (details) {
    error.details = details
  }

  const body: any = {
    success: false,
    error,
    schemaVersion,
  }

  if (requestId) {
    body.requestId = requestId
  }

  return NextResponse.json(body, { status })
}

/**
 * Shorthand for common error responses
 * E6.2.8: All functions now accept optional requestId parameter
 */

export function unauthorizedResponse(
  message = 'Authentifizierung fehlgeschlagen. Bitte melden Sie sich an.',
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.UNAUTHORIZED, message, 401, undefined, requestId)
}

export function sessionExpiredResponse(
  message = 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.SESSION_EXPIRED, message, 401, undefined, requestId)
}

export function forbiddenResponse(
  message = 'Sie haben keine Berechtigung für diese Aktion.',
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.FORBIDDEN, message, 403, undefined, requestId)
}

export function pilotNotEligibleResponse(
  message = 'Zugriff auf Pilotfunktionen nicht verfügbar.',
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.PILOT_NOT_ELIGIBLE, message, 403, undefined, requestId)
}

export function notFoundResponse(
  resource: string,
  message?: string,
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(
    ErrorCode.NOT_FOUND,
    message || `${resource} nicht gefunden.`,
    404,
    undefined,
    requestId,
  )
}

export function validationErrorResponse(
  message: string,
  details?: Record<string, unknown>,
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.VALIDATION_FAILED, message, 400, details, requestId)
}

export function missingFieldsResponse(
  message = 'Fehlende Pflichtfelder.',
  details?: Record<string, unknown>,
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.MISSING_REQUIRED_FIELDS, message, 400, details, requestId)
}

export function invalidInputResponse(
  message: string,
  details?: Record<string, unknown>,
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.INVALID_INPUT, message, 400, details, requestId)
}

export function stepSkippingResponse(
  message = 'Sie können nicht zu einem zukünftigen Schritt springen.',
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.STEP_SKIPPING_PREVENTED, message, 403, undefined, requestId)
}

export function assessmentCompletedResponse(
  message = 'Dieses Assessment wurde bereits abgeschlossen und kann nicht mehr bearbeitet werden.',
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.ASSESSMENT_COMPLETED, message, 400, undefined, requestId)
}

export function internalErrorResponse(
  message = 'Ein unerwarteter Fehler ist aufgetreten.',
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.INTERNAL_ERROR, message, 500, undefined, requestId)
}

export function databaseErrorResponse(
  message = 'Datenbankfehler. Bitte versuchen Sie es später erneut.',
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.DATABASE_ERROR, message, 500, undefined, requestId)
}

export function configurationErrorResponse(
  message = 'Server-Konfigurationsfehler.',
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.CONFIGURATION_ERROR, message, 500, undefined, requestId)
}

export function schemaNotReadyResponse(
  message = 'Server-Schema ist noch nicht bereit. Bitte versuchen Sie es später erneut.',
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.SCHEMA_NOT_READY, message, 503, undefined, requestId)
}

export function unsupportedMediaTypeResponse(
  message: string,
  details?: Record<string, unknown>,
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.UNSUPPORTED_MEDIA_TYPE, message, 415, details, requestId)
}

export function payloadTooLargeResponse(
  message: string,
  details?: Record<string, unknown>,
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.PAYLOAD_TOO_LARGE, message, 413, details, requestId)
}

export function stateConflictResponse(
  message: string,
  details?: Record<string, unknown>,
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.STATE_CONFLICT, message, 409, details, requestId)
}

export function versionMismatchResponse(
  message: string,
  details?: Record<string, unknown>,
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.VERSION_MISMATCH, message, 409, details, requestId)
}

export function duplicateOperationResponse(
  message: string,
  details?: Record<string, unknown>,
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.DUPLICATE_OPERATION, message, 409, details, requestId)
}

export function funnelNotSupportedResponse(
  message: string,
  details?: Record<string, unknown>,
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.FUNNEL_NOT_SUPPORTED, message, 409, details, requestId)
}

/**
 * V061-I02: Assessment not completed response (409 STATE_CONFLICT)
 * Used when attempting to access results for an incomplete assessment.
 */
export function assessmentNotCompletedResponse(
  message = 'Dieses Assessment wurde noch nicht abgeschlossen. Bitte schließen Sie das Assessment ab, um die Ergebnisse zu sehen.',
  details?: Record<string, unknown>,
  requestId?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.STATE_CONFLICT, message, 409, details, requestId)
}
