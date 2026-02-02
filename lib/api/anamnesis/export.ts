/**
 * E75.6: Anamnesis Export Helper Functions
 * 
 * Utilities for exporting anamnesis entries in JSON format
 * with proper metadata and audit logging.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'

type SupabaseClientType = SupabaseClient<Database>

/**
 * Export metadata structure
 */
export type ExportMetadata = {
  generated_at: string
  patient_id: string
  org_id: string | null
  entry_count: number
  include_versions: boolean
}

/**
 * Entry data for export
 */
export type ExportEntry = {
  id: string
  title: string
  content: unknown
  entry_type: string | null
  tags: string[]
  is_archived: boolean
  created_at: string
  updated_at: string
  version_count: number
  versions?: Array<{
    id: string
    version_number: number
    title: string
    content: unknown
    entry_type: string | null
    tags: string[]
    changed_by: string | null
    changed_at: string
    change_reason: string | null
  }>
}

/**
 * Complete export payload
 */
export type ExportPayload = {
  metadata: ExportMetadata
  entries: ExportEntry[]
}

/**
 * Build export payload from anamnesis entries
 * 
 * @param supabase - Supabase client
 * @param patientId - Patient profile ID
 * @param organizationId - Organization ID (nullable)
 * @param includeVersions - Whether to include all versions
 * @returns Export payload with metadata and entries
 */
export async function buildExportPayload(
  supabase: SupabaseClientType,
  patientId: string,
  organizationId: string | null,
  includeVersions: boolean = false
): Promise<ExportPayload> {
  // Fetch anamnesis entries for patient
  const { data: entries, error: entriesError } = await supabase
    .from('anamnesis_entries')
    .select('*')
    .eq('patient_id', patientId)
    .order('updated_at', { ascending: false })

  if (entriesError) {
    throw new Error(`Failed to fetch anamnesis entries: ${entriesError.message}`)
  }

  // Build export entries with version counts
  const exportEntries: ExportEntry[] = await Promise.all(
    (entries || []).map(async (entry) => {
      const { count } = await supabase
        .from('anamnesis_entry_versions')
        .select('*', { count: 'exact', head: true })
        .eq('entry_id', entry.id)

      const exportEntry: ExportEntry = {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        entry_type: entry.entry_type,
        tags: entry.tags || [],
        is_archived: entry.is_archived,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        version_count: count || 0,
      }

      // Include all versions if requested
      if (includeVersions) {
        const { data: versions, error: versionsError } = await supabase
          .from('anamnesis_entry_versions')
          .select('*')
          .eq('entry_id', entry.id)
          .order('version_number', { ascending: false })

        if (!versionsError && versions) {
          exportEntry.versions = versions.map((v) => ({
            id: v.id,
            version_number: v.version_number,
            title: v.title,
            content: v.content,
            entry_type: v.entry_type,
            tags: v.tags || [],
            changed_by: v.changed_by,
            changed_at: v.changed_at,
            change_reason: v.change_reason,
          }))
        }
      }

      return exportEntry
    })
  )

  // Build metadata
  const metadata: ExportMetadata = {
    generated_at: new Date().toISOString(),
    patient_id: patientId,
    org_id: organizationId,
    entry_count: exportEntries.length,
    include_versions: includeVersions,
  }

  return {
    metadata,
    entries: exportEntries,
  }
}

/**
 * Log an export event to audit_log
 * 
 * @param supabase - Supabase client
 * @param userId - User performing export
 * @param userRole - Role of user (patient, clinician, admin)
 * @param patientId - Patient whose data was exported
 * @param organizationId - Organization context
 * @param entryCount - Number of entries exported
 * @param includeVersions - Whether versions were included
 */
export async function auditExportEvent(
  supabase: SupabaseClientType,
  userId: string,
  userRole: 'patient' | 'clinician' | 'admin',
  patientId: string,
  organizationId: string | null,
  entryCount: number,
  includeVersions: boolean
): Promise<void> {
  const { error } = await supabase.from('audit_log').insert({
    actor_user_id: userId,
    actor_role: userRole,
    entity_type: 'anamnesis_export',
    entity_id: patientId,
    action: 'export',
    org_id: organizationId,
    source: 'api',
    diff: {
      entry_count: entryCount,
      include_versions: includeVersions,
      exported_at: new Date().toISOString(),
    },
  })

  if (error) {
    console.error('[anamnesis-export] Failed to audit export event:', error)
    // Don't throw - audit failure should not block export
  }
}
