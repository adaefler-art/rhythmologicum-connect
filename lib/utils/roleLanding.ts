export type ResolvedUserRole = 'patient' | 'clinician' | 'admin' | 'nurse'

export function getLandingForRole(role: ResolvedUserRole): string {
  switch (role) {
    case 'patient':
      return '/patient/dashboard'
    case 'clinician':
    case 'nurse':
      return '/clinician'
    case 'admin':
      return '/admin'
  }
}
