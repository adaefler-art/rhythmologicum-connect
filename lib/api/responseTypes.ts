/**
 * B8: Standardized API Response Types
 * 
 * Ensures consistent response structure across all API endpoints.
 * All API responses follow the pattern:
 * {
 *   success: boolean,
 *   data?: any,
 *   error?: { code: string, message: string },
 *   requestId?: string  // E6.2.8: Correlation ID for observability
 * }
 */

/**
 * Error code enumeration for typed error handling
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  FORBIDDEN = 'FORBIDDEN',
  PILOT_NOT_ELIGIBLE = 'PILOT_NOT_ELIGIBLE',
  
  // Validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  INVALID_INPUT = 'INVALID_INPUT',
  UNSUPPORTED_MEDIA_TYPE = 'UNSUPPORTED_MEDIA_TYPE',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  
  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Business Logic
  STEP_SKIPPING_PREVENTED = 'STEP_SKIPPING_PREVENTED',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  QUESTION_NOT_IN_STEP = 'QUESTION_NOT_IN_STEP',
  STEP_NOT_IN_FUNNEL = 'STEP_NOT_IN_FUNNEL',
  FUNNEL_NOT_SUPPORTED = 'FUNNEL_NOT_SUPPORTED',
  ASSESSMENT_CREATE_CONSTRAINT = 'ASSESSMENT_CREATE_CONSTRAINT',
  
  // State Conflicts (409)
  STATE_CONFLICT = 'STATE_CONFLICT',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  DUPLICATE_OPERATION = 'DUPLICATE_OPERATION',
  
  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  SCHEMA_NOT_READY = 'SCHEMA_NOT_READY',
}

/**
 * Standard error object structure
 */
export type ApiError = {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
}

/**
 * Standard API response structure
 * E6.2.8: Now includes optional requestId for correlation/observability
 */
export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: ApiError
  requestId?: string
}

/**
 * Helper type for success responses with data
 * E6.2.8: Now includes optional requestId for correlation/observability
 */
export type SuccessResponse<T> = {
  success: true
  data: T
  requestId?: string
}

/**
 * Helper type for error responses
 * E6.2.8: Now includes optional requestId for correlation/observability
 */
export type ErrorResponse = {
  success: false
  error: ApiError
  requestId?: string
}
