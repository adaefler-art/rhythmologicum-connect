/**
 * E6 Cardiovascular Age Funnel Tests
 *
 * Tests for the cardiovascular-age funnel E2E flow:
 * - Definition loading from funnels_catalog
 * - Assessment start (POST /api/funnels/cardiovascular-age/assessments)
 * - Result endpoint title fallback to funnels_catalog
 */

import { loadFunnelWithClient, loadFunnelVersionWithClient } from '@/lib/funnels/loadFunnelVersion'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock Supabase client for testing
const createMockSupabaseClient = (overrides: Partial<{
  funnelsCatalog: unknown[] | null
  funnelVersions: unknown[] | null
  legacyFunnels: unknown[] | null
}> = {}): SupabaseClient<unknown> => {
  const { funnelsCatalog, funnelVersions, legacyFunnels } = {
    funnelsCatalog: null,
    funnelVersions: null,
    legacyFunnels: null,
    ...overrides,
  }

  return {
    from: (table: string) => {
      if (table === 'funnels_catalog') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: funnelsCatalog?.[0] ?? null,
                error: funnelsCatalog === null ? { code: 'PGRST116' } : null,
              }),
            }),
          }),
        }
      }
      if (table === 'funnel_versions') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({
                  data: funnelVersions?.[0] ?? null,
                  error: funnelVersions === null ? { code: 'PGRST116' } : null,
                }),
              }),
              single: async () => ({
                data: funnelVersions?.[0] ?? null,
                error: funnelVersions === null ? { code: 'PGRST116' } : null,
              }),
            }),
          }),
        }
      }
      if (table === 'funnels') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: legacyFunnels?.[0] ?? null,
                error: null,
              }),
            }),
          }),
        }
      }
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      }
    },
  } as unknown as SupabaseClient<unknown>
}

describe('Cardiovascular Age Funnel - Definition Loading', () => {
  const cardiovascularAgeCatalogEntry = {
    id: 'cv-funnel-id',
    slug: 'cardiovascular-age',
    title: 'Cardiovascular Age Assessment',
    pillar_id: 'prevention',
    description: 'Bestimmen Sie Ihr kardiovaskuläres Alter',
    is_active: true,
    default_version_id: 'cv-version-id',
  }

  const cardiovascularAgeVersion = {
    id: 'cv-version-id',
    funnel_id: 'cv-funnel-id',
    version: '1.0.0',
    is_default: true,
    rollout_percent: 100,
    algorithm_bundle_version: 'v0.5.0',
    prompt_version: '1.0',
    questionnaire_config: {
      schema_version: 'v1',
      version: '1.0',
      steps: [
        {
          id: 'step-1',
          title: 'Grunddaten',
          description: 'Ihre persönlichen Daten',
          questions: [
            { id: 'q1-age', key: 'age', type: 'number', label: 'Wie alt sind Sie?', required: true },
            {
              id: 'q2-gender',
              key: 'gender',
              type: 'radio',
              label: 'Geschlecht',
              required: true,
              options: [
                { value: 'male', label: 'Männlich' },
                { value: 'female', label: 'Weiblich' },
                { value: 'other', label: 'Divers' },
              ],
            },
          ],
        },
        {
          id: 'step-2',
          title: 'Gesundheitsfaktoren',
          description: 'Aktuelle Gesundheitsindikatoren',
          questions: [
            {
              id: 'q3-blood-pressure',
              key: 'blood_pressure',
              type: 'radio',
              label: 'Blutdruck-Status',
              required: true,
              options: [
                { value: 'normal', label: 'Normal' },
                { value: 'elevated', label: 'Erhöht' },
                { value: 'high', label: 'Hoch' },
              ],
            },
          ],
        },
      ],
    },
    content_manifest: {
      schema_version: 'v1',
      version: '1.0',
      pages: [
        {
          slug: 'intro',
          title: 'Willkommen',
          sections: [
            {
              key: 'hero',
              type: 'hero',
              content: {
                title: 'Cardiovascular Age Assessment',
              },
            },
          ],
        },
      ],
    },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: null,
  }

  it('should load cardiovascular-age from funnels_catalog', async () => {
    const mockClient = createMockSupabaseClient({
      funnelsCatalog: [cardiovascularAgeCatalogEntry],
    })

    const result = await loadFunnelWithClient(mockClient, 'cardiovascular-age')

    expect(result).not.toBeNull()
    expect(result?.slug).toBe('cardiovascular-age')
    expect(result?.title).toBe('Cardiovascular Age Assessment')
    expect(result?.isActive).toBe(true)
  })

  it('should return null for non-existent funnel', async () => {
    const mockClient = createMockSupabaseClient({
      funnelsCatalog: null,
    })

    const result = await loadFunnelWithClient(mockClient, 'non-existent-funnel')

    expect(result).toBeNull()
  })

  it('should load funnel version with questionnaire_config', async () => {
    const mockClient = createMockSupabaseClient({
      funnelsCatalog: [cardiovascularAgeCatalogEntry],
      funnelVersions: [cardiovascularAgeVersion],
    })

    const result = await loadFunnelVersionWithClient(mockClient, 'cardiovascular-age')

    expect(result).not.toBeNull()
    expect(result.manifest.questionnaire_config.steps).toHaveLength(2)
    expect(result.manifest.questionnaire_config.steps[0].id).toBe('step-1')
    expect(result.manifest.questionnaire_config.steps[0].questions).toHaveLength(2)
  })

  it('should extract first step for V0.5 funnels', async () => {
    const mockClient = createMockSupabaseClient({
      funnelsCatalog: [cardiovascularAgeCatalogEntry],
      funnelVersions: [cardiovascularAgeVersion],
    })

    const loadedVersion = await loadFunnelVersionWithClient(mockClient, 'cardiovascular-age')
    const firstStep = loadedVersion.manifest.questionnaire_config.steps[0]

    expect(firstStep).toBeDefined()
    expect(firstStep.id).toBe('step-1')
    expect(firstStep.title).toBe('Grunddaten')
    expect(firstStep.questions).toHaveLength(2)
  })
})

describe('Cardiovascular Age Funnel - Patient Reachability', () => {
  // Import after mocks are set up
  const { isFunnelPatientReachable, PATIENT_REACHABLE_FUNNELS } = require('@/lib/config/funnelAllowlist')

  it('should be patient-reachable (added to allowlist)', () => {
    // cardiovascular-age is now in the allowlist
    expect(PATIENT_REACHABLE_FUNNELS).toContain('cardiovascular-age')
    expect(isFunnelPatientReachable('cardiovascular-age')).toBe(true)
  })

  it('should recognize stress-assessment as patient-reachable', () => {
    expect(PATIENT_REACHABLE_FUNNELS).toContain('stress-assessment')
    expect(isFunnelPatientReachable('stress-assessment')).toBe(true)
  })

  it('should not recognize sleep-quality as patient-reachable (admin-only)', () => {
    expect(PATIENT_REACHABLE_FUNNELS).not.toContain('sleep-quality')
    expect(isFunnelPatientReachable('sleep-quality')).toBe(false)
  })
})
