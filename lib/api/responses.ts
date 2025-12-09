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
 * Create an error response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: Record<string, any>,
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
  details?: Record<string, any>,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.VALIDATION_FAILED, message, 400, details)
}

export function missingFieldsResponse(
  message = 'Fehlende Pflichtfelder.',
  details?: Record<string, any>,
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCode.MISSING_REQUIRED_FIELDS, message, 400, details)
}

export function invalidInputResponse(
  message: string,
  details?: Record<string, any>,
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
