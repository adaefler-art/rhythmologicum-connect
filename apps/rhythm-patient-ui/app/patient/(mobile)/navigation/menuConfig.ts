import { CANONICAL_ROUTES } from '../utils/navigation'

export type PatientMobileMenuItem = {
  id: string
  label: string
  href: string
  order: number
  enabled?: boolean
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
    id: 'start',
    label: 'Start',
    href: CANONICAL_ROUTES.START,
    order: 0,
    enabled: true,
  },
  {
    id: 'dialog',
    label: 'Dialog',
    href: CANONICAL_ROUTES.DIALOG,
    order: 1,
    enabled: true,
  },
  {
    id: 'status',
    label: 'Status & ToDos',
    href: CANONICAL_ROUTES.STATUS,
    order: 2,
    enabled: true,
  },
  {
    id: 'profile',
    label: 'Mein Profil',
    href: CANONICAL_ROUTES.PROFILE,
    order: 3,
    enabled: true,
  },
]
