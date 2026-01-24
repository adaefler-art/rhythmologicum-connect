import { redirect } from 'next/navigation'

/**
 * Legacy alias for assessment entry.
 * Route: /patient/assessment -> /patient/assess
 */
export default function AssessmentAliasPage() {
  redirect('/patient/assess')
}
