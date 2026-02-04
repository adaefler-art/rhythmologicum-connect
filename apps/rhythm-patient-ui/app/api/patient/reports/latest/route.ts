/**
 * GET /api/patient/reports/latest
 * 
 * Stub endpoint for downloading the latest patient report.
 * Returns a minimal JSON stub response until full PDF generation is implemented.
 * 
 * Contract:
 * - Returns latest assessment report for authenticated patient
 * - Stub implementation returns JSON instead of PDF
 * - Future implementation will generate and return PDF
 * 
 * Security:
 * - Requires authentication
 * - Only returns reports for current user
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

export async function GET() {
  console.log('[REPORTS_LATEST] STEP=start')
  
  // ==========================================
  // STEP 1: CREATE SUPABASE CLIENT
  // ==========================================
  let supabase
  try {
    supabase = await createServerSupabaseClient()
    console.log('[REPORTS_LATEST] STEP=createClient success=true')
  } catch (err) {
    console.error('[REPORTS_LATEST] STEP=createClient success=false', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { 
        success: false,
        error: { code: 'CONFIGURATION_ERROR', message: 'Server configuration error' } 
      },
      { status: 500 }
    )
  }
  
  // ==========================================
  // STEP 2: CHECK AUTHENTICATION
  // ==========================================
  let user
  try {
    const { data, error } = await supabase.auth.getUser()
    user = data?.user
    console.log('[REPORTS_LATEST] STEP=getUser success=true', {
      hasUser: !!user,
      hasError: !!error,
    })
    
    if (error) {
      console.error('[REPORTS_LATEST] STEP=getUser authError', {
        errorMessage: error.message,
      })
    }
  } catch (err) {
    console.error('[REPORTS_LATEST] STEP=getUser success=false', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { 
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Authentication error' } 
      },
      { status: 500 }
    )
  }
  
  if (!user) {
    console.log('[REPORTS_LATEST] STEP=unauthorized reason=noUser')
    return NextResponse.json(
      { 
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' } 
      },
      { status: 401 }
    )
  }
  
  // ==========================================
  // STEP 3: FETCH LATEST REPORT (STUB)
  // ==========================================
  // TODO: Implement actual report fetching from database
  // For now, return stub data
  
  console.log('[REPORTS_LATEST] STEP=fetchReport userId=%s stub=true', user.id)
  
  const stubReport = {
    success: true,
    data: {
      reportId: 'stub-report-001',
      assessmentId: 'stub-assessment-001',
      userId: user.id,
      createdAt: new Date().toISOString(),
      reportType: 'stress_assessment',
      format: 'json',
      isStub: true,
      message: 'This is a stub report. Full PDF generation coming soon.',
      summary: {
        overallScore: 72,
        stressLevel: 'Moderate (6/10)',
        sleepQuality: 'Excellent (8.5 hours average)',
        recommendations: [
          'Continue maintaining good sleep habits',
          'Consider stress management techniques',
          'Regular physical activity is beneficial',
        ],
      },
    },
  }
  
  console.log('[REPORTS_LATEST] STEP=response success=true stub=true')
  
  return NextResponse.json(stubReport, { status: 200 })
}
