/**
 * E75.6: Anamnesis Export Utility
 * 
 * Client-side utility functions for exporting anamnesis data.
 * These functions contain the literal API callsites required by Strategy A.
 * 
 * IMPORTANT: Feature is gated by ANAMNESIS_EXPORT_ENABLED flag.
 * Callsites must remain as literal strings to satisfy Strategy A requirements.
 */

import { featureFlags } from '@/lib/featureFlags'

/**
 * Export patient's own anamnesis entries
 * 
 * @param includeVersions - Whether to include all versions (default: false)
 * @returns Anamnesis export data or error
 * 
 * Strategy A Compliance: Literal callsite for /api/patient/anamnesis/export.json
 */
export async function exportPatientAnamnesis(
  includeVersions: boolean = false
): Promise<{
  success: boolean
  data?: unknown
  error?: { code: string; message: string }
}> {
  if (!featureFlags.ANAMNESIS_EXPORT_ENABLED) {
    throw new Error('Anamnesis export feature is not enabled')
  }

  const url = `/api/patient/anamnesis/export.json${includeVersions ? '?include_versions=true' : ''}`
  
  // Literal callsite - DO NOT REFACTOR
  const response = await fetch('/api/patient/anamnesis/export.json' + 
    (includeVersions ? '?include_versions=true' : ''))
  
  if (!response.ok) {
    const error = await response.json()
    return error
  }

  return await response.json()
}

/**
 * Export anamnesis entries for a specific patient (clinician access)
 * 
 * @param patientId - Patient profile ID
 * @param includeVersions - Whether to include all versions (default: false)
 * @returns Anamnesis export data or error
 * 
 * Strategy A Compliance: Literal callsite for /api/studio/patients/[patientId]/anamnesis/export.json
 */
export async function exportClinicianPatientAnamnesis(
  patientId: string,
  includeVersions: boolean = false
): Promise<{
  success: boolean
  data?: unknown
  error?: { code: string; message: string }
}> {
  if (!featureFlags.ANAMNESIS_EXPORT_ENABLED) {
    throw new Error('Anamnesis export feature is not enabled')
  }

  const queryParams = includeVersions ? '?include_versions=true' : ''
  
  // Literal callsite - DO NOT REFACTOR
  const response = await fetch(`/api/studio/patients/${patientId}/anamnesis/export.json${queryParams}`)
  
  if (!response.ok) {
    const error = await response.json()
    return error
  }

  return await response.json()
}

/**
 * Download exported anamnesis as JSON file
 * 
 * @param data - Export payload
 * @param filename - Custom filename (optional)
 */
export function downloadAnamnesisExport(data: unknown, filename?: string): void {
  const defaultFilename = `anamnesis-export-${new Date().toISOString().split('T')[0]}.json`
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename || defaultFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
