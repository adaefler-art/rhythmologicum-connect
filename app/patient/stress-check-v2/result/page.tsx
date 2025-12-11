import { redirect } from 'next/navigation'

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

export default function PatientStressCheckV2ResultRedirect({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const query = buildQuery(searchParams)
  redirect(`/patient/funnel/stress-assessment/result${query}`)
}
