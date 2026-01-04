import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { logUnauthorized } from '@/lib/logging/logger'

/**
 * API Route: List User Notifications
 * 
 * GET /api/notifications
 * 
 * Lists notifications for the authenticated user.
 * 
 * Query Parameters:
 * - status: filter by status (PENDING, SENT, DELIVERED, READ, FAILED, CANCELLED)
 * - unreadOnly: boolean - only show unread notifications
 * - limit: number (default 50, max 100)
 * - offset: number (default 0)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     notifications: NotificationRecord[],
 *     total: number,
 *     unreadCount: number,
 *     hasMore: boolean
 *   }
 * }
 * 
 * Security:
 * - Requires authentication
 * - Users can only see their own notifications
 * - Clinicians/admins can see all notifications (future)
 */

export async function GET(request: NextRequest) {
  try {
    // ============================================================================
    // STEP 1: Authentication Check
    // ============================================================================
    const user = await getCurrentUser()
    if (!user) {
      logUnauthorized({
        endpoint: '/api/notifications',
      })
      return unauthorizedResponse('Authentifizierung erforderlich.')
    }

    // ============================================================================
    // STEP 2: Parse query parameters
    // ============================================================================
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    )
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // ============================================================================
    // STEP 3: Query notifications (uses RLS for access control)
    // ============================================================================
    const supabase = createAdminSupabaseClient()

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (unreadOnly) {
      query = query.is('read_at', null)
    }

    const { data: notifications, error, count } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return internalErrorResponse('Fehler beim Laden der Benachrichtigungen.')
    }

    // ============================================================================
    // STEP 4: Get unread count
    // ============================================================================
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null)
      .neq('status', 'CANCELLED')

    // ============================================================================
    // STEP 5: Return response
    // ============================================================================
    return successResponse({
      notifications: notifications || [],
      total: count || 0,
      unreadCount: unreadCount || 0,
      hasMore: (count || 0) > offset + limit,
    })
  } catch (err) {
    console.error('Error in GET /api/notifications:', err)
    return internalErrorResponse('Fehler beim Laden der Benachrichtigungen.')
  }
}
