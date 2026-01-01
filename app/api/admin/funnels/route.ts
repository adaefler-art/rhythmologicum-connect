import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import {
  logUnauthorized,
  logForbidden,
  logClinicianFlowError,
} from '@/lib/logging/logger'

/**
 * B7 API Endpoint: List all funnels for admin/clinician management
 * GET /api/admin/funnels
 * 
 * Returns all funnels with basic metadata for overview page
 */
export async function GET() {
  try {
    // Check authentication and authorization
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      logUnauthorized({ endpoint: '/api/admin/funnels' })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = user.app_metadata?.role || user.user_metadata?.role
    // Allow access for clinician and admin roles
    const hasAccess = role === 'clinician' || role === 'admin'
    if (!hasAccess) {
      logForbidden({ userId: user.id, endpoint: '/api/admin/funnels' }, 'User lacks clinician/admin role')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use service role for admin operations
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      logClinicianFlowError(
        { endpoint: '/api/admin/funnels', userId: user.id },
        new Error('Supabase configuration missing')
      )
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // Fetch all funnels
    const { data: funnels, error: funnelsError } = await adminClient
      .from('funnels')
      .select('*')
      .order('created_at', { ascending: false })

    if (funnelsError) {
      logClinicianFlowError(
        { endpoint: '/api/admin/funnels', userId: user.id },
        funnelsError
      )
      return NextResponse.json({ error: 'Failed to fetch funnels' }, { status: 500 })
    }

    return NextResponse.json({ funnels: funnels || [] })
  } catch (error) {
    logClinicianFlowError(
      { endpoint: '/api/admin/funnels' },
      error
    )
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
