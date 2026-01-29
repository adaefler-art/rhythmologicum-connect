'use client'

import { useRouter } from 'next/navigation'

/**
 * Root-level 404 Not Found page
 * 
 * This component is displayed when a route does not exist.
 * Part of V0.4 Error Handling & Stability Layer.
 */
export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 transition-colors duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center transition-colors duration-150">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Seite nicht gefunden
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Die angeforderte Seite existiert nicht oder wurde entfernt.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Zurück
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  )
}
