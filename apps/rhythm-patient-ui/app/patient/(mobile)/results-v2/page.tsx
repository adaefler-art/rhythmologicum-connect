"use client"

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const assessmentId = searchParams.get('assessmentId') ?? ''
  const slug = searchParams.get('funnel') ?? ''
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
