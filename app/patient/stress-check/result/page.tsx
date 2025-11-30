import { Suspense } from 'react'
import StressResultClient from './StressResultClient'

// Wichtig: Diese Flags sorgen dafür, dass Next nicht versucht,
// die Seite statisch zu prerendern und immer zur Laufzeit rendert.
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function StressResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p>Ergebnis wird geladen…</p>
        </main>
      }
    >
      <StressResultClient />
    </Suspense>
  )
}
