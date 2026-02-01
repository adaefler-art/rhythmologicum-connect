'use client'

import { ErrorState } from '@/lib/ui'
import { useEffect } from 'react'
import { logError } from '@/lib/logging/logger'

/**
 * Global error boundary
 * 
 * This component is displayed when an error occurs at the root level.
 * Part of V0.4-E6 Technical Cleanup & Stability Layer.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error
    logError('Global application error', { type: 'ui_error', area: 'global' }, error)
  }, [error])

  const message = error?.message?.startsWith('Missing env:')
    ? error.message
    : 'Beim Laden der Anwendung ist ein Fehler aufgetreten. Bitte laden Sie die Seite neu.'

  return (
    <html lang="de">
      <body>
        <div className="w-full min-h-screen flex items-center justify-center bg-background px-4 text-foreground">
          <ErrorState
            title="Ein Fehler ist aufgetreten"
            message={message}
            onRetry={reset}
            centered
          />
        </div>
      </body>
    </html>
  )
}
