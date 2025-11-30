import { Suspense } from 'react'
import StressResultClient from './StressResultClient'

export const dynamic = 'force-dynamic'

export default function StressResultPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center">
      <p>Ergebnis wird geladen…</p>
    </main>}>
      <StressResultClient />
    </Suspense>
  )
}
