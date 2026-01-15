/**
 * E6.4.8: Pilot Flow Events Retrieval API
 * 
 * GET /api/admin/pilot/flow-events
 * 
 * Retrieves pilot flow events for debugging and observability.
 * Admin/clinician access only.
 */

import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  invalidInputResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { getCorrelationId } from '@/lib/telemetry/correlationId'
import type { PilotFlowEvent } from '@/lib/types/telemetry'

/**
 * GET /api/admin/pilot/flow-events
 * 
 * Query parameters:
 * - patientId: Filter by patient ID (UUID)
 * - correlationId: Filter by correlation ID
 * - entityType: Filter by entity type (e.g., "assessment", "triage")
 * - entityId: Filter by entity ID
 * - limit: Number of results (default 100, max 500)
 * - offset: Offset for pagination (default 0)
 * 
 * Returns events in deterministic order: created_at ASC, id ASC
 */
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return unauthorizedResponse('Authentifizierung fehlgeschlagen.', correlationId)
    }
    
    // Check role: admin or clinician only
    const userRole = user.app_metadata?.role
    if (userRole !== 'admin' && userRole !== 'clinician') {
      console.warn('[TELEMETRY] Unauthorized access attempt to pilot flow events', {
        userId: user.id,
        role: userRole,
        correlationId,
      })
      return forbiddenResponse('Zugriff verweigert.', correlationId)
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || undefined
    const correlationIdFilter = searchParams.get('correlationId') || undefined
    const entityType = searchParams.get('entityType') || undefined
    const entityId = searchParams.get('entityId') || undefined
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    
    // Validate and parse limit (default 100, max 500)
    let limit = 100
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10)
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return invalidInputResponse('Ungültiger "limit" Parameter.', undefined, correlationId)
      }
      limit = Math.min(parsedLimit, 500)
    }
    
    // Validate and parse offset (default 0)
    let offset = 0
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10)
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return invalidInputResponse('Ungültiger "offset" Parameter.', undefined, correlationId)
      }
      offset = parsedOffset
    }
    
    // Build query
    let query = supabase
      .from('pilot_flow_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1)
    
    // Apply filters
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }
    if (correlationIdFilter) {
      query = query.eq('correlation_id', correlationIdFilter)
    }
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }
    if (entityId) {
      query = query.eq('entity_id', entityId)
    }
    
    // Execute query
    const { data, error, count } = await query
    
    if (error) {
      console.error('[TELEMETRY] Failed to retrieve pilot flow events', {
        error: error.message,
        correlationId,
      })
      return internalErrorResponse('Fehler beim Abrufen der Events.', correlationId)
    }
    
    const events = (data || []) as PilotFlowEvent[]
    
    return successResponse(
      {
        events,
        total: count ?? 0,
        limit,
        offset,
        filters: {
          patientId,
          correlationId: correlationIdFilter,
          entityType,
          entityId,
        },
      },
      200,
      correlationId,
    )
  } catch (error) {
    console.error('[TELEMETRY] Exception in pilot flow events endpoint', {
      error: error instanceof Error ? error.message : String(error),
      correlationId,
    })
    return internalErrorResponse('Interner Fehler.', correlationId)
  }
}
