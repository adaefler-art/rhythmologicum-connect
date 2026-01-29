/**
 * Canonical feature-flag parsing helpers.
 */
export function flagEnabled(value?: string): boolean {
  if (!value) return false
  const v = value.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

export function flagDisabled(value?: string): boolean {
  return !flagEnabled(value)
}
