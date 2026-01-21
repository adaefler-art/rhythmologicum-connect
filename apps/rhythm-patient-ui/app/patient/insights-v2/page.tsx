/**
 * Personal Insights v2 - Server Component
 * 
 * Entry point for the personal insights page.
 * Fetches user health data and renders the client component.
 */

import React from 'react'
import PersonalInsightsV2Client from './client'

export const metadata = {
  title: 'Personal Insights | Rhythmologicum Connect',
  description: 'View your health metrics, trends, and achievements',
}

export default async function PersonalInsightsV2Page() {
  // In production, fetch user health data here from Supabase
  // For now, we'll use demo data in the client component
  
  const initialLoading = false
  const hasError = false
  
  return (
    <PersonalInsightsV2Client
      initialLoading={initialLoading}
      hasError={hasError}
    />
  )
}
