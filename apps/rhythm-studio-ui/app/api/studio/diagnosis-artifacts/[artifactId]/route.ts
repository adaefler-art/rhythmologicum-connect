import { NextRequest, NextResponse } from 'next/server'
import {
  successResponse,
  forbiddenResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
  databaseErrorResponse,
} from '@/lib/api/responses'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { getRequestId, withRequestId, sanitizeSupabaseError, logError } from '@/lib/db/errors'

/**
 * E76.3 API Endpoint: Get a single diagnosis artifact
 * GET /api/studio/diagnosis-artifacts/{artifactId}
 * 
 * Returns a single diagnosis artifact by ID.
 * Only accessible by clinicians/admins in the same organization.
 * 
 * Returns: { artifact: DiagnosisArtifact }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ artifactId: string }> }
) {
  const requestId = getRequestId(request)

  try {
    const { artifactId } = await context.params

    // Validate artifactId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(artifactId)) {
      return withRequestId(
        validationErrorResponse('Invalid artifact ID format', undefined, requestId),
        requestId
      )
    }

    // Auth gate
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return withRequestId(unauthorizedResponse(undefined, requestId), requestId)
    }

    // Authorization gate (clinician/admin only)
    const isAuthorized = await hasAdminOrClinicianRole()
    if (!isAuthorized) {
      return withRequestId(forbiddenResponse(undefined, requestId), requestId)
    }

    // Fetch diagnosis artifact (RLS will automatically filter to only accessible artifacts)
    const { data: artifact, error: fetchError } = await (supabase as any)  // Type cast due to outdated Supabase types (E76.4)
      .from('diagnosis_artifacts')
      .select('*')
      .eq('id', artifactId)
      .single()

    if (fetchError) {
      const safeErr = sanitizeSupabaseError(fetchError)
      if (safeErr.code === 'PGRST116') {
        return withRequestId(
          notFoundResponse('DiagnosisArtifact', `Diagnosis artifact not found: ${artifactId}`, requestId),
          requestId
        )
      }
      logError({ requestId, operation: 'fetch_diagnosis_artifact', userId: user.id, error: safeErr })
      return withRequestId(databaseErrorResponse(undefined, requestId), requestId)
    }

    if (!artifact) {
      return withRequestId(
        notFoundResponse('DiagnosisArtifact', `Diagnosis artifact not found: ${artifactId}`, requestId),
        requestId
      )
    }

    return withRequestId(successResponse({ artifact }, 200, requestId), requestId)
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    logError({ requestId, operation: 'GET /api/studio/diagnosis-artifacts/[artifactId]', error: safeErr })
    return withRequestId(internalErrorResponse(undefined, requestId), requestId)
  }
}
