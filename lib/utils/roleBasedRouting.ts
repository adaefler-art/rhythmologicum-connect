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
      href: '/clinician/anamnesis',
      label: 'Patient Record',
      active: pathname?.startsWith('/clinician/anamnesis') ?? false,
    },
    {
      href: '/admin/content',
      label: 'Inhalte',
      active: pathname?.startsWith('/admin/content') ?? false,
    },
    {
      href: '/admin/navigation',
      label: 'Navigation',
      active: pathname?.startsWith('/admin/navigation') ?? false,
    },
    {
      href: '/clinician/admin/reasoning-config',
      label: 'Reasoning Config',
      active: pathname?.startsWith('/clinician/admin/reasoning-config') ?? false,
    },
    {
      href: '/clinician/admin/safety-rules',
      label: 'Safety Rules',
      active: pathname?.startsWith('/clinician/admin/safety-rules') ?? false,
    },
    {
      href: '/clinician/admin/metrics',
      label: 'Metrics',
      active: pathname?.startsWith('/clinician/admin/metrics') ?? false,
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
      href: '/clinician/anamnesis',
      label: 'Patient Record',
      active: pathname?.startsWith('/clinician/anamnesis') ?? false,
    },
    {
      href: '/admin/content',
      label: 'Inhalte',
      active: pathname?.startsWith('/admin/content') ?? false,
    },
    {
      href: '/admin/navigation',
      label: 'Navigation',
      active: pathname?.startsWith('/admin/navigation') ?? false,
    },
    {
      href: '/admin/users',
      label: 'Benutzer',
      active: pathname?.startsWith('/admin/users') ?? false,
    },
    {
      href: '/clinician/admin/reasoning-config',
      label: 'Reasoning Config',
      active: pathname?.startsWith('/clinician/admin/reasoning-config') ?? false,
    },
    {
      href: '/clinician/admin/safety-rules',
      label: 'Safety Rules',
      active: pathname?.startsWith('/clinician/admin/safety-rules') ?? false,
    },
    {
      href: '/clinician/admin/metrics',
      label: 'Metrics',
      active: pathname?.startsWith('/clinician/admin/metrics') ?? false,
    },
    {
      href: '/admin/dev/endpoints',
      label: 'Endpoints',
      active: pathname?.startsWith('/admin/dev/endpoints') ?? false,
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

/**
 * Fetch navigation items from database for a specific role
 * 
 * Falls back to hardcoded navigation if:
 * - Database is not ready (schema not deployed)
 * - API call fails
 * - No configuration exists for the role
 * 
 * @param role - User role
 * @param pathname - Current pathname for active state
 * @returns Navigation items with active state
 */
export async function fetchNavItemsForRole(
  role: UserRole,
  pathname: string,
): Promise<RoleNavItem[]> {
  try {
    // Fetch navigation config from API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
    
    const response = await fetch('/api/admin/navigation', {
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      // Log specific error for debugging
      if (response.status === 503) {
        console.warn('Navigation config schema not ready (503), using fallback')
      } else if (response.status >= 500) {
        console.warn(`Navigation config server error (${response.status}), using fallback`)
      } else {
        console.warn(`Navigation config failed (${response.status}), using fallback`)
      }
      return getFallbackNavItems(role, pathname)
    }

    const data = await response.json()
    
    if (!data.success || !data.data) {
      return getFallbackNavItems(role, pathname)
    }

    const { items, configs } = data.data

    // Filter and sort items for this role
    const roleConfigs = configs
      .filter((c: { role: string; is_enabled: boolean }) => c.role === role && c.is_enabled)
      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)

    // Build navigation items from configs
    const navItems: RoleNavItem[] = roleConfigs.map((config: {
      navigation_item_id: string
      custom_label: string | null
      order_index: number
    }) => {
      const item = items.find((i: { id: string }) => i.id === config.navigation_item_id)
      if (!item) return null

      return {
        href: item.route,
        label: config.custom_label || item.default_label,
        active:
          pathname === item.route ||
          (item.route !== '/clinician' && pathname?.startsWith(item.route)) ||
          false,
      }
    }).filter(Boolean) as RoleNavItem[]

    // Ensure admin user management is reachable even if DB nav config is outdated
    if (role === 'admin' && !navItems.some((item) => item.href === '/admin/users')) {
      navItems.push({
        href: '/admin/users',
        label: 'Benutzer',
        active: pathname?.startsWith('/admin/users') ?? false,
      })
    }

    if (
      (role === 'admin' || role === 'clinician') &&
      !navItems.some((item) => item.href === '/clinician/admin/metrics')
    ) {
      navItems.push({
        href: '/clinician/admin/metrics',
        label: 'Metrics',
        active: pathname?.startsWith('/clinician/admin/metrics') ?? false,
      })
    }

    if ((role === 'admin' || role === 'clinician') && !navItems.some((item) => item.href === '/admin/cms')) {
      navItems.push({
        href: '/admin/cms',
        label: 'CMS',
        active: pathname?.startsWith('/admin/cms') ?? false,
      })
    }

    // If we got items from DB, return them
    if (navItems.length > 0) {
      return navItems
    }

    // Otherwise fallback to hardcoded
    return getFallbackNavItems(role, pathname)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Navigation config request timed out, using fallback')
    } else {
      console.warn('Error fetching navigation config:', error)
    }
    return getFallbackNavItems(role, pathname)
  }
}

/**
 * Get fallback navigation items when DB config is unavailable
 */
function getFallbackNavItems(role: UserRole, pathname: string): RoleNavItem[] {
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
      return []
  }
}

