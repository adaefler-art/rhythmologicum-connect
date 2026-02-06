import { describe, it, expect } from '@jest/globals'
import { resolvePatientDisplayName } from '@/lib/utils/patientDisplayName'

describe('resolvePatientDisplayName', () => {
  it('uses full_name when available', () => {
    const result = resolvePatientDisplayName({
      id: '9e0b2d6c-1234-5678-9abc-def012345678',
      full_name: 'Ada Lovelace',
      email: 'ada@example.com',
    })

    expect(result.displayName).toBe('Ada Lovelace')
    expect(result.isFallback).toBe(false)
  })

  it('skips full_name when it looks like an email', () => {
    const result = resolvePatientDisplayName({
      id: '9e0b2d6c-1234-5678-9abc-def012345678',
      full_name: 'ada@example.com',
    })

    expect(result.displayName).toBe('Patient:in 9e0b2d6c')
    expect(result.isFallback).toBe(true)
  })

  it('uses first and last name when full_name is missing', () => {
    const result = resolvePatientDisplayName({
      id: '9e0b2d6c-1234-5678-9abc-def012345678',
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com',
    })

    expect(result.displayName).toBe('Ada Lovelace')
    expect(result.isFallback).toBe(false)
  })

  it('falls back to short id when no name is present', () => {
    const result = resolvePatientDisplayName({
      id: '9e0b2d6c-1234-5678-9abc-def012345678',
      email: 'ada@example.com',
    })

    expect(result.displayName).toBe('Patient:in 9e0b2d6c')
    expect(result.secondaryLabel).toBe('ID: 9e0b2d6c')
    expect(result.isFallback).toBe(true)
  })

  it('uses display_label when no name is present', () => {
    const result = resolvePatientDisplayName({
      id: '9e0b2d6c-1234-5678-9abc-def012345678',
      display_label: 'Patientin A',
    })

    expect(result.displayName).toBe('Patientin A')
    expect(result.isFallback).toBe(false)
  })

  it('skips display_label when it looks like an email', () => {
    const result = resolvePatientDisplayName({
      id: '9e0b2d6c-1234-5678-9abc-def012345678',
      display_label: 'ada@example.com',
    })

    expect(result.displayName).toBe('Patient:in 9e0b2d6c')
    expect(result.isFallback).toBe(true)
  })

  it('never uses email as displayName', () => {
    const result = resolvePatientDisplayName({
      id: '9e0b2d6c-1234-5678-9abc-def012345678',
      email: 'ada@example.com',
    })

    expect(result.displayName).not.toBe('ada@example.com')
  })
})
