/**
 * UUID Validation Utilities
 * 
 * Provides consistent UUID validation across the application.
 */

/**
 * Regular expression for validating UUIDs (RFC 4122 compliant)
 * Matches UUIDs in the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * where x is a hexadecimal digit (0-9, a-f, A-F)
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Validates if a string is a valid UUID
 * 
 * @param value - The string to validate
 * @returns true if the string is a valid UUID, false otherwise
 * 
 * @example
 * ```typescript
 * isValidUUID('123e4567-e89b-12d3-a456-426614174000') // true
 * isValidUUID('invalid-uuid') // false
 * isValidUUID('') // false
 * isValidUUID(null) // false
 * ```
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }
  return UUID_REGEX.test(value)
}

/**
 * Validates a UUID and throws an error if invalid
 * 
 * @param value - The value to validate
 * @param paramName - The parameter name to include in error message (default: 'UUID')
 * @throws Error if the value is not a valid UUID
 * 
 * @example
 * ```typescript
 * validateUUID(patientId, 'patient_id') // throws if invalid
 * ```
 */
export function validateUUID(value: unknown, paramName: string = 'UUID'): asserts value is string {
  if (!isValidUUID(value)) {
    throw new Error(`${paramName} must be a valid UUID`)
  }
}
