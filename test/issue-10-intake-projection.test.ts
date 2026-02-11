/**
 * Issue 10: Clinical Intake Projection Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { projectClinicalIntakeToAnamnesis } from '@/lib/clinicalIntake/projection'
import { getPatientProfileId, getPatientOrganizationId } from '@/lib/api/anamnesis/helpers'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'

jest.mock('@/lib/api/anamnesis/helpers', () => ({
  getPatientProfileId: jest.fn(),
  getPatientOrganizationId: jest.fn(),
}))

const TEST_USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const TEST_PATIENT_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const TEST_ORG_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc'

const createStructuredData = (summary: string): StructuredIntakeData => ({
  status: 'draft',
  chief_complaint: summary,
  red_flags: [],
})

type MockRow = Record<string, any>

type MockTables = {
  anamnesis_entries: MockRow[]
  anamnesis_entry_versions: MockRow[]
}

const createMockSupabase = () => {
  const tables: MockTables = {
    anamnesis_entries: [],
    anamnesis_entry_versions: [],
  }
  let idCounter = 0

  const createVersion = (entry: MockRow) => {
    const versions = tables.anamnesis_entry_versions.filter(
      (version) => version.entry_id === entry.id,
    )
    const versionNumber = versions.length + 1

    tables.anamnesis_entry_versions.push({
      id: `mock-version-${(idCounter += 1)}`,
      entry_id: entry.id,
      version_number: versionNumber,
      title: entry.title,
      content: entry.content,
      entry_type: entry.entry_type,
      tags: entry.tags,
      changed_at: new Date().toISOString(),
    })
  }

  const createQuery = (tableName: keyof MockTables) => {
    const filters: Array<{ key: string; value: any }> = []
    let orderKey: string | null = null
    let orderAscending = true
    let limitValue: number | null = null

    const getRows = () => {
      const rows = tables[tableName]
      const filtered = rows.filter((row) =>
        filters.every(({ key, value }) => row[key] === value),
      )

      const sorted = orderKey
        ? [...filtered].sort((a, b) => {
            if (orderAscending) return String(a[orderKey]).localeCompare(String(b[orderKey]))
            return String(b[orderKey]).localeCompare(String(a[orderKey]))
          })
        : filtered

      if (limitValue !== null) return sorted.slice(0, limitValue)
      return sorted
    }

    const query: any = {
      select: () => query,
      eq: (key: string, value: any) => {
        filters.push({ key, value })
        return query
      },
      order: (key: string, { ascending }: { ascending: boolean }) => {
        orderKey = key
        orderAscending = ascending
        return query
      },
      limit: (value: number) => {
        limitValue = value
        return query
      },
      maybeSingle: async () => {
        const rows = getRows()
        return { data: rows[0] ?? null, error: null }
      },
      single: async () => {
        const rows = getRows()
        const row = rows[0]
        if (!row) return { data: null, error: new Error('Not found') }
        return { data: row, error: null }
      },
      insert: (payload: MockRow) => {
        const row = {
          id: payload.id ?? `mock-${tableName}-${(idCounter += 1)}`,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...payload,
        }
        tables[tableName].push(row)

        if (tableName === 'anamnesis_entries') {
          createVersion(row)
        }

        return {
          select: () => ({
            single: async () => ({ data: { id: row.id }, error: null }),
          }),
        }
      },
      update: (payload: MockRow) => {
        const rows = getRows()
        rows.forEach((row) => {
          Object.assign(row, payload)
          row.updated_at = new Date().toISOString()
          if (tableName === 'anamnesis_entries') {
            createVersion(row)
          }
        })

        return {
          select: () => ({
            single: async () => ({ data: { id: rows[0]?.id }, error: null }),
          }),
        }
      },
    }

    return query
  }

  return {
    from: (tableName: keyof MockTables) => createQuery(tableName),
    tables,
  }
}

describe('Issue 10: Clinical Intake Projection', () => {
  beforeEach(() => {
    ;(getPatientProfileId as jest.Mock).mockResolvedValue(TEST_PATIENT_ID)
    ;(getPatientOrganizationId as jest.Mock).mockResolvedValue(TEST_ORG_ID)
  })

  it('creates intake entry and version on first projection', async () => {
    const supabase = createMockSupabase()
    const structuredData = createStructuredData('Kopfschmerzen')

    const result = await projectClinicalIntakeToAnamnesis(supabase as any, {
      userId: TEST_USER_ID,
      intakeId: 'intake-1',
      structuredData,
      clinicalSummary: 'Klinische Zusammenfassung',
      promptVersion: 'v1',
      lastUpdatedFromMessages: ['msg-1'],
    })

    expect(result.success).toBe(true)
    expect(result.entryId).toBeDefined()
    expect(result.isNew).toBe(true)

    const entries = supabase.tables.anamnesis_entries
    expect(entries).toHaveLength(1)
    expect(entries[0].entry_type).toBe('intake')
    expect(entries[0].content.clinical_intake_id).toBe('intake-1')

    const versions = supabase.tables.anamnesis_entry_versions
    expect(versions).toHaveLength(1)
    expect(versions[0].entry_id).toBe(entries[0].id)
  })

  it('reuses existing intake entry and creates new versions', async () => {
    const supabase = createMockSupabase()

    const first = await projectClinicalIntakeToAnamnesis(supabase as any, {
      userId: TEST_USER_ID,
      intakeId: 'intake-1',
      structuredData: createStructuredData('Kopfschmerzen'),
      clinicalSummary: 'Erste Zusammenfassung',
      promptVersion: 'v1',
      lastUpdatedFromMessages: ['msg-1'],
    })

    const second = await projectClinicalIntakeToAnamnesis(supabase as any, {
      userId: TEST_USER_ID,
      intakeId: 'intake-2',
      structuredData: createStructuredData('Rueckenschmerzen'),
      clinicalSummary: 'Zweite Zusammenfassung',
      promptVersion: 'v2',
      lastUpdatedFromMessages: ['msg-2'],
    })

    expect(first.success).toBe(true)
    expect(second.success).toBe(true)
    expect(first.entryId).toBe(second.entryId)

    const entries = supabase.tables.anamnesis_entries
    expect(entries).toHaveLength(1)

    const versions = supabase.tables.anamnesis_entry_versions
    expect(versions).toHaveLength(2)
    expect(versions[1].content.clinical_intake_id).toBe('intake-2')
  })
})
