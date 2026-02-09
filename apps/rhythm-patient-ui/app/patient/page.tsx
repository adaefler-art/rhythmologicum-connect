import { redirect } from 'next/navigation'
import LoginPage from '@/app/components/LoginPage'
import { getOnboardingStatus } from '@/lib/actions/onboarding'
import { getPatientEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

type SearchParams = { [key: string]: string | string[] | undefined }

function buildQuery(searchParams?: SearchParams): string {
  if (!searchParams) return ''

  const params = new URLSearchParams()

  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      params.set(key, value)
    } else if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item))
    }
  })

  const query = params.toString()
  return query ? `?${query}` : ''
}

export default async function PatientIndexRedirect({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  try {
    getPatientEnv()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Missing env'
    console.error('[PATIENT_ENTRY] Missing environment configuration', {
      message,
    })
    throw new Error(message)
  }

  // Check onboarding status
  let statusResult
  try {
    statusResult = await getOnboardingStatus()
  } catch (err) {
    console.error('[PATIENT_ENTRY] Failed to resolve onboarding status', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-6 text-center">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Bitte erneut versuchen</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Der Einstieg ist aktuell nicht verfügbar. Bitte laden Sie die Seite neu.
          </p>
        </div>
      </main>
    )
  }

  if (!statusResult.success) {
    // Not authenticated - render login UI
    return <LoginPage />
  }

  const status = statusResult.data!

  // Redirect to appropriate onboarding step if not complete
  if (!status.hasConsent) {
    redirect('/patient/onboarding/consent')
  }

  if (!status.hasProfile) {
    redirect('/patient/onboarding/profile')
  }

  const query = buildQuery(searchParams)
  // Entry screen landing for the patient experience
  redirect(`/patient/start${query}`)
}
