/** @jest-environment node */

import { CURRENT_CONSENT_VERSION } from '@/lib/contracts/onboarding'
import { getOnboardingStatus, recordConsent } from '../onboarding'

jest.mock('@/lib/db/supabase.server', () => {
  return {
    createServerSupabaseClient: jest.fn(),
  }
})

jest.mock('@/lib/audit', () => {
  return {
    logAuditEvent: jest.fn(async () => undefined),
  }
})

jest.mock('@/lib/env', () => {
  return {
    env: {
      NODE_ENV: 'test',
    },
  }
})

type TrackedOrderCall = { column: string; ascending: boolean }

function createTrackedQueryResult<T>(result: { data: T; error: any }) {
  const calls: TrackedOrderCall[] = []

  const builder = {
    select: () => builder,
    eq: () => builder,
    order: (column: string, opts: { ascending: boolean }) => {
      calls.push({ column, ascending: opts.ascending })
      return builder
    },
    limit: async () => result,
  }

  return { builder, calls }
}

describe('lib/actions/onboarding', () => {
  it('getOnboardingStatus orders newest-first for consent and profile', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    const consent = createTrackedQueryResult({ data: [{ id: 'c1' }], error: null })
    const profile = createTrackedQueryResult({
      data: [{ id: 'p1', full_name: 'Jane Doe' }],
      error: null,
    })

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: (table: string) => {
        if (table === 'user_consents') return consent.builder
        if (table === 'patient_profiles') return profile.builder
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const res = await getOnboardingStatus()
    expect(res.success).toBe(true)
    expect(res.data).toEqual({ hasConsent: true, hasProfile: true, isComplete: true })

    expect(consent.calls).toEqual([{ column: 'consented_at', ascending: false }])
    expect(profile.calls).toEqual([{ column: 'created_at', ascending: false }])
  })

  it('recordConsent is idempotent under unique-violation race', async () => {
    const { createServerSupabaseClient } = require('@/lib/db/supabase.server') as {
      createServerSupabaseClient: jest.Mock
    }

    const existingConsent = {
      id: 'c_existing',
      user_id: 'u1',
      consent_version: CURRENT_CONSENT_VERSION,
      consented_at: '2026-01-01T00:00:00Z',
    }

    const mockInsert = jest.fn(() => ({
      select: () => ({
        single: async () => ({ data: null, error: { code: '23505' } }),
      }),
    }))

    const mockSelectExisting = jest.fn(() => ({
      eq: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data: [existingConsent], error: null }),
          }),
        }),
      }),
    }))

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
      },
      from: (table: string) => {
        if (table !== 'user_consents') throw new Error(`Unexpected table: ${table}`)
        return {
          select: mockSelectExisting,
          insert: mockInsert,
        }
      },
    })

    const res = await recordConsent({ consentVersion: CURRENT_CONSENT_VERSION, agreedToTerms: true })
    expect(res.success).toBe(true)
    expect(res.data?.id).toBe('c_existing')
  })
})
