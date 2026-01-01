import { redirect } from 'next/navigation'
import { getOnboardingStatus } from '@/lib/actions/onboarding'

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
  // Check onboarding status
  const statusResult = await getOnboardingStatus()

  if (!statusResult.success) {
    // Not authenticated - redirect to login
    redirect('/login')
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
  // Onboarding complete - redirect to funnel selector page
  redirect(`/patient/assessment${query}`)
}
