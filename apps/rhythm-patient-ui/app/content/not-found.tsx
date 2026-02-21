import Link from 'next/link'

export default function ContentNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-50 flex items-center justify-center px-4 py-8">
      <div className="w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-5xl mb-4">🔎</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Seite nicht gefunden</h1>
        <p className="text-slate-600 mb-6">
          Die angeforderte Seite ist nicht verfügbar oder wurde entfernt.
        </p>
        <Link
          href="/patient/start"
          className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Zurück zum Start
        </Link>
      </div>
    </div>
  )
}
