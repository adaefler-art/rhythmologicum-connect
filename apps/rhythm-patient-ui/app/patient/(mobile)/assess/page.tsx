import type { Metadata } from 'next'
import AssessmentsListClient from './client'

export const metadata: Metadata = {
  title: 'Assessments - Rhythmologicum Connect',
  description: 'Ihre verfügbaren Assessments und nächste Schritte.',
}

type SearchParams = { [key: string]: string | string[] | undefined }

/**
 * V2 Assessment Landing Page
 * 
 * This route renders the funnel catalog for available assessments.
 * 
 * Route: /patient/assess
 */
export default async function AssessPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const stateParam = typeof searchParams?.state === 'string' ? searchParams.state : undefined
  const initialState =
    stateParam === 'loading' ||
    stateParam === 'error' ||
    stateParam === 'empty'
      ? stateParam
      : 'live'

  return <AssessmentsListClient initialState={initialState} />
}
