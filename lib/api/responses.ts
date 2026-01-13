import { NextResponse } from 'next/server'
import { ErrorCode, ApiError, SuccessResponse, ErrorResponse } from './responseTypes'

/**
 * B8: Standardized API Response Utilities
 * 
 * Provides helper functions to create consistent API responses
 * across all endpoints.
 */

/**
 * Create a success response with data
 */
export function successResponse<T>(data: T, status = 200): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status },
  )
}

/**
 * E6.2.3: Create a versioned success response with data and schemaVersion
 * Used for patient-facing endpoints that require iOS compatibility
 */
export function versionedSuccessResponse<T>(
  data: T,
  schemaVersion: string,
  status = 200,
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      schemaVersion,
    },
    { status },
  )
}

/**
 * Create an error response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>,
): NextResponse<ErrorResponse> {
  const error: ApiError = {
    code,
    message,
  }

  if (details) {
    error.details = details
  }

  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status },
  )
}

/**
 * E6.2.3: Create a versioned error response
 * Used for patient-facing endpoints that require iOS compatibility
 */
export function versionedErrorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  schemaVersion: string,
  details?: Record<string, unknown>,
): NextResponse {
  const error: ApiError = {
    code,
    message,
  }

  if (details) {
    error.details = details
  }

  return NextResponse.json(
    {
      success: false,
      error,
      schemaVersion,
    },
    { status },
  )
}

/**
 * Shorthand for common error responses
 */

export function unauthorizedResponse(
  message = 'Authentifizierung fehlgeschlagen. Bitte melden Sie sich an.',
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.UNAUTHORIZED, message, 401)
}

export function forbiddenResponse(
  message = 'Sie haben keine Berechtigung für diese Aktion.',
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.FORBIDDEN, message, 403)
}

export function notFoundResponse(
  resource: string,
  message?: string,
): NextResponse<ErrorResponse> {
  return errorResponse(
    ErrorCode.NOT_FOUND,
    message || `${resource} nicht gefunden.`,
    404,
  )
}

export function validationErrorResponse(
  message: string,
  details?: Record<string, unknown>,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.VALIDATION_FAILED, message, 400, details)
}

export function missingFieldsResponse(
  message = 'Fehlende Pflichtfelder.',
  details?: Record<string, unknown>,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.MISSING_REQUIRED_FIELDS, message, 400, details)
}

export function invalidInputResponse(
  message: string,
  details?: Record<string, unknown>,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.INVALID_INPUT, message, 400, details)
}

export function stepSkippingResponse(
  message = 'Sie können nicht zu einem zukünftigen Schritt springen.',
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.STEP_SKIPPING_PREVENTED, message, 403)
}

export function assessmentCompletedResponse(
  message = 'Dieses Assessment wurde bereits abgeschlossen und kann nicht mehr bearbeitet werden.',
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.ASSESSMENT_COMPLETED, message, 400)
}

export function internalErrorResponse(
  message = 'Ein unerwarteter Fehler ist aufgetreten.',
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.INTERNAL_ERROR, message, 500)
}

export function databaseErrorResponse(
  message = 'Datenbankfehler. Bitte versuchen Sie es später erneut.',
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.DATABASE_ERROR, message, 500)
}

export function configurationErrorResponse(
  message = 'Server-Konfigurationsfehler.',
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.CONFIGURATION_ERROR, message, 500)
}

export function schemaNotReadyResponse(
  message = 'Server-Schema ist noch nicht bereit. Bitte versuchen Sie es später erneut.',
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.SCHEMA_NOT_READY, message, 503)
}

export function unsupportedMediaTypeResponse(
  message: string,
  details?: Record<string, unknown>,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.UNSUPPORTED_MEDIA_TYPE, message, 415, details)
}

export function payloadTooLargeResponse(
  message: string,
  details?: Record<string, unknown>,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.PAYLOAD_TOO_LARGE, message, 413, details)
}

export function stateConflictResponse(
  message: string,
  details?: Record<string, unknown>,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.STATE_CONFLICT, message, 409, details)
}

export function versionMismatchResponse(
  message: string,
  details?: Record<string, unknown>,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.VERSION_MISMATCH, message, 409, details)
}

export function duplicateOperationResponse(
  message: string,
  details?: Record<string, unknown>,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.DUPLICATE_OPERATION, message, 409, details)
}
