'use client'

import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function NewContentPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Neue Content-Page erstellen
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Editor-Funktionalität wird in einem zukünftigen Update implementiert.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
        <div className="mx-auto max-w-md">
          <p className="text-4xl mb-4" aria-label="Bald verfügbar Symbol">
            🚧
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Editor in Entwicklung</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed mb-6">
            Die Editor-Funktionalität für Content-Pages wird in einem zukünftigen Update
            hinzugefügt.
          </p>
          <button
            onClick={() => router.push('/admin/content')}
            className="px-6 py-3 min-h-[44px] rounded-lg bg-sky-600 text-white text-sm md:text-base font-medium hover:bg-sky-700 transition touch-manipulation"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    </main>
  )
}
