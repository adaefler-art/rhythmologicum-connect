import type { ResolvedUserRole } from './roleLanding'
import { getLandingForRole } from './roleLanding'

export type PostLoginRole = ResolvedUserRole | 'unknown'

type PostLoginRedirectInput = {
  role: PostLoginRole
  patientOnboardingPath?: string
}

export function getPostLoginRedirect({
  role,
  patientOnboardingPath,
}: PostLoginRedirectInput): string {
  let target = '/'

  if (role === 'patient') {
    target = patientOnboardingPath ?? getLandingForRole('patient')
  } else if (role === 'clinician' || role === 'admin' || role === 'nurse') {
    target = getLandingForRole(role)
  }

  console.log('[AUTH_REDIRECT_DECISION]', { role, target })

  return target
}