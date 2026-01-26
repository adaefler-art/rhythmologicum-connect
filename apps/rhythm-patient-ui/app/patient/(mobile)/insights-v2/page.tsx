/**
 * Personal Insights v2 - Server Component
 * 
 * I2.4: Fetches real PatientState data and renders insights
 */

import React from 'react'
import PersonalInsightsV2Client from './client'
import { getCurrentUser, createServerSupabaseClient } from '@/lib/db/supabase.server'
import { redirect } from 'next/navigation'
import { safeValidatePatientState, createEmptyPatientState } from '@/lib/api/contracts/patient/state'

export const metadata = {
  title: 'Personal Insights | Rhythmologicum Connect',
  description: 'View your health metrics, trends, and achievements',
}

// Force dynamic rendering - don't prerender this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PersonalInsightsV2Page() {
  // Auth check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/?error=authentication_required')
  }

  // Fetch patient state directly from database
  let patientState = null
  let hasError = false

  try {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('patient_state')
      .select('state_data')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // If no state found, return empty state (not an error)
      if (error.code === 'PGRST116') {
        patientState = createEmptyPatientState()
      } else {
        console.error('[INSIGHTS_V2] Database error:', error)
        hasError = true
      }
    } else {
      // Validate and parse state_data
      const validatedState = safeValidatePatientState(data.state_data)
      patientState = validatedState || createEmptyPatientState()
    }
  } catch (error) {
    console.error('[INSIGHTS_V2] Error fetching patient state:', error)
    hasError = true
    patientState = createEmptyPatientState()
  }
  
  return (
    <PersonalInsightsV2Client
      initialPatientState={patientState}
      hasError={hasError}
    />
  )
}
