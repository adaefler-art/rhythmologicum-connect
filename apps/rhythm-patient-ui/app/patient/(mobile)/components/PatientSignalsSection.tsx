/**
 * Patient Signals Section (Issue 8)
 * 
 * Displays limited, patient-friendly signal hints
 * - Collapsed by default
 * - Max 5 bullet points
 * - No scores, percentages, or technical codes
 * - No diagnostic terms
 * - Non-directive, assistive language
 */

'use client'

import { useState } from 'react'
import { Card } from '@/lib/ui/mobile-v2'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import type { PatientSignalHint } from '@/lib/types/signals'
import { getRedFlagMessage } from '@/lib/utils/signalTransform'

export interface PatientSignalsSectionProps {
  hint: PatientSignalHint | null
  loading?: boolean
}

/**
 * Patient Signals Section Component
 * Limited, non-diagnostic view for patients
 */
export function PatientSignalsSection({ hint, loading }: PatientSignalsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (loading) {
    return (
      <Card padding="md" shadow="sm" className="mb-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          <p className="text-sm text-slate-600">Hinweise werden geladen…</p>
        </div>
      </Card>
    )
  }

  if (!hint) {
    return null // Don't show section if no hints available
  }

  // Calculate total bullets (red flag message + hints + next steps)
  const totalBullets = 1 + hint.riskAreaHints.length + hint.recommendedNextSteps.length

  return (
    <Card padding="md" shadow="sm" className="mb-4">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-900 text-left">
            Automatische Hinweise (ärztlich zu prüfen)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </button>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          {/* Red flag status */}
          <div className="mb-3 px-3 py-2 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-700">
              {getRedFlagMessage(hint.hasRedFlags)}
            </p>
          </div>

          {/* Risk area hints (max 3) */}
          {hint.riskAreaHints.length > 0 && (
            <div className="mb-3">
              <ul className="space-y-2">
                {hint.riskAreaHints.map((hintText, idx) => (
                  <li key={`hint-${idx}`} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
                    <span className="text-sm text-slate-700">{hintText}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended next steps */}
          {hint.recommendedNextSteps.length > 0 && (
            <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-medium text-blue-800 mb-2">Empfehlung:</p>
              <ul className="space-y-1">
                {hint.recommendedNextSteps.map((step, idx) => (
                  <li key={`step-${idx}`} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5 flex-shrink-0">→</span>
                    <span className="text-xs text-blue-700">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-500 italic">
              Diese Hinweise sind automatisch generiert und ersetzen keine ärztliche Beratung.
            </p>
          </div>

          {/* Debug info (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-slate-400">
              Bullets: {totalBullets}/5 max
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
