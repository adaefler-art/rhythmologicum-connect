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
    <div className="min-h-screen bg-background transition-colors duration-150">
      <div className="w-full px-6 py-10">
        <div className="flex items-center gap-4">
          <div className="text-5xl">🔍</div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Fehler</p>
            <h1 className="text-3xl font-bold text-foreground">404</h1>
          </div>
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-foreground">Seite nicht gefunden</h2>
        <p className="mt-2 text-muted-foreground">
          Die angeforderte Seite existiert nicht oder wurde entfernt.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => router.back()}
            className="bg-muted/40 hover:bg-muted/60 text-foreground font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Zurück
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  )
}
