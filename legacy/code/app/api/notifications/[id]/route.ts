import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { logUnauthorized, logError } from '@/lib/logging/logger'

/**
 * API Route: Mark Notification as Read
 * 
 * PATCH /api/notifications/[id]
 * 
 * Marks a notification as read for the authenticated user.
 * 
 * Response:
 * {
 *   success: true,
 *   data: { id: string, readAt: string }
 * }
 * 
 * Security:
 * - Requires authentication
 * - Users can only mark their own notifications as read (RLS enforced)
 */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // ============================================================================
  // STEP 1: Authentication Check (BEFORE reading params)
  // ============================================================================
  const user = await getCurrentUser()
  if (!user) {
    logUnauthorized({
      endpoint: `/api/notifications/[id]`,
    })
    return unauthorizedResponse('Authentifizierung erforderlich.')
  }

  try {
    const { id } = await context.params

    // ============================================================================
    // STEP 2: Update notification (RLS ensures user ownership)
    // ============================================================================
    const supabase = createAdminSupabaseClient()

    const readAt = new Date().toISOString()

    const { data, error } = (await supabase
      .from('notifications' as any) // Type will be correct after db:typegen
      .update({
        status: 'READ' as any, // Type will be correct after db:typegen
        read_at: readAt,
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ownership check
      .select('id, read_at')
      .single()) as { data: { id: string; read_at: string } | null; error: any }

    if (error || !data) {
      logError('Error marking notification as read', { userId: user.id, notificationId: id }, error)
      // Return 404 to avoid existence disclosure
      return notFoundResponse('Benachrichtigung nicht gefunden.')
    }

    // ============================================================================
    // STEP 3: Return response
    // ============================================================================
    return successResponse({
      id: data.id,
      readAt: data.read_at,
    })
  } catch (err) {
    logError('Error in PATCH /api/notifications/[id]', { userId: user.id }, err)
    return internalErrorResponse('Fehler beim Aktualisieren der Benachrichtigung.')
  }
}
