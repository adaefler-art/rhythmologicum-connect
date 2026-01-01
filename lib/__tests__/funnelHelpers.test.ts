/**
 * Unit tests for funnelHelpers utilities
 */

import { NODE_TYPE } from '../contracts/registry'

let normalizeStepType: (raw: string) => string

beforeAll(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

  const mod = await import('../funnelHelpers')
  normalizeStepType = mod.normalizeStepType
})

describe('normalizeStepType', () => {
  it('normalizes trim + lowercase', () => {
    expect(normalizeStepType('  INFO_STEP  ')).toBe(NODE_TYPE.INFO_STEP)
  })

  it('normalizes hyphenated aliases to underscore form', () => {
    expect(normalizeStepType('info-step')).toBe(NODE_TYPE.INFO_STEP)
    expect(normalizeStepType('question-step')).toBe(NODE_TYPE.QUESTION_STEP)
    expect(normalizeStepType('content-page')).toBe(NODE_TYPE.CONTENT_PAGE)
  })

  it('rejects unknown step types', () => {
    expect(() => normalizeStepType('definitely-not-a-real-step')).toThrow('Invalid step type')
  })
})
