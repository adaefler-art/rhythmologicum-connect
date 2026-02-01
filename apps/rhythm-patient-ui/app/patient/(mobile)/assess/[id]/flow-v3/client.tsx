'use client'

/**
 * E74.4 — Patient Funnel Execution UI v1 - Page Wrapper
 * 
 * Wraps the FunnelRunner component and handles completion/exit navigation.
 */

import { useRouter } from 'next/navigation'
import { FunnelRunner } from '../../components/FunnelRunner'

interface FunnelRunnerPageProps {
  slug: string
}

export function FunnelRunnerPage({ slug }: FunnelRunnerPageProps) {
  const router = useRouter()

  const handleComplete = (assessmentId: string) => {
    // Navigate to result page
    router.push(`/patient/assess/${slug}/flow?assessmentId=${assessmentId}`)
  }

  const handleExit = () => {
    // Navigate back to assessment list
    router.push('/patient/assess')
  }

  return (
    <FunnelRunner
      slug={slug}
      mode="live"
      onComplete={handleComplete}
      onExit={handleExit}
    />
  )
}
