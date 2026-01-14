import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/authHelpers'
import { successResponse, internalErrorResponse } from '@/lib/api/responses'

/**
 * E6.4.1: Patient Dashboard API
 * 
 * Demonstrates 401-first auth ordering and optional pilot eligibility checking.
 * This endpoint is a placeholder for future dashboard data.
 * 
 * AC1: Unauthenticated → 401 (401-first, no DB calls)
 * AC2: Authenticated but not eligible → 403 (if pilot gates are enabled)
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0

type DashboardData = {
  message: string
  user_id: string
  pilot_eligible?: boolean
}

export async function GET() {
  // E6.4.1 AC1: Auth check FIRST, before any DB/IO operations
  const authResult = await requireAuth()
  
  if (authResult.error) {
    // Returns 401 for unauthenticated or session expired
    return authResult.error
  }
  
  const user = authResult.user!
  
  // E6.4.1 AC2: Optional pilot eligibility check
  // If NEXT_PUBLIC_PILOT_ENABLED is set, check eligibility
  // This demonstrates the pattern but doesn't enforce it by default
  let pilotEligible: boolean | undefined = undefined
  
  if (process.env.NEXT_PUBLIC_PILOT_ENABLED === 'true') {
    try {
      const { isPilotEligibleFull } = await import('@/lib/api/pilotEligibility')
      pilotEligible = await isPilotEligibleFull(user)
      
      // If you want to enforce pilot eligibility, uncomment:
      // if (!pilotEligible) {
      //   const { pilotNotEligibleResponse } = await import('@/lib/api/responses')
      //   return pilotNotEligibleResponse()
      // }
    } catch (error) {
      console.error('Error checking pilot eligibility:', error)
      return internalErrorResponse('Failed to check pilot eligibility')
    }
  }
  
  // Business logic - only reached after auth (and optional pilot check)
  const dashboardData: DashboardData = {
    message: 'Patient dashboard access granted',
    user_id: user.id,
    ...(pilotEligible !== undefined && { pilot_eligible: pilotEligible }),
  }
  
  return successResponse(dashboardData)
}
