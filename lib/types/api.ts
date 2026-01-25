/**
 * E72.ALIGN.P1.DETCON.001: Canonical API Response Contract
 * 
 * This file provides stricter, type-safe helpers for constructing API responses.
 * It complements the existing `lib/api/responseTypes.ts` and `lib/api/responses.ts`
 * with discriminated union types for improved type safety.
 * 
 * Contract Rule: R-API-003 (formerly misclassified as R-DB-010)
 * All API endpoints SHOULD use these helpers or the existing response utilities.
 * 
 * Note: This is compatible with existing ApiResponse type in lib/api/responseTypes.ts
 * but provides stricter type checking through discriminated unions.
 */

import { ErrorCode } from '@/lib/api/responseTypes'

/**
 * Stricter API response type using discriminated unions
 * 
 * Success case: { success: true, data: T }
 * Error case: { success: false, error: { code: ErrorCode, message: string } }
 * 
 * This is a stricter subset of the existing ApiResponse type that:
 * - Makes the discriminator (success) non-nullable
 * - Ensures data XOR error (not both)
 * - Provides better type inference in conditional branches
 * 
 * Compatible with existing lib/api/responseTypes.ts ApiResponse<T>
 */
export type StrictApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: ErrorCode; message: string } }

/**
 * Helper function to create a success response
 * 
 * @param data - The data payload to return
 * @returns A success response conforming to StrictApiResponse
 * 
 * @example
 * ```typescript
 * return NextResponse.json(ok({ userId: '123', name: 'John' }))
 * // Returns: { success: true, data: { userId: '123', name: 'John' } }
 * ```
 */
export function ok<T>(data: T): StrictApiResponse<T> {
  return {
    success: true,
    data,
  }
}

/**
 * Helper function to create an error response
 * 
 * @param code - Machine-readable error code from ErrorCode enum
 * @param message - Human-readable error message
 * @returns An error response conforming to StrictApiResponse
 * 
 * @example
 * ```typescript
 * import { ErrorCode } from '@/lib/api/responseTypes'
 * 
 * return NextResponse.json(
 *   fail(ErrorCode.VALIDATION_FAILED, 'Email is required'),
 *   { status: 400 }
 * )
 * // Returns: { success: false, error: { code: 'VALIDATION_FAILED', message: '...' } }
 * ```
 */
export function fail(code: ErrorCode, message: string): StrictApiResponse<never> {
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
 * const data = await response.json() as StrictApiResponse<User>
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
export function isSuccess<T>(response: StrictApiResponse<T>): response is { success: true; data: T } {
  return response.success === true
}

/**
 * Type guard to check if a response is an error
 * 
 * @param response - The API response to check
 * @returns True if the response is an error
 */
export function isError<T>(
  response: StrictApiResponse<T>,
): response is { success: false; error: { code: ErrorCode; message: string } } {
  return response.success === false
}

// Re-export ErrorCode for convenience
export { ErrorCode } from '@/lib/api/responseTypes'
