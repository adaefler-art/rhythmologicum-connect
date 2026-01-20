import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dialog - Rhythmologicum Connect',
  description: 'Kommunikation und Beratung',
}

export default function DialogPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Dialog
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Dieser Bereich wird in Zukunft Kommunikation und Beratung ermöglichen.
        </p>
        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-md p-4">
          <p className="text-sm text-sky-900 dark:text-sky-100">
            📬 In Entwicklung: Nachrichten und Beratungsfunktionen
          </p>
        </div>
      </div>
    </div>
  )
}
