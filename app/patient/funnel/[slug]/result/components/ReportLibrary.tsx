/**
 * Report Library Component
 * Displays list of reports with download capability
 * V05-I03.4: Result Screen
 */

'use client'

import type { ReportWithAssessment } from '@/lib/db/queries/reports'

type ReportLibraryProps = {
  reports: ReportWithAssessment[]
}

export function ReportLibrary({ reports }: ReportLibraryProps) {
  if (reports.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: 'var(--color-neutral-100)' }}
          >
            <span className="text-3xl">📄</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Keine Berichte verfügbar</h3>
          <p className="text-sm text-slate-600">
            Es sind noch keine Berichte für dieses Assessment vorhanden.
          </p>
          <p className="text-sm text-slate-600 mt-2">
            Berichte werden automatisch erstellt, sobald Ihr Assessment ausgewertet wurde.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl flex-shrink-0">📚</span>
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">Ihre Berichte</h3>
          <p className="text-sm text-slate-600 mt-1">
            {reports.length === 1
              ? '1 Bericht verfügbar'
              : `${reports.length} Berichte verfügbar`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📄</span>
                  <span className="font-medium text-slate-900">Assessment-Bericht</span>
                </div>

                {report.report_text_short && (
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                    {report.report_text_short}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>
                    {new Intl.DateTimeFormat('de-DE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(report.created_at))}
                  </span>
                  {report.risk_level && (
                    <span className="flex items-center gap-1">
                      •
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          report.risk_level === 'low'
                            ? 'bg-green-100 text-green-800'
                            : report.risk_level === 'moderate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {report.risk_level === 'low'
                          ? 'Niedriges Risiko'
                          : report.risk_level === 'moderate'
                            ? 'Moderates Risiko'
                            : 'Hohes Risiko'}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  // For now, show info. Download could be added later
                  alert('Download-Funktion wird in Kürze verfügbar sein.')
                }}
                className="flex-shrink-0 px-3 py-2 text-sm text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded transition-colors"
                aria-label="Bericht anzeigen"
              >
                Anzeigen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
