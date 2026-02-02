/**
 * E75.6: Patient Anamnesis Export API
 * 
 * GET /api/patient/anamnesis/export.json
 * 
 * Allows authenticated patients to export their own anamnesis entries in JSON format.
 * 
 * Security:
 * - Requires authentication
 * - Patient can only export their own data
 * - Returns 403 if no patient profile found
 * - Feature-flagged (ANAMNESIS_EXPORT_ENABLED)
 * 
 * Query Parameters:
 * - include_versions (optional): Include all versions (default: false)
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     metadata: {
 *       generated_at: string (ISO 8601),
 *       patient_id: string (UUID),
 *       org_id: string | null (UUID),
 *       entry_count: number,
 *       include_versions: boolean
 *     },
 *     entries: Array<{
 *       id: string,
 *       title: string,
 *       content: object,
 *       entry_type: string | null,
 *       tags: string[],
 *       is_archived: boolean,
 *       created_at: string,
 *       updated_at: string,
 *       version_count: number,
 *       versions?: Array<...>  // Only if include_versions=true
 *     }>
 *   }
 * }
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'
import { getPatientProfileId, getPatientOrganizationId } from '@/lib/api/anamnesis/helpers'
import { buildExportPayload, auditExportEvent } from '@/lib/api/anamnesis/export'
import { featureFlags } from '@/lib/featureFlags'

export async function GET(request: Request) {
  try {
    // Check feature flag
    if (!featureFlags.ANAMNESIS_EXPORT_ENABLED) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Feature not available',
          },
        },
        { status: 404 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // Get patient profile ID
    const patientId = await getPatientProfileId(supabase, user.id)

    if (!patientId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: 'Patient profile not found',
          },
        },
        { status: 403 }
      )
    }

    // Get organization ID
    const organizationId = await getPatientOrganizationId(supabase, patientId)

    // Parse query parameters
    const url = new URL(request.url)
    const includeVersions = url.searchParams.get('include_versions') === 'true'

    // Build export payload
    const payload = await buildExportPayload(
      supabase,
      patientId,
      organizationId,
      includeVersions
    )

    // Audit export event
    await auditExportEvent(
      supabase,
      user.id,
      'patient',
      patientId,
      organizationId,
      payload.entries.length,
      includeVersions
    )

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `anamnesis-export-${timestamp}.json`

    // Return export with attachment header
    return NextResponse.json(
      {
        success: true,
        data: payload,
      },
      {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      }
    )
  } catch (err) {
    console.error('[patient/anamnesis/export] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}
