/**
 * Key Outcomes Component
 * Displays summary of assessment outcomes
 * V05-I03.4: Result Screen
 */

'use client'

import type { KeyOutcomes } from '@/lib/db/queries/reports'

type KeyOutcomesCardProps = {
  outcomes: KeyOutcomes | null
}

export function KeyOutcomesCard({ outcomes }: KeyOutcomesCardProps) {
  if (!outcomes) {
    return null
  }

  const hasData =
    outcomes.score_numeric !== null ||
    outcomes.sleep_score !== null ||
    outcomes.risk_level !== null

  if (!hasData) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: 'var(--color-neutral-100)' }}
          >
            <span className="text-3xl">📊</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            Auswertung wird vorbereitet
          </h3>
          <p className="text-sm text-slate-600">
            Ihre detaillierten Ergebnisse werden in Kürze verfügbar sein.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl flex-shrink-0">📊</span>
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            Wichtige Ergebnisse
          </h3>
          <p className="text-sm text-slate-600 mt-1">Zusammenfassung Ihrer Bewertung</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stress Score */}
        {outcomes.score_numeric !== null && (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">
              Stress-Level
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {outcomes.score_numeric}
              <span className="text-base text-slate-500">/100</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-sky-600"
                style={{ width: `${outcomes.score_numeric}%` }}
              />
            </div>
          </div>
        )}

        {/* Sleep Score */}
        {outcomes.sleep_score !== null && (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">
              Schlaf-Qualität
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {outcomes.sleep_score}
              <span className="text-base text-slate-500">/100</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-indigo-600"
                style={{ width: `${outcomes.sleep_score}%` }}
              />
            </div>
          </div>
        )}

        {/* Risk Level */}
        {outcomes.risk_level && (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">
              Risiko-Einstufung
            </div>
            <div
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
                outcomes.risk_level === 'low'
                  ? 'bg-green-100 text-green-800'
                  : outcomes.risk_level === 'moderate'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {outcomes.risk_level === 'low'
                ? '✓ Niedrig'
                : outcomes.risk_level === 'moderate'
                  ? '⚠ Moderat'
                  : '⚠ Hoch'}
            </div>
            <p className="text-xs text-slate-600 mt-2">
              {outcomes.risk_level === 'low'
                ? 'Gute Bewältigungsstrategien'
                : outcomes.risk_level === 'moderate'
                  ? 'Unterstützung empfohlen'
                  : 'Professionelle Beratung empfohlen'}
            </p>
          </div>
        )}
      </div>

      {outcomes.total_reports > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            Basierend auf {outcomes.total_reports}{' '}
            {outcomes.total_reports === 1 ? 'Bericht' : 'Berichten'}
          </p>
        </div>
      )}
    </div>
  )
}
