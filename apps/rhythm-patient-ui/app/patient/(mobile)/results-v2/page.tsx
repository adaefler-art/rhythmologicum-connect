"use client"

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import ResultsV2Client from './client'

/**
 * Results & Next Steps v2 Page
 * 
 * Modern mobile-first results page using mobile-v2 design system.
 * Displays assessment results with AMY summary, current situation, recommended actions,
 * data protection info, and next steps timeline.
 * 
 * Features:
 * - AMY summary card with AI-generated overview and gradient background
 * - Overall wellness score with circular progress indicator
 * - Current situation with bullet points (stress, sleep, activity, wellbeing)
 * - 4 recommended action cards (Download PDF, Video, Book Visit, Chat with AMY)
 * - Data protection information card
 * - "What happens next" timeline with steps
 * - Loading, empty, and error states
 * - Demo fixture data for development
 * 
 * Route: /patient/results-v2
 */
export default function ResultsV2Page() {
  const search = useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined') return () => undefined
      window.addEventListener('popstate', onChange)
      window.addEventListener('hashchange', onChange)
      return () => {
        window.removeEventListener('popstate', onChange)
        window.removeEventListener('hashchange', onChange)
      }
    },
    () => (typeof window !== 'undefined' ? window.location.search : ''),
    () => '',
  )

  const params = new URLSearchParams(search)
  const assessmentId = params.get('assessmentId') ?? ''
  const slug = params.get('funnel') ?? ''
  if (!assessmentId || !slug) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6 flex flex-col items-center justify-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1f2937] mb-4">Fehlende Parameter</h1>
          <p className="text-[#6b7280] mb-6">assessmentId und/oder funnel (Slug) fehlen. Bitte rufen Sie die Seite über einen gültigen Link auf.</p>
          <Link
            className="bg-[#4a90e2] text-white px-4 py-2 rounded inline-flex items-center justify-center"
            href="/patient/assess"
          >
            Zur Übersicht
          </Link>
        </div>
      </div>
    )
  }
  return <ResultsV2Client assessmentId={assessmentId} slug={slug} />
}
