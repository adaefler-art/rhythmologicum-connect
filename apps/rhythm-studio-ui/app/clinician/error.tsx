'use client'

import { ErrorState } from '@/lib/ui'
import { useEffect } from 'react'
import { logError } from '@/lib/logging/logger'

/**
 * Error boundary for clinician routes
 * 
 * This component is displayed when an error occurs in clinician pages.
 * Part of V0.4-E6 Technical Cleanup & Stability Layer.
 */
export default function ClinicianError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error
    logError('Clinician route error', { type: 'ui_error', area: 'clinician' }, error)
  }, [error])

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background px-4 text-foreground">
      <ErrorState
        title="Ein Fehler ist aufgetreten"
        message="Beim Laden der Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut."
        onRetry={reset}
        centered
      />
    </div>
  )
}
