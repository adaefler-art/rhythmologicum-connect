/**
 * PDF Template Registry - V05-I05.8
 * 
 * Central registry for PDF template versions.
 * Used for idempotency checks - template version changes trigger PDF regeneration.
 * 
 * @module lib/pdf/templates
 */

/**
 * PDF Template Version
 * Increment when layout/styling/structure changes
 * Format: vX.Y.Z (semver)
 */
export const PDF_TEMPLATE_VERSION = 'v1.0.0'

/**
 * PDF Generator Algorithm Version
 * Increment when generation logic changes (e.g., new library, different rendering)
 * Format: vX.Y.Z (semver)
 */
export const PDF_GENERATOR_VERSION = 'v1.0.0'

/**
 * Complete PDF version identifier
 * Combines template and generator versions for full traceability
 */
export function getPdfVersionIdentifier(): string {
  return `template:${PDF_TEMPLATE_VERSION}|generator:${PDF_GENERATOR_VERSION}`
}
