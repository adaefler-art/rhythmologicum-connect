import type { User } from '@supabase/supabase-js'

/**
 * User roles in the application
 */
export type UserRole = 'patient' | 'clinician' | 'admin'

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
    case 'patient':
      return '/patient'
    default:
      return '/patient'
  }
}

/**
 * Get navigation items for clinician/admin role
 */
export function getClinicianNavItems(pathname: string): RoleNavItem[] {
  return [
    {
      href: '/clinician',
      label: 'Dashboard',
      active: pathname === '/clinician',
    },
    {
      href: '/clinician/funnels',
      label: 'Funnels',
      active: pathname?.startsWith('/clinician/funnels') ?? false,
    },
    {
      href: '/admin/content',
      label: 'Content',
      active: pathname?.startsWith('/admin/content') ?? false,
    },
  ]
}

/**
 * Get navigation items for patient role
 */
export function getPatientNavItems(pathname: string): RoleNavItem[] {
  return [
    {
      href: '/patient/assessment',
      label: 'Assessments',
      active:
        pathname?.startsWith('/patient/assessment') || pathname?.startsWith('/patient/funnel') || false,
    },
    {
      href: '/patient/history',
      label: 'Verlauf',
      active: pathname === '/patient/history',
    },
  ]
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
    return role === 'patient' || role === 'clinician' || role === 'admin'
  }
  
  // Clinician routes
  if (route.startsWith('/clinician')) {
    return role === 'clinician' || role === 'admin'
  }
  
  // Admin routes (clinicians also have access)
  if (route.startsWith('/admin')) {
    return role === 'clinician' || role === 'admin'
  }
  
  return false
}
