/**
 * V05-I07.2: Helper Function Tests
 * 
 * Tests for mapSupabaseErrorToEvidenceCode helper
 */

import { describe, it, expect } from '@jest/globals'

/**
 * Inline copy of helper for testing (extracted from page.tsx)
 */
function mapSupabaseErrorToEvidenceCode(error: unknown, source: string): string {
  if (!error) return `E_UNKNOWN_${source}`
  
  const err = error as { code?: string; message?: string; details?: string }
  
  // PostgreSQL error codes
  if (err.code === '42P01') return `E_SCHEMA_${source}` // undefined_table
  if (err.code === '42703') return `E_SCHEMA_${source}` // undefined_column
  if (err.code?.startsWith('42')) return `E_SCHEMA_${source}` // syntax/schema errors
  if (err.code === 'PGRST301') return `E_RLS_${source}` // RLS policy violation
  if (err.code?.startsWith('PGRST3')) return `E_RLS_${source}` // RLS/auth errors
  
  // Generic query error
  return `E_QUERY_${source}`
}

describe('mapSupabaseErrorToEvidenceCode', () => {
  it('returns E_SCHEMA_* for undefined table error (42P01)', () => {
    const error = { code: '42P01', message: 'relation does not exist' }
    expect(mapSupabaseErrorToEvidenceCode(error, 'LABS')).toBe('E_SCHEMA_LABS')
  })

  it('returns E_SCHEMA_* for undefined column error (42703)', () => {
    const error = { code: '42703', message: 'column does not exist' }
    expect(mapSupabaseErrorToEvidenceCode(error, 'DOCS')).toBe('E_SCHEMA_DOCS')
  })

  it('returns E_SCHEMA_* for any 42xxx PostgreSQL error', () => {
    const error = { code: '42804', message: 'datatype mismatch' }
    expect(mapSupabaseErrorToEvidenceCode(error, 'SAFETY')).toBe('E_SCHEMA_SAFETY')
  })

  it('returns E_RLS_* for RLS policy violation (PGRST301)', () => {
    const error = { code: 'PGRST301', message: 'permission denied' }
    expect(mapSupabaseErrorToEvidenceCode(error, 'INTERVENTIONS')).toBe('E_RLS_INTERVENTIONS')
  })

  it('returns E_RLS_* for any PGRST3xx error', () => {
    const error = { code: 'PGRST302', message: 'auth error' }
    expect(mapSupabaseErrorToEvidenceCode(error, 'SCORES')).toBe('E_RLS_SCORES')
  })

  it('returns E_QUERY_* for generic errors', () => {
    const error = { code: 'PGRST000', message: 'generic error' }
    expect(mapSupabaseErrorToEvidenceCode(error, 'LABS')).toBe('E_QUERY_LABS')
  })

  it('returns E_QUERY_* for errors without code', () => {
    const error = { message: 'unknown error' }
    expect(mapSupabaseErrorToEvidenceCode(error, 'MEDS')).toBe('E_QUERY_MEDS')
  })

  it('returns E_UNKNOWN_* for null/undefined error', () => {
    expect(mapSupabaseErrorToEvidenceCode(null, 'LABS')).toBe('E_UNKNOWN_LABS')
    expect(mapSupabaseErrorToEvidenceCode(undefined, 'DOCS')).toBe('E_UNKNOWN_DOCS')
  })

  it('includes source identifier in all evidence codes', () => {
    const error = { code: '42P01' }
    expect(mapSupabaseErrorToEvidenceCode(error, 'CUSTOM_SOURCE')).toBe('E_SCHEMA_CUSTOM_SOURCE')
  })

  it('is case-sensitive for error codes', () => {
    const error = { code: 'PGRST301' }
    expect(mapSupabaseErrorToEvidenceCode(error, 'TEST')).toBe('E_RLS_TEST')
  })
})
