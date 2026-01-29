'use client'

import { useRouter } from 'next/navigation'

/**
 * F7: Custom 404 page for content pages
 */
export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-3">Seite nicht gefunden</h2>
        <p className="text-slate-600 mb-6">
          Die angeforderte Info-Seite existiert nicht oder wurde entfernt.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Zurück
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  )
}
