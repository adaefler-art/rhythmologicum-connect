/**
 * Unit tests for funnelHelpers utilities
 */

import { NODE_TYPE } from '../contracts/registry'

let normalizeStepType: (raw: string) => string

beforeAll(async () => {
  jest.resetModules()

  jest.doMock('../supabaseClient', () => {
    const subscription = { unsubscribe: () => undefined }

    const error = new Error('stubbed supabase client')
    const auth = {
      getUser: async () => ({ data: { user: null }, error }),
      getSession: async () => ({ data: { session: null }, error }),
      onAuthStateChange: () => ({ data: { subscription }, error }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error }),
      signUp: async () => ({ data: { user: null, session: null }, error }),
      signOut: async () => ({ error }),
    }

    type QueryResult = { data: null; error: Error }
    type QueryBuilder = {
      select: () => Promise<QueryResult>
      insert: () => Promise<QueryResult>
      update: () => Promise<QueryResult>
      upsert: () => Promise<QueryResult>
      delete: () => Promise<QueryResult>
      eq: () => QueryBuilder
      in: () => QueryBuilder
      order: () => QueryBuilder
      limit: () => QueryBuilder
      single: () => Promise<QueryResult>
      maybeSingle: () => Promise<QueryResult>
    }

    const queryResult = async (): Promise<QueryResult> => ({ data: null, error })

    const createQueryBuilder = (): QueryBuilder => {
      let builder: QueryBuilder
      builder = {
        select: async () => queryResult(),
        insert: async () => queryResult(),
        update: async () => queryResult(),
        upsert: async () => queryResult(),
        delete: async () => queryResult(),
        eq: () => builder,
        in: () => builder,
        order: () => builder,
        limit: () => builder,
        single: async () => queryResult(),
        maybeSingle: async () => queryResult(),
      }
      return builder
    }

    const from = () => createQueryBuilder()
    return { supabase: { auth, from } }
  })

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
