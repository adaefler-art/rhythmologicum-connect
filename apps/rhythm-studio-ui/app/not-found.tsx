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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-150">
      <div className="bg-card text-foreground rounded-2xl shadow-xl p-8 max-w-md w-full text-center transition-colors duration-150">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-foreground mb-3">404</h1>
        <h2 className="text-xl font-semibold text-muted-foreground mb-3">
          Seite nicht gefunden
        </h2>
        <p className="text-muted-foreground mb-6">
          Die angeforderte Seite existiert nicht oder wurde entfernt.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="bg-muted/40 hover:bg-muted/60 text-foreground font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Zurück
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  )
}
