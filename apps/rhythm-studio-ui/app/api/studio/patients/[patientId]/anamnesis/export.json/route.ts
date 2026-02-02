/**
 * E75.6: Clinician Anamnesis Export API
 * 
 * GET /api/studio/patients/[patientId]/anamnesis/export.json
 * 
 * Allows clinicians to export anamnesis entries for assigned patients in JSON format.
 * 
 * Security:
 * - Requires authentication
 * - Requires clinician or admin role
 * - RLS ensures clinician can only export assigned patient data
 * - Returns 404 if patient not found or not accessible
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
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'
import { getPatientOrganizationId } from '@/lib/api/anamnesis/helpers'
import { buildExportPayload, auditExportEvent } from '@/lib/api/anamnesis/export'
import { featureFlags } from '@/lib/featureFlags'

type RouteContext = {
  params: Promise<{ patientId: string }>
}

export async function GET(request: Request, context: RouteContext) {
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

    const { patientId } = await context.params
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

    // Check clinician role
    const isClinician = await hasClinicianRole()

    if (!isClinician) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: 'Clinician or admin role required',
          },
        },
        { status: 403 }
      )
    }

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('id', patientId)
      .maybeSingle()

    if (patientError || !patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Patient not found',
          },
        },
        { status: 404 }
      )
    }

    // Get organization ID
    const organizationId = await getPatientOrganizationId(supabase, patientId)

    // Parse query parameters
    const url = new URL(request.url)
    const includeVersions = url.searchParams.get('include_versions') === 'true'

    // Build export payload
    // RLS policies will automatically enforce that clinician can only see assigned patients
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
      'clinician',
      patientId,
      organizationId,
      payload.entries.length,
      includeVersions
    )

    // Generate filename with timestamp and patient ID
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `anamnesis-export-patient-${patientId.substring(0, 8)}-${timestamp}.json`

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
    console.error('[studio/patients/anamnesis/export] Unexpected error:', err)
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
