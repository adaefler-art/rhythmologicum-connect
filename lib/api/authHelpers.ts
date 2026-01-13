import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { NextResponse } from 'next/server'
import { User } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { sessionExpiredResponse } from './responses'

/**
 * F10: Authentication and Authorization Helpers for API Routes
 * 
 * Provides reusable utilities for checking authentication and role-based authorization
 * in API routes, following the DRY principle.
 * 
 * E6.2.6: Enhanced to detect session expiry and return SESSION_EXPIRED error code
 */

export interface AuthCheckResult {
  user: User | null
  error: NextResponse | null
}

/**
 * Checks if an auth error indicates an expired session
 * E6.2.6: Session expiry detection
 */
export function isSessionExpired(error: unknown): boolean {
  if (!error) return false
  
  // Check for common session expiry indicators
  const errorStr = String(error)
  const errorMessage = error && typeof error === 'object' && 'message' in error 
    ? String((error as { message: unknown }).message).toLowerCase()
    : errorStr.toLowerCase()
  
  // Common Supabase auth expiry patterns
  return (
    errorMessage.includes('jwt expired') ||
    errorMessage.includes('token expired') ||
    errorMessage.includes('session expired') ||
    errorMessage.includes('refresh_token_not_found') ||
    errorMessage.includes('invalid refresh token')
  )
}

/**
 * Verifies that the user is authenticated
 * Returns the user object if authenticated, or an error response
 * 
 * E6.2.6: Returns SESSION_EXPIRED (401) when session has expired
 * Returns UNAUTHORIZED (401) for other auth failures
 */
export async function requireAuth(): Promise<AuthCheckResult> {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      // E6.2.6: Detect session expiry
      if (isSessionExpired(userError)) {
        return {
          user: null,
          error: sessionExpiredResponse(),
        }
      }
      
      return {
        user: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    if (!user) {
      return {
        user: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    return { user, error: null }
  } catch (error) {
    console.error('Error in requireAuth:', error)
    
    // E6.2.6: Check for session expiry in caught errors
    if (isSessionExpired(error)) {
      return {
        user: null,
        error: sessionExpiredResponse(),
      }
    }
    
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
