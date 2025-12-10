/**
 * B8: Standardized API Response Types
 * 
 * Ensures consistent response structure across all API endpoints.
 * All API responses follow the pattern:
 * {
 *   success: boolean,
 *   data?: any,
 *   error?: { code: string, message: string }
 * }
 */

/**
 * Error code enumeration for typed error handling
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Business Logic
  STEP_SKIPPING_PREVENTED = 'STEP_SKIPPING_PREVENTED',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  QUESTION_NOT_IN_STEP = 'QUESTION_NOT_IN_STEP',
  STEP_NOT_IN_FUNNEL = 'STEP_NOT_IN_FUNNEL',
  
  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
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
 */
export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: ApiError
}

/**
 * Helper type for success responses with data
 */
export type SuccessResponse<T> = {
  success: true
  data: T
}

/**
 * Helper type for error responses
 */
export type ErrorResponse = {
  success: false
  error: ApiError
}
