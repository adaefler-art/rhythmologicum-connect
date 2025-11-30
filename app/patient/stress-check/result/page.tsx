import { Suspense } from 'react'
import StressResultClient from './StressResultClient'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Props = {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function StressResultPage({ searchParams }: Props) {
  // Unterstütze beide Varianten: ?assessmentId=... und ?assessment=...
  const rawParam = searchParams.assessmentId ?? searchParams.assessment

  const assessmentId = Array.isArray(rawParam) ? rawParam[0] : rawParam

  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p>Ergebnis wird geladen…</p>
        </main>
      }
    >
      <StressResultClient assessmentId={assessmentId} />
    </Suspense>
  )
}
