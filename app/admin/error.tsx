'use client'

import { ErrorState } from '@/lib/ui'
import { useEffect } from 'react'
import { logError } from '@/lib/logging/logger'

/**
 * Error boundary for admin routes
 * 
 * This component is displayed when an error occurs in admin pages.
 * Part of V0.4-E6 Technical Cleanup & Stability Layer.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error
    logError('Admin route error', { type: 'ui_error', area: 'admin' }, error)
  }, [error])

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <ErrorState
        title="Ein Fehler ist aufgetreten"
        message="Beim Laden der Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut."
        onRetry={reset}
        centered
      />
    </div>
  )
}
