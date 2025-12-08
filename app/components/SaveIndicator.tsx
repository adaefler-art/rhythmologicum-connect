import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { SaveState } from '@/lib/hooks/useAssessmentAnswer'

export type SaveIndicatorProps = {
  saveState: SaveState
  error?: string | null
  onRetry?: () => void
}

/**
 * Save Indicator Component
 * 
 * Shows the current save state of an answer with appropriate visual feedback.
 * Displays icons and messages for: idle, saving, saved, and error states.
 * 
 * @example
 * ```tsx
 * <SaveIndicator saveState="saving" />
 * <SaveIndicator saveState="error" error="Network error" onRetry={handleRetry} />
 * ```
 */
export default function SaveIndicator({ saveState, error, onRetry }: SaveIndicatorProps) {
  if (saveState === 'idle') {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {saveState === 'saving' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
          <span className="text-sky-700">Speichert...</span>
        </>
      )}

      {saveState === 'saved' && (
        <>
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span className="text-emerald-700">Gespeichert</span>
        </>
      )}

      {saveState === 'error' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-full">
          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 text-xs leading-tight">
              {error || 'Speicherfehler'}
            </p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs font-medium text-red-700 hover:text-red-900 underline"
            >
              Erneut versuchen
            </button>
          )}
        </div>
      )}
    </div>
  )
}
