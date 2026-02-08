import { CANONICAL_ROUTES } from '../utils/navigation'

export type PatientMobileMenuItem = {
  id: string
  label: string
  href: string
  order: number
}

/**
 * Patient Mobile Menu Items (Issue 2 - Chat-First)
 * 
 * Navigation menu configuration for the patient portal.
 * Items are rendered in order (0-indexed).
 * 
 * Issue 2 Changes:
 * - Dialog (PAT Chat) is now the primary entry point (order: 0)
 * - Home/Dashboard is secondary (order: 1)
 * - Check-In and Profile follow
 */
export const PATIENT_MOBILE_MENU_ITEMS: PatientMobileMenuItem[] = [
  {
    id: 'dialog',
    label: 'Chat',
    href: CANONICAL_ROUTES.DIALOG,
    order: 0,
  },
  {
    id: 'home',
    label: 'Dashboard',
    href: CANONICAL_ROUTES.DASHBOARD,
    order: 1,
  },
  {
    id: 'check-in',
    label: 'Check-In',
    href: CANONICAL_ROUTES.ASSESS,
    order: 2,
  },
  {
    id: 'profile',
    label: 'Profil',
    href: CANONICAL_ROUTES.PROFILE,
    order: 3,
  },
]
