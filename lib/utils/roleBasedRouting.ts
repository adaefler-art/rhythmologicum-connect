import type { User } from '@supabase/supabase-js'

/**
 * User roles in the application
 */
export type UserRole = 'patient' | 'clinician' | 'admin' | 'nurse'

/**
 * Navigation item for role-based menus
 */
export interface RoleNavItem {
  href: string
  label: string
  icon?: React.ReactNode
  active?: boolean
}

/**
 * Get the user's role from their metadata
 */
export function getUserRole(user: User | null): UserRole | null {
  if (!user) return null
  const role = user.app_metadata?.role || user.user_metadata?.role
  return role as UserRole | null
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: User | null, requiredRole: UserRole): boolean {
  const role = getUserRole(user)
  return role === requiredRole
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(user: User | null, requiredRoles: UserRole[]): boolean {
  const role = getUserRole(user)
  return role ? requiredRoles.includes(role) : false
}

/**
 * Get the default landing page for a user based on their role
 */
export function getRoleLandingPage(user: User | null): string {
  const role = getUserRole(user)
  
  switch (role) {
    case 'clinician':
      return '/clinician'
    case 'admin':
      // Admins share the same dashboard as clinicians
      return '/clinician'
    case 'nurse':
      // Nurses share the same dashboard as clinicians
      return '/clinician'
    case 'patient':
      return '/patient'
    default:
      return '/patient'
  }
}

/**
 * Get navigation items for clinician/admin role
 * 
 * Returns user-friendly navigation with clear, non-technical labels.
 * Navigation order reflects typical workflow: overview -> triage -> assessments -> content.
 */
export function getClinicianNavItems(pathname: string): RoleNavItem[] {
  return [
    {
      href: '/clinician',
      label: 'Übersicht',
      active: pathname === '/clinician',
    },
    {
      href: '/clinician/triage',
      label: 'Triage',
      active: pathname?.startsWith('/clinician/triage') ?? false,
    },
    {
      href: '/clinician/pre-screening',
      label: 'Pre-Screening',
      active: pathname?.startsWith('/clinician/pre-screening') ?? false,
    },
    {
      href: '/clinician/shipments',
      label: 'Geräteversand',
      active: pathname?.startsWith('/clinician/shipments') ?? false,
    },
    {
      href: '/clinician/funnels',
      label: 'Fragebögen',
      active: pathname?.startsWith('/clinician/funnels') ?? false,
    },
    {
      href: '/admin/content',
      label: 'Inhalte',
      active: pathname?.startsWith('/admin/content') ?? false,
    },
  ]
}

/**
 * Get navigation items for admin role
 * 
 * Admins get additional navigation items including design system access.
 */
export function getAdminNavItems(pathname: string): RoleNavItem[] {
  return [
    {
      href: '/clinician',
      label: 'Übersicht',
      active: pathname === '/clinician',
    },
    {
      href: '/clinician/triage',
      label: 'Triage',
      active: pathname?.startsWith('/clinician/triage') ?? false,
    },
    {
      href: '/clinician/pre-screening',
      label: 'Pre-Screening',
      active: pathname?.startsWith('/clinician/pre-screening') ?? false,
    },
    {
      href: '/clinician/shipments',
      label: 'Geräteversand',
      active: pathname?.startsWith('/clinician/shipments') ?? false,
    },
    {
      href: '/clinician/funnels',
      label: 'Fragebögen',
      active: pathname?.startsWith('/clinician/funnels') ?? false,
    },
    {
      href: '/admin/content',
      label: 'Inhalte',
      active: pathname?.startsWith('/admin/content') ?? false,
    },
    {
      href: '/admin/design-system',
      label: 'Design System',
      active: pathname?.startsWith('/admin/design-system') ?? false,
    },
  ]
}

/**
 * Get navigation items for patient role
 * 
 * Patient-facing navigation with clear, friendly labels in German.
 * Simple two-item navigation: start assessment -> view history.
 */
export function getPatientNavItems(pathname: string): RoleNavItem[] {
  return [
    {
      href: '/patient/funnels',
      label: 'Fragebogen starten',
      active:
        pathname?.startsWith('/patient/assessment') || 
        pathname?.startsWith('/patient/funnel/') || 
        false,
    },
    {
      href: '/patient/history',
      label: 'Mein Verlauf',
      active: pathname === '/patient/history',
    },
  ]
}

/**
 * Get navigation items for nurse role
 * 
 * Nurse navigation shares clinician dashboard access but with nurse-specific label.
 * Nurses can view patient assessments and manage their workflow.
 */
export function getNurseNavItems(pathname: string): RoleNavItem[] {
  return [
    {
      href: '/clinician',
      label: 'Übersicht',
      active: pathname === '/clinician',
    },
    {
      href: '/clinician/triage',
      label: 'Triage',
      active: pathname?.startsWith('/clinician/triage') ?? false,
    },
    {
      href: '/clinician/shipments',
      label: 'Geräteversand',
      active: pathname?.startsWith('/clinician/shipments') ?? false,
    },
    {
      href: '/clinician/funnels',
      label: 'Fragebögen',
      active: pathname?.startsWith('/clinician/funnels') ?? false,
    },
  ]
}

/**
 * Get navigation items based on user role
 * 
 * Automatically returns the appropriate navigation items for the user's role.
 * This is the recommended way to get navigation items in layouts.
 * 
 * Fail-closed: Returns empty array if role cannot be determined or user is not authenticated.
 */
export function getNavItemsForRole(user: User | null, pathname: string): RoleNavItem[] {
  // Fail-closed: unauthenticated users get no navigation
  if (!user) {
    return []
  }
  
  const role = getUserRole(user)
  
  switch (role) {
    case 'admin':
      return getAdminNavItems(pathname)
    case 'clinician':
      return getClinicianNavItems(pathname)
    case 'nurse':
      return getNurseNavItems(pathname)
    case 'patient':
      return getPatientNavItems(pathname)
    default:
      // Fail-closed: unknown roles get no privileged navigation
      return []
  }
}

/**
 * Get role display name in German
 */
export function getRoleDisplayName(role: UserRole | null): string {
  switch (role) {
    case 'clinician':
      return 'Clinician'
    case 'admin':
      return 'Administrator'
    case 'nurse':
      return 'Nurse'
    case 'patient':
      return 'Patient'
    default:
      return 'Benutzer'
  }
}

/**
 * Check if a route is accessible for a given role
 */
export function canAccessRoute(user: User | null, route: string): boolean {
  const role = getUserRole(user)
  
  // Public routes (login, datenschutz, etc.)
  if (route === '/' || route.startsWith('/datenschutz')) {
    return true
  }
  
  // Patient routes
  if (route.startsWith('/patient')) {
    return role === 'patient' || role === 'clinician' || role === 'admin' || role === 'nurse'
  }
  
  // Clinician routes
  if (route.startsWith('/clinician')) {
    return role === 'clinician' || role === 'admin' || role === 'nurse'
  }
  
  // Admin routes (clinicians also have access)
  if (route.startsWith('/admin')) {
    return role === 'clinician' || role === 'admin'
  }
  
  return false
}
