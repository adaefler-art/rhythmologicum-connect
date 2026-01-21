/**
 * Assessment Flow v2 - Server Component
 * 
 * Entry point for the assessment flow page.
 * Fetches initial data and renders the client component.
 */

import React from 'react'
import AssessmentFlowV2Client from './client'

export const metadata = {
  title: 'Assessment Flow v2 | Rhythmologicum Connect',
  description: 'Complete your stress and resilience assessment',
}

export default async function AssessmentFlowV2Page() {
  // In production, fetch assessment data here from Supabase
  // For now, we'll use demo data in the client component
  
  const initialLoading = false
  const hasError = false
  
  return (
    <AssessmentFlowV2Client
      initialLoading={initialLoading}
      hasError={hasError}
    />
  )
}
