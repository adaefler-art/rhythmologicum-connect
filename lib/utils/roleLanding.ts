export type ResolvedUserRole = 'patient' | 'clinician' | 'admin' | 'nurse'

export function getLandingForRole(role: ResolvedUserRole): string {
  switch (role) {
    case 'patient':
      return '/patient'
    case 'clinician':
    case 'nurse':
      return '/clinician'
    case 'admin':
      return '/admin'
  }
}
