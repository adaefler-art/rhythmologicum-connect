// app/patient/layout.tsx
import type { ReactNode } from 'react'

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
              Rhythmologicum Connect
            </p>
            <p className="text-sm font-medium text-slate-900">
              Stress &amp; Resilienz Pilot
            </p>
          </div>
          {/* optional: später Logo, Account, etc. */}
          {/* <span className="text-xs text-slate-500">Beta</span> */}
        </div>
      </header>

      {/* Hauptinhalt */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">
            Rhythmologicum Connect – frühe Testversion, nicht für den klinischen Einsatz.
          </p>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Rhythmologicum
          </p>
        </div>
      </footer>
    </div>
  )
}
