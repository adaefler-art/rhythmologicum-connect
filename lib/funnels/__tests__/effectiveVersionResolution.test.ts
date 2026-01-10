/**
 * Tests for deterministic effective funnel version resolution
 * - Primary: funnels_catalog.default_version_id
 * - Optional override: patient_funnels.active_version_id (when authenticated patient + patient_profile exists)
 *
 * Also acts as a regression guard to ensure no code path queries funnel_version_pins.
 */

import { loadFunnelVersionWithClient } from '../loadFunnelVersion'

type QueryResult<T> = Promise<{ data: T | null; error: any }>

function makeSingleBuilder<T>(result: { data: T | null; error: any }) {
  const builder: any = {}
  builder.select = jest.fn(() => builder)
  builder.eq = jest.fn(() => builder)
  builder.single = jest.fn((): QueryResult<T> => Promise.resolve(result))
  return builder
}

function makeMaybeSingleBuilder<T>(result: { data: T | null; error: any }) {
  const builder: any = {}
  builder.select = jest.fn(() => builder)
  builder.eq = jest.fn(() => builder)
  builder.order = jest.fn(() => builder)
  builder.limit = jest.fn(() => builder)
  builder.maybeSingle = jest.fn((): QueryResult<T> => Promise.resolve(result))
  return builder
}

describe('loadFunnelVersionWithClient - effective version resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses patient_funnels.active_version_id when available', async () => {
    const funnelRow = {
      id: 'funnel-1',
      slug: 'stress-assessment',
      title: 'Stress',
      pillar_id: null,
      description: null,
      is_active: true,
      default_version_id: 'version-default',
    }

    const versionActiveRow = {
      id: 'version-active',
      funnel_id: 'funnel-1',
      version: '2.0.0',
      questionnaire_config: { version: '1.0', steps: [] },
      content_manifest: { version: '1.0', pages: [] },
      algorithm_bundle_version: 'v2',
      prompt_version: '2.0',
      is_default: false,
      rollout_percent: 100,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: null,
    }

    const funnelsCatalogBuilder = makeSingleBuilder({ data: funnelRow, error: null })
    const patientProfilesBuilder = makeSingleBuilder({ data: { id: 'patient-1' }, error: null })
    const patientFunnelsBuilder = makeMaybeSingleBuilder({
      data: { active_version_id: 'version-active' },
      error: null,
    })

    const funnelVersionsBuilder: any = {}
    funnelVersionsBuilder.select = jest.fn(() => funnelVersionsBuilder)
    funnelVersionsBuilder.eq = jest.fn((column: string, value: any) => {
      funnelVersionsBuilder._lastEq = { column, value }
      return funnelVersionsBuilder
    })
    funnelVersionsBuilder.single = jest.fn(() => {
      const last = funnelVersionsBuilder._lastEq
      if (last?.column === 'id' && last?.value === 'version-active') {
        return Promise.resolve({ data: versionActiveRow, error: null })
      }
      return Promise.resolve({ data: null, error: { message: 'Not found' } })
    })

    const mockClient: any = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
      from: jest.fn((table: string) => {
        if (table === 'funnel_version_pins') {
          throw new Error('should not query funnel_version_pins')
        }
        if (table === 'funnels_catalog') return funnelsCatalogBuilder
        if (table === 'patient_profiles') return patientProfilesBuilder
        if (table === 'patient_funnels') return patientFunnelsBuilder
        if (table === 'funnel_versions') return funnelVersionsBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const result = await loadFunnelVersionWithClient(mockClient, 'stress-assessment')

    expect(result.id).toBe('version-active')
    expect(result.version).toBe('2.0.0')
    expect(mockClient.from).not.toHaveBeenCalledWith('funnel_version_pins')
    expect(funnelVersionsBuilder.eq).toHaveBeenCalledWith('id', 'version-active')
  })

  it('falls back to funnels_catalog.default_version_id when no authenticated patient', async () => {
    const funnelRow = {
      id: 'funnel-1',
      slug: 'stress-assessment',
      title: 'Stress',
      pillar_id: null,
      description: null,
      is_active: true,
      default_version_id: 'version-default',
    }

    const versionDefaultRow = {
      id: 'version-default',
      funnel_id: 'funnel-1',
      version: '1.0.0',
      questionnaire_config: { version: '1.0', steps: [] },
      content_manifest: { version: '1.0', pages: [] },
      algorithm_bundle_version: 'v1',
      prompt_version: '1.0',
      is_default: true,
      rollout_percent: 100,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: null,
    }

    const funnelsCatalogBuilder = makeSingleBuilder({ data: funnelRow, error: null })

    const funnelVersionsBuilder: any = {}
    funnelVersionsBuilder.select = jest.fn(() => funnelVersionsBuilder)
    funnelVersionsBuilder.eq = jest.fn((column: string, value: any) => {
      funnelVersionsBuilder._lastEq = { column, value }
      return funnelVersionsBuilder
    })
    funnelVersionsBuilder.single = jest.fn(() => {
      const last = funnelVersionsBuilder._lastEq
      if (last?.column === 'id' && last?.value === 'version-default') {
        return Promise.resolve({ data: versionDefaultRow, error: null })
      }
      return Promise.resolve({ data: null, error: { message: 'Not found' } })
    })

    const mockClient: any = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: jest.fn((table: string) => {
        if (table === 'funnel_version_pins') {
          throw new Error('should not query funnel_version_pins')
        }
        if (table === 'funnels_catalog') return funnelsCatalogBuilder
        if (table === 'funnel_versions') return funnelVersionsBuilder
        throw new Error(`unexpected table: ${table}`)
      }),
    }

    const result = await loadFunnelVersionWithClient(mockClient, 'stress-assessment')

    expect(result.id).toBe('version-default')
    expect(result.version).toBe('1.0.0')
    expect(mockClient.from).not.toHaveBeenCalledWith('funnel_version_pins')
    expect(funnelVersionsBuilder.eq).toHaveBeenCalledWith('id', 'version-default')
  })
})
