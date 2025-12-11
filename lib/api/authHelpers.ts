import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { User } from '@supabase/supabase-js'

/**
 * F10: Authentication and Authorization Helpers for API Routes
 * 
 * Provides reusable utilities for checking authentication and role-based authorization
 * in API routes, following the DRY principle.
 */

export interface AuthCheckResult {
  user: User | null
  error: NextResponse | null
}

/**
 * Verifies that the user is authenticated
 * Returns the user object if authenticated, or an error response
 */
export async function requireAuth(): Promise<AuthCheckResult> {
  try {
    const cookieStore = await cookies()
    const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!publicSupabaseUrl || !publicSupabaseAnonKey) {
      console.error('Supabase URL or anon key not configured')
      return {
        user: null,
        error: NextResponse.json({ error: 'Server configuration error' }, { status: 500 }),
      }
    }

    const supabase = createServerClient(publicSupabaseUrl, publicSupabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        user: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    return { user, error: null }
  } catch (error) {
    console.error('Error in requireAuth:', error)
    return {
      user: null,
      error: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
    }
  }
}

/**
 * Verifies that the user has admin or clinician role
 * Returns the user object if authorized, or an error response
 */
export async function requireAdminOrClinicianRole(): Promise<AuthCheckResult> {
  const authResult = await requireAuth()
  
  if (authResult.error) {
    return authResult
  }

  const user = authResult.user!
  const role = user.app_metadata?.role || user.user_metadata?.role
  const hasAccess = role === 'clinician' || role === 'admin'

  if (!hasAccess) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { user, error: null }
}

/**
 * Checks if a user has a specific role
 */
export function hasRole(user: User, requiredRole: string): boolean {
  const role = user.app_metadata?.role || user.user_metadata?.role
  return role === requiredRole
}

/**
 * Checks if a user has any of the specified roles
 */
export function hasAnyRole(user: User, requiredRoles: string[]): boolean {
  const role = user.app_metadata?.role || user.user_metadata?.role
  return requiredRoles.includes(role)
}
