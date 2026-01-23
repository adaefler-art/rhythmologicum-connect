'use client'

import Link from 'next/link'
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
    <div className="p-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <ErrorState
          title="Ein Fehler ist aufgetreten"
          message="Beim Laden der Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut."
          onRetry={reset}
        />
        <div className="mt-4">
          <Link
            href="/admin"
            className="inline-flex gap-2 text-sm font-medium text-sky-600 hover:text-sky-700 transition"
          >
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    </div>
  )
}
