/**
 * E72.ALIGN.P1.DETCON.001: Canonical API Response Contract
 * 
 * This file defines the canonical API response type that all endpoints must use.
 * It provides type-safe helpers for constructing responses and enforces a consistent
 * contract across the entire API surface.
 * 
 * Contract Rule: R-API-003 (formerly misclassified as R-DB-010)
 * All API endpoints MUST return responses conforming to ApiResponse<T>
 */

/**
 * Canonical API response type
 * 
 * Success case: { success: true, data: T }
 * Error case: { success: false, error: { code: string, message: string } }
 * 
 * This is a discriminated union type that provides type-safe response handling.
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

/**
 * Helper function to create a success response
 * 
 * @param data - The data payload to return
 * @returns A success ApiResponse
 * 
 * @example
 * ```typescript
 * return ok({ userId: '123', name: 'John' })
 * // Returns: { success: true, data: { userId: '123', name: 'John' } }
 * ```
 */
export function ok<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  }
}

/**
 * Helper function to create an error response
 * 
 * @param code - Machine-readable error code (e.g., 'VALIDATION_ERROR')
 * @param message - Human-readable error message
 * @returns An error ApiResponse
 * 
 * @example
 * ```typescript
 * return fail('VALIDATION_ERROR', 'Email is required')
 * // Returns: { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email is required' } }
 * ```
 */
export function fail(code: string, message: string): ApiResponse<never> {
  return {
    success: false,
    error: { code, message },
  }
}

/**
 * Type guard to check if a response is successful
 * 
 * @param response - The API response to check
 * @returns True if the response is successful
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/users')
 * const data = await response.json() as ApiResponse<User>
 * 
 * if (isSuccess(data)) {
 *   // TypeScript knows data.data is available
 *   console.log(data.data.name)
 * } else {
 *   // TypeScript knows data.error is available
 *   console.error(data.error.message)
 * }
 * ```
 */
export function isSuccess<T>(response: ApiResponse<T>): response is { success: true; data: T } {
  return response.success === true
}

/**
 * Type guard to check if a response is an error
 * 
 * @param response - The API response to check
 * @returns True if the response is an error
 */
export function isError<T>(
  response: ApiResponse<T>,
): response is { success: false; error: { code: string; message: string } } {
  return response.success === false
}
